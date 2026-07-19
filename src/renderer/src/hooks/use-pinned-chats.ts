import { getChatDisplayName } from '@/lib/chat'
import { useChatStore } from '@/stores/chat-store'
import { ChatRecord } from '@shared/chat'
import { useMemo } from 'react'

export function usePinnedChats(): ChatRecord[] {
  const chats = useChatStore((state) => state.chats)
  return useMemo(() => [...chats.filter((chat) => chat.pinned)].sort((a, b) => getChatDisplayName(a).localeCompare(getChatDisplayName(b))), [chats])
}
