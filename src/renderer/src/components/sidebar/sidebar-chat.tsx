import { useEffect, useRef, useState } from 'react'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { attachClosestEdge, extractClosestEdge, Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'
import { useNavigationStore } from '@/stores/navigation-store'
import { useChatStore } from '@/stores/chat-store'
import { ChatRecord, getChatDisplayName } from '@shared/chat'
import { ChatProviderIcon } from '@/components/chat-provider-icon'
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import { DragItemData } from '@/constants/directory'
import { cn } from '@/lib/utils'
import { SidebarChatContextMenu } from '@/components/context-menus/chat-context-menu'

interface SidebarChatProps {
  chat: ChatRecord
  depth: number
  parentFolderId: number | null
  isCustomSort: boolean
}

export function SidebarChat({ chat, depth, parentFolderId, isCustomSort }: SidebarChatProps): React.JSX.Element {
  const { state: sidebarState } = useSidebar()
  const itemRef = useRef<HTMLButtonElement | null>(null)
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null)

  const page = useNavigationStore((state) => state.page)
  const { setPage } = useNavigationStore((state) => state.actions)
  const { openChat, moveBefore, moveAfter } = useChatStore((state) => state.actions)

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
        canDrop: ({ source }) => isCustomSort && source.data.type === 'chat' && source.data.id !== chat.id,
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
            void moveAfter(source.data.id as number, chat.id)
          }
        }
      })
    )
  }, [chat.id, parentFolderId, isCustomSort, moveBefore, moveAfter])

  return (
    <SidebarMenuItem className={cn(closestEdge === 'top' && 'shadow-[inset_0_2px_0_0_var(--primary)]', closestEdge === 'bottom' && 'shadow-[inset_0_-2px_0_0_var(--primary)]')} style={{ marginLeft: sidebarState === 'expanded' ? depth * 24 : 0 }}>
      <ContextMenu>
        <ContextMenuTrigger>
          <SidebarMenuButton
            ref={itemRef}
            className="[clip-path:inset(0_round_var(--radius-md))]"
            isActive={page.type === 'chat' && page.chatId === chat.id}
            title={displayName}
            onClick={() => {
              void openChat(chat.id)
              setPage({ type: 'chat', chatId: chat.id, folderId: chat.folderId })
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
