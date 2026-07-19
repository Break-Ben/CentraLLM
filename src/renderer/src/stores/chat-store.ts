import { create } from 'zustand'
import { ChatProviderId, ChatRecord } from '@shared/chat'
import { useNavigationStore } from '@/stores/navigation-store'

type ChatStore = {
  chats: ChatRecord[]
  actions: {
    init: () => () => void
    openChat: (chatId: number) => Promise<void>
    newChat: (providerId: ChatProviderId, folderId?: number | null) => Promise<void>
    togglePin: (chatId: number) => Promise<void>
    moveToFolder: (chatId: number, folderId: number | null) => Promise<void>
    moveBefore: (chatId: number, beforeChatId: number) => Promise<void>
    moveAfter: (chatId: number, afterChatId: number) => Promise<void>
  }
}

export const useChatStore = create<ChatStore>((set) => ({
  chats: [],
  actions: {
    init: () => {
      let cancelled = false

      void window.api.chats.list().then((items) => {
        if (!cancelled) {
          set({ chats: items })
        }
      })

      const disposeChats = window.api.chats.onChanged((items) => {
        set({ chats: items })
      })
      const disposeActive = window.api.chats.onActiveChanged((activeId, folderId) => {
        const { page } = useNavigationStore.getState()
        const { setPage } = useNavigationStore.getState().actions
        if (page.type === 'chat') {
          setPage({ type: 'chat', chatId: activeId, folderId })
        }
      })

      return () => {
        cancelled = true
        disposeChats()
        disposeActive()
      }
    },
    openChat: async (chatId) => {
      await window.api.chats.open(chatId)
    },
    newChat: async (providerId: ChatProviderId, folderId: number | null = null) => {
      await window.api.chats.new(providerId, folderId)
    },
    togglePin: async (chatId) => {
      await window.api.chats.togglePin(chatId)
    },
    moveToFolder: async (chatId, folderId) => {
      await window.api.chats.moveToFolder(chatId, folderId)
    },
    moveBefore: async (chatId, beforeChatId) => {
      await window.api.chats.moveBefore(chatId, beforeChatId)
    },
    moveAfter: async (chatId, afterChatId) => {
      await window.api.chats.moveAfter(chatId, afterChatId)
    }
  }
}))
