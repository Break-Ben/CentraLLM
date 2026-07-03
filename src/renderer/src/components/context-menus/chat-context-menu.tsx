import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import { ChatRecord } from '@shared/chat'
import { Trash2 } from 'lucide-react'

interface SidebarChatContextMenuProps {
  chat: ChatRecord
}

export function SidebarChatContextMenu({ chat }: SidebarChatContextMenuProps): React.JSX.Element {
  return (
    <ContextMenuContent>
      <ContextMenuItem variant="destructive" onClick={() => void window.api.chats.remove(chat.id)}>
        <Trash2 />
        <span>Remove</span>
      </ContextMenuItem>
    </ContextMenuContent>
  )
}
