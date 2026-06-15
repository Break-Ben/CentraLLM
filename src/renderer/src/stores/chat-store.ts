import { create } from 'zustand'
import type { ChatRecord } from '@shared/chat'

type ChatStore = {
  chats: ChatRecord[]
  actions: {
    setChats: (chats: ChatRecord[]) => void
    openChat: (chatId: number) => Promise<void>
    newChat: () => Promise<void>
  }
}

export const useChatStore = create<ChatStore>((set) => ({
  chats: [],
  actions: {
    setChats: (chats) => set({ chats }),
    openChat: async (chatId) => {
      await window.api.chats.open(chatId)
    },
    newChat: async () => {
      await window.api.chats.new()
    }
  }
}))
