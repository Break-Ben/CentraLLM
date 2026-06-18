import { create } from 'zustand'
import { ChatProviderId, ChatRecord } from '@shared/chat'
import { useNavigationStore } from '@/stores/navigation-store'

type ChatStore = {
  chats: ChatRecord[]
  actions: {
    init: () => () => void
    setChats: (chats: ChatRecord[]) => void
    openChat: (chatId: number) => Promise<void>
    newChat: (providerId: ChatProviderId) => Promise<void>
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
      const disposeActive = window.api.chats.onActiveChanged((activeId) => {
        const { setPage } = useNavigationStore.getState().actions
        setPage({ type: 'chat', id: activeId })
      })

      return () => {
        cancelled = true
        disposeChats()
        disposeActive()
      }
    },
    setChats: (chats) => set({ chats }),
    openChat: async (chatId) => {
      await window.api.chats.open(chatId)
    },
    newChat: async (providerId: ChatProviderId) => {
      await window.api.chats.new(providerId)
    }
  }
}))
