import { useEffect, useRef, useState } from 'react'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { attachClosestEdge, extractClosestEdge, Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { useNavigationStore } from '@/stores/navigation-store'
import { useChatStore } from '@/stores/chat-store'
import { ChatRecord, getChatDisplayName } from '@shared/chat'
import { ChatProviderIcon } from '@/components/chat-provider-icon'
import { Trash2 } from 'lucide-react'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { DragItemData } from '@/constants/directory'
import { cn } from '@/lib/utils'

interface SidebarChatProps {
  chat: ChatRecord
  depth: number
  parentFolderId: number | null
  nextSiblingId: number | null
  isCustomSort: boolean
}

export function SidebarChat({ chat, depth, parentFolderId, nextSiblingId, isCustomSort }: SidebarChatProps): React.JSX.Element {
  const itemRef = useRef<HTMLLIElement | null>(null)
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null)

  const page = useNavigationStore((state) => state.page)
  const { setPage } = useNavigationStore((state) => state.actions)
  const { openChat, moveBefore } = useChatStore((state) => state.actions)

  const displayName = getChatDisplayName(chat)

  useEffect(() => {
    const element = itemRef.current
    if (!element) {
      return
    }

    return combine(
      draggable({
        element,
        getInitialData: () => ({ type: 'chat', id: chat.id, parentFolderId }) satisfies DragItemData
      }),
      dropTargetForElements({
        element,
        // TEMP: Chats only reorder against siblings in the same folder.
        canDrop: ({ source }) => isCustomSort && source.data.type === 'chat' && source.data.id !== chat.id && (source.data.parentFolderId as number | null) === parentFolderId,
        getData: ({ input, element }) => attachClosestEdge({ type: 'chat', id: chat.id }, { input, element, allowedEdges: ['top', 'bottom'] }),
        onDragEnter: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
        onDrag: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
        onDragLeave: () => setClosestEdge(null),
        onDrop: ({ source, self }) => {
          setClosestEdge(null)
          const edge = extractClosestEdge(self.data)
          if (edge === 'top') {
            void moveBefore(source.data.id as number, chat.id)
          } else if (edge === 'bottom') {
            void moveBefore(source.data.id as number, nextSiblingId)
          }
        }
      })
    )
  }, [chat.id, parentFolderId, nextSiblingId, isCustomSort, moveBefore])

  return (
    <SidebarMenuItem
      ref={itemRef}
      className={cn('[clip-path:inset(0_round_0.375rem)]', closestEdge === 'top' && 'shadow-[inset_0_2px_0_0_var(--primary)]', closestEdge === 'bottom' && 'shadow-[inset_0_-2px_0_0_var(--primary)]')}
      style={{ marginLeft: depth * 24 }}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <SidebarMenuButton
            isActive={page.type === 'chat' && page.id === chat.id}
            title={displayName}
            onClick={() => {
              void openChat(chat.id)
              setPage({ type: 'chat', id: chat.id })
            }}
          >
            <ChatProviderIcon providerId={chat.providerId} />
            <span>{displayName}</span>
          </SidebarMenuButton>
        </ContextMenuTrigger>
        <SidebarChatContextMenu chat={chat} />
      </ContextMenu>
    </SidebarMenuItem>
  )
}

interface SidebarChatContextMenuProps {
  chat: ChatRecord
}

function SidebarChatContextMenu({ chat }: SidebarChatContextMenuProps): React.JSX.Element {
  return (
    <ContextMenuContent>
      <ContextMenuItem variant="destructive" onClick={() => void window.api.chats.remove(chat.id)}>
        <Trash2 />
        <span>Remove</span>
      </ContextMenuItem>
    </ContextMenuContent>
  )
}
