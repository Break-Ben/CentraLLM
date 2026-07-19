import { BrowserWindow } from 'electron'
import { Page } from '@shared/navigation'
import { FolderRepository } from '@main/repos/folder-repo'

export class NavigationController {
  private page: Page = { type: 'home' }
  private chatTitle: string | null = null

  constructor(
    private readonly window: BrowserWindow,
    private readonly folderRepo: FolderRepository
  ) {}

  setPage(page: Page): void {
    this.page = page
    if (page.type !== 'chat') {
      this.chatTitle = null
    }
    this.window.setTitle(this.getTitle())
  }

  navigateTo(page: Page): void {
    this.setPage(page)
    this.window.webContents.send('navigation:navigate', page)
  }

  setChatTitle(title: string | null): void {
    this.chatTitle = title?.trim() || null
    this.window.setTitle(this.getTitle())
  }

  private getTitle(): string {
    if (this.page.type === 'chat-list') {
      if (this.page.folderId) {
        const folderName = this.folderRepo.getFolderById(this.page.folderId)?.name ?? null
        if (folderName) {
          return `${folderName} - CentraLLM`
        }
      }
      return 'Chats - CentraLLM'
    } else if (this.page.type === 'chat' && this.chatTitle) {
      return `${this.chatTitle} - CentraLLM`
    } else if (this.page.type === 'settings') {
      return 'Settings - CentraLLM'
    }

    return 'CentraLLM'
  }
}
