import { BrowserWindow, shell, WebContentsView, Input } from 'electron'
import { ChatLocation, ChatProviderId, ChatProvider, ChatRecord, CHAT_PROVIDERS, getBuiltInProvider, IGNORED_CHAT_IDS } from '@shared/chat'
import { ChatRepository } from '@main/repos/chat-repo'
import { CustomProviderRepository } from '@main/repos/custom-provider-repo'
import { ViewBounds } from '@shared/layout'
import { NavigationController } from '@main/controllers/navigation-controller'

const SYNC_TIMEOUT_MS = 50
const TITLE_PROTECTION_DELAY_MS = 5000

export class ChatController {
  private readonly view: WebContentsView

  private activeId: number | null = null
  private currentLocation: ChatLocation | null = null
  private pendingNewChatFolderId: number | null = null

  private syncTimeout: NodeJS.Timeout | null = null
  private protectionTimeout: NodeJS.Timeout | null = null

  constructor(
    private readonly window: BrowserWindow,
    private readonly repository: ChatRepository,
    private readonly navigation: NavigationController,
    private readonly customProviderRepository: CustomProviderRepository
  ) {
    this.view = new WebContentsView({
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })

    this.view.setBackgroundColor('#00000000')
    this.view.setVisible(false)
    this.window.contentView.addChildView(this.view)

    this.view.webContents.setWindowOpenHandler(({ url, disposition }) => {
      if (disposition === 'foreground-tab' || disposition === 'background-tab') {
        shell.openExternal(url)
        return { action: 'deny' }
      }

      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          parent: this.window,
          modal: true,
          autoHideMenuBar: true
        }
      }
    })

    this.view.webContents.on('did-navigate', () => this.scheduleSync())
    this.view.webContents.on('did-navigate-in-page', () => this.scheduleSync())
    this.view.webContents.on('page-title-updated', () => this.scheduleSync())
  }

  async start(): Promise<void> {
    this.activeId = null
    this.currentLocation = null
    this.pendingNewChatFolderId = null
    this.view.setVisible(false)
  }

  setBounds(bounds: ViewBounds): void {
    this.view.setBounds(bounds)
  }

  setVisible(visible: boolean): void {
    this.view.setVisible(visible)
  }

  async openChat(chatId: number): Promise<void> {
    this.pendingNewChatFolderId = null

    const chat = this.repository.getChatById(chatId)
    if (!chat) {
      return
    }

    const location: ChatLocation = { providerId: chat.providerId, chatId: chat.chatId }
    const url = this.getChatUrl(location)

    this.activeId = chat.id
    this.currentLocation = location
    this.repository.updateLastOpened(chat.id)
    this.emitChatsChanged()
    this.startTitleProtection()

    this.view.setVisible(true)
    this.updateAppTitle(chat)
    this.emitActiveChatChanged(chat.id, chat.folderId)

    await this.view.webContents.loadURL(url).catch(() => undefined)
  }

  async openNewChat(providerId: ChatProviderId, folderId: number | null = null): Promise<void> {
    const url = this.getNewChatUrl(providerId)

    this.activeId = null
    this.currentLocation = null
    this.pendingNewChatFolderId = folderId
    this.clearTitleProtection()

    this.view.setVisible(true)
    this.window.setTitle('CentraLLM')
    this.emitActiveChatChanged(null, folderId)

    await this.view.webContents.loadURL(url).catch(() => undefined)
  }

  closeChatIfActive(chatId: number): void {
    if (!this.currentLocation || this.activeId !== chatId) {
      return
    }
    const providerId = this.currentLocation.providerId

    this.activeId = null
    this.currentLocation = null
    this.pendingNewChatFolderId = null
    this.clearTitleProtection()
    this.updateAppTitle()
    this.emitActiveChatChanged(null, null)

    void this.view.webContents.loadURL(this.getNewChatUrl(providerId)).catch(() => undefined)
  }

  reloadView(): void {
    this.view.webContents.reload()
  }

  onBeforeViewInput(handler: (event: { preventDefault(): void }, input: Input) => void): void {
    this.view.webContents.on('before-input-event', handler)
  }

  destroy(): void {
    this.clearTitleProtection()
    this.pendingNewChatFolderId = null
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout)
    }
    this.view.webContents.close()
  }

  getActiveChatId(): number | null {
    return this.activeId
  }

  private scheduleSync(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout)
    }
    this.syncTimeout = setTimeout(() => this.performSync(), SYNC_TIMEOUT_MS)
  }

  private performSync(): void {
    const currentUrl = this.view.webContents.getURL()
    const currentTitle = this.view.webContents.getTitle()

    const location = this.extractChatLocation(currentUrl)
    if (!location) {
      this.currentLocation = null
      return
    }
    this.currentLocation = location

    const existingChat = this.repository.getChatByLocation(this.currentLocation)
    if (existingChat) {
      this.pendingNewChatFolderId = null
    }

    if (existingChat && existingChat.id !== this.activeId) {
      this.activeId = existingChat.id
      this.repository.updateLastOpened(existingChat.id)
      this.emitChatsChanged()
      this.startTitleProtection()
    }

    if (existingChat && this.protectionTimeout) {
      this.updateAppTitle(existingChat)
      if (this.activeId !== existingChat.id) {
        this.activeId = existingChat.id
        this.emitActiveChatChanged(existingChat.id, existingChat.folderId)
      }
      return
    }

    const chatTitle = this.cleanChatTitle(currentTitle, location.providerId)
    if (!chatTitle) {
      return
    }

    const folderId = this.pendingNewChatFolderId
    const chat = this.repository.upsertChat(location, chatTitle, folderId)
    if (folderId !== null) {
      this.pendingNewChatFolderId = null
    }

    if (this.activeId !== chat.id) {
      this.activeId = chat.id
      this.emitActiveChatChanged(chat.id, chat.folderId)
    }

    this.updateAppTitle(chat)
    this.emitChatsChanged()
  }

  private startTitleProtection(): void {
    if (this.protectionTimeout) {
      clearTimeout(this.protectionTimeout)
    }
    this.protectionTimeout = setTimeout(() => {
      this.protectionTimeout = null
      this.performSync()
    }, TITLE_PROTECTION_DELAY_MS)
  }

  private clearTitleProtection(): void {
    if (this.protectionTimeout) {
      clearTimeout(this.protectionTimeout)
      this.protectionTimeout = null
    }
  }

  private updateAppTitle(chat?: ChatRecord): void {
    this.navigation.setChatTitle(chat?.title ?? null)
  }

  private emitChatsChanged(): void {
    this.window.webContents.send('chats:changed', this.repository.listChats())
  }

  private emitActiveChatChanged(chatId: number | null, folderId: number | null = null): void {
    this.window.webContents.send('chats:active-changed', chatId, folderId)
  }

  private getChatUrl(chatLocation: ChatLocation): string {
    const provider = this.getChatProvider(chatLocation.providerId)
    return `${provider.chatUrlPrefix}${chatLocation.chatId}`
  }

  private getNewChatUrl(providerId: ChatProviderId): string {
    return this.getChatProvider(providerId).newChatUrl
  }

  private getCustomProviders(): ChatProvider[] {
    return this.customProviderRepository.list()
  }

  private getChatProvider(providerId: ChatProviderId): ChatProvider {
    const builtIn = getBuiltInProvider(providerId)
    if (builtIn) {
      return builtIn
    }
    const custom = this.getCustomProviders().find((provider) => provider.id === providerId)
    if (custom) {
      return custom
    }
    throw new Error(`Unknown chat provider: ${providerId}`)
  }

  private cleanChatTitle(title: string, providerId: ChatProviderId): string {
    const provider = this.getChatProvider(providerId)
    const cleanedTitle = title.trim()
    if (provider.titleSuffix && cleanedTitle.endsWith(provider.titleSuffix)) {
      return cleanedTitle.slice(0, -provider.titleSuffix.length).trim()
    }
    return cleanedTitle
  }

  private extractChatLocation(rawUrl: string): ChatLocation | null {
    try {
      const url = new URL(rawUrl)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return null
      }

      const href = url.href

      for (const provider of CHAT_PROVIDERS) {
        if (!href.startsWith(provider.chatUrlPrefix)) {
          continue
        }
        const chatId = this.extractChatId(href, provider)
        if (chatId) {
          return { providerId: provider.id, chatId }
        }
      }

      const customProviders = this.getCustomProviders()
      for (const provider of customProviders) {
        if (!href.startsWith(provider.chatUrlPrefix)) {
          continue
        }
        const chatId = this.extractChatId(href, provider)
        if (chatId) {
          return { providerId: provider.id, chatId }
        }
      }

      return null
    } catch {
      return null
    }
  }

  private extractChatId(href: string, provider: ChatProvider): string | null {
    const chatId = href.slice(provider.chatUrlPrefix.length).split('/')[0]?.split('?')[0]?.split('#')[0]?.split('&')[0]?.trim()
    if (!chatId || IGNORED_CHAT_IDS.has(chatId.toLowerCase())) {
      return null
    }
    if (provider.chatIdExclusionRegex) {
      try {
        const regex = new RegExp(provider.chatIdExclusionRegex, 'i')
        if (regex.test(chatId)) {
          return null
        }
      } catch {
        console.log(`Invalid regex pattern for ${provider.name}: "${provider.chatIdExclusionRegex}"`)
      }
    }
    return chatId
  }
}
