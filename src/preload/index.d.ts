import type { ChatProviderId, ChatRecord } from '@shared/chat'
import { ViewBounds } from '@shared/layout'

declare global {
  interface Window {
    api: {
      chats: {
        list: () => Promise<ChatRecord[]>
        getActive: () => Promise<number | null>
        open: (chatId: number) => Promise<void>
        new: (providerId?: ChatProviderId) => Promise<void>
        onChanged: (callback: (chats: ChatRecord[]) => void) => () => void
        onActiveChanged: (callback: (chatId: number | null) => void) => () => void
      }
      layout: {
        setWebviewBounds: (bounds: ViewBounds) => void
        setWebviewVisible: (visible: boolean) => void
      }
    }
  }
}

export {}
