import { BrowserWindow, shell, WebContentsView } from 'electron'
import { getChatUrl, getNewChatUrl, extractChatLocation, ChatLocation, ChatProviderId, cleanChatTitle } from '@shared/chat'
import { ChatRepository } from '@main/repos/chat-repo'
import { ViewBounds } from '@shared/layout'

const SYNC_TIMEOUT_MS = 50

export class ChatController {
  private readonly view: WebContentsView
  private activeId: number | null = null
  private currentLocation: ChatLocation | null = null
  private syncTimeout: NodeJS.Timeout | null = null

  constructor(
    private readonly window: BrowserWindow,
    private readonly repository: ChatRepository
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

    this.view.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })

    this.view.webContents.on('did-navigate', () => this.scheduleSync())
    this.view.webContents.on('did-navigate-in-page', () => this.scheduleSync())
    this.view.webContents.on('page-title-updated', () => this.scheduleSync())
  }

  getActiveChatId(): number | null {
    return this.activeId
  }

  async start(): Promise<void> {
    this.activeId = null
    this.currentLocation = null
    this.view.setVisible(false)
  }

  setBounds(bounds: ViewBounds): void {
    this.view.setBounds(bounds)
  }

  setVisible(visible: boolean): void {
    this.view.setVisible(visible)
  }

  async openChat(chatId: number): Promise<void> {
    const chat = this.repository.getChatById(chatId)
    if (!chat) {
      return
    }

    this.activeId = chat.id
    this.currentLocation = {
      providerId: chat.providerId,
      chatId: chat.chatId
    }
    this.repository.updateLastOpened(chat.id)

    this.view.setVisible(true)
    await this.view.webContents.loadURL(getChatUrl(this.currentLocation)).catch(() => undefined)
  }

  async openNewChat(providerId: ChatProviderId): Promise<void> {
    this.activeId = null
    this.currentLocation = null

    this.view.setVisible(true)
    this.window.setTitle('CentraLLM')
    this.emitActiveChatChanged(null)

    await this.view.webContents.loadURL(getNewChatUrl(providerId)).catch(() => undefined)
  }

  destroy(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout)
    }
    this.view.webContents.close()
  }

  private scheduleSync(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout)
    }
    this.syncTimeout = setTimeout(() => {
      this.performSync()
    }, SYNC_TIMEOUT_MS)
  }

  private performSync(): void {
    const currentUrl = this.view.webContents.getURL()
    const currentTitle = this.view.webContents.getTitle()

    const location = extractChatLocation(currentUrl)
    if (!location) {
      this.currentLocation = null
      return
    }
    this.currentLocation = location

    const chatTitle = cleanChatTitle(currentTitle, location.providerId)
    if (!chatTitle) {
      return
    }

    const chat = this.repository.upsertChat(location, chatTitle)
    this.activeId = chat.id
    this.window.setTitle(chat.title ? `${chat.title} - CentraLLM` : 'CentraLLM')
    this.emitChatsChanged()
    this.emitActiveChatChanged(chat.id)
  }

  private emitChatsChanged(): void {
    this.window.webContents.send('chats:changed', this.repository.listChats())
  }

  private emitActiveChatChanged(chatId: number | null): void {
    this.window.webContents.send('chats:active-changed', chatId)
  }
}
