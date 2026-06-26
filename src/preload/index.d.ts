import { ChatProviderId, ChatRecord } from '@shared/chat'
import { FolderRecord } from '@shared/folder'
import { ViewBounds } from '@shared/layout'
import { AppState } from '@shared/app-state'
import { Preferences } from '@shared/preferences'
import { Page } from '@shared/navigation'

declare global {
  interface Window {
    api: {
      navigation: {
        pageChanged: (page: Page) => void
      }
      layout: {
        setWebviewBounds: (bounds: ViewBounds) => void
        setWebviewVisible: (visible: boolean) => void
      }
      appState: {
        getAll: () => Promise<AppState>
        set: <K extends keyof AppState>(key: K, value: AppState[K]) => Promise<void>
      }
      preferences: {
        getAll: () => Promise<Preferences>
        set: <K extends keyof Preferences>(key: K, value: Preferences[K]) => Promise<void>
      }
      chats: {
        list: () => Promise<ChatRecord[]>
        getActive: () => Promise<number | null>
        open: (chatId: number) => Promise<void>
        new: (providerId: ChatProviderId, folderId: number | null) => Promise<void>
        remove: (chatId: number) => Promise<void>
        moveToFolder: (chatId: number, folderId: number | null) => Promise<void>
        onChanged: (callback: (chats: ChatRecord[]) => void) => () => void
        onActiveChanged: (callback: (chatId: number | null) => void) => () => void
      }
      folders: {
        list: () => Promise<FolderRecord[]>
        create: (name?: string | null, parentFolderId?: number | null) => Promise<FolderRecord | null>
        delete: (folderId: number) => Promise<void>
        rename: (folderId: number, name: string) => Promise<FolderRecord | null>
        moveToFolder: (folderId: number, parentFolderId: number | null) => Promise<FolderRecord | null>
        onChanged: (callback: (folders: FolderRecord[]) => void) => () => void
      }
    }
  }
}

export {}
