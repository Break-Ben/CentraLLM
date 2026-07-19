import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu'
import { ChatRecord } from '@shared/chat'
import { Pin, PinOff, Trash2 } from 'lucide-react'

interface SidebarChatContextMenuProps {
  chat: ChatRecord
}

export function SidebarChatContextMenu({ chat }: SidebarChatContextMenuProps): React.JSX.Element {
  return (
    <ContextMenuContent>
      <ContextMenuItem onClick={() => void window.api.chats.togglePin(chat.id)}>
        {chat.pinned ? <PinOff /> : <Pin />}
        <span>{chat.pinned ? 'Unpin' : 'Pin'}</span>
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" onClick={() => void window.api.chats.remove(chat.id)}>
        <Trash2 />
        <span>Remove</span>
      </ContextMenuItem>
    </ContextMenuContent>
  )
}
