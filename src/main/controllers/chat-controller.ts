import { BrowserWindow, shell, WebContentsView } from 'electron'
import { getChatUrl, getNewChatUrl, extractChatLocation, ChatLocation, ChatProviderId } from '@shared/chat'
import { ChatRepository } from '@main/repos/chat-repo'
import { ViewBounds } from '@shared/layout'

export class ChatController {
  private readonly view: WebContentsView
  private activeId: number | null = null
  private currentLocation: ChatLocation | null = null

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

    this.view.webContents.on('did-navigate', (_event, url) => {
      this.syncFromUrl(url)
    })

    this.view.webContents.on('did-navigate-in-page', (_event, url) => {
      this.syncFromUrl(url)
    })

    this.view.webContents.on('page-title-updated', (_event, title) => {
      this.syncTitle(title)
    })
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
    this.window.setTitle(chat.title || 'CentraLLM')

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
    this.view.webContents.close()
  }

  private syncFromUrl(rawUrl: string): void {
    const location = extractChatLocation(rawUrl)
    if (!location) {
      this.currentLocation = null
      return
    }
    this.currentLocation = location

    const chat = this.repository.upsertChat(location, this.view.webContents.getTitle())
    this.activeId = chat.id
    this.window.setTitle(chat.title || 'CentraLLM')
    this.emitChatsChanged()
    this.emitActiveChatChanged(chat.id)
  }

  private syncTitle(title: string): void {
    if (!title.trim() || !this.currentLocation) {
      return
    }

    const chat = this.repository.upsertChat(this.currentLocation, title)
    this.activeId = chat.id
    this.window.setTitle(chat.title || 'CentraLLM')
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
