import { ChatProviderId, ChatRecord } from '@shared/chat'
import { ViewBounds } from '@shared/layout'
import { AppState } from '@shared/app-state'
import { Preferences } from '@shared/preferences'

declare global {
  interface Window {
    api: {
      chats: {
        list: () => Promise<ChatRecord[]>
        getActive: () => Promise<number | null>
        open: (chatId: number) => Promise<void>
        new: (providerId: ChatProviderId) => Promise<void>
        onChanged: (callback: (chats: ChatRecord[]) => void) => () => void
        onActiveChanged: (callback: (chatId: number | null) => void) => () => void
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
    }
  }
}

export {}
