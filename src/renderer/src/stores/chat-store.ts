import { create } from 'zustand'
import { ChatProviderId, ChatRecord } from '@shared/chat'

type ChatStore = {
  chats: ChatRecord[]
  actions: {
    setChats: (chats: ChatRecord[]) => void
    openChat: (chatId: number) => Promise<void>
    newChat: (providerId?: ChatProviderId) => Promise<void>
  }
}

export const useChatStore = create<ChatStore>((set) => ({
  chats: [],
  actions: {
    setChats: (chats) => set({ chats }),
    openChat: async (chatId) => {
      await window.api.chats.open(chatId)
    },
    newChat: async (providerId?: ChatProviderId) => {
      await window.api.chats.new(providerId)
    }
  }
}))
