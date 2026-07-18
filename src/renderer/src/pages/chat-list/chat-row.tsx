import { useEffect, useRef, useState } from 'react'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { attachClosestEdge, extractClosestEdge, Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { TableCell, TableRow } from '@/components/ui/table'
import { ChatProviderLogo } from '@/components/chat-provider-icon'
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import { SidebarChatContextMenu } from '@/components/context-menus/chat-context-menu'
import { ChatRecord } from '@shared/chat'
import { getChatProvider } from '@/lib/chat'
import { getChatDisplayName } from '@/lib/chat'
import { formatDate } from '@shared/preferences'
import { DragItemData } from '@/constants/directory'
import { cn } from '@/lib/utils'

interface ChatRowProps {
  chat: ChatRecord
  isCustomSort: boolean
  nextChatId: number | null
  onOpen: () => void
  onMoveBefore: (sourceId: number, targetId: number) => void
  onMoveAfter: (sourceId: number, targetId: number) => void
}

export function ChatRow({ chat, isCustomSort, nextChatId, onOpen, onMoveBefore, onMoveAfter }: ChatRowProps) {
  const rowRef = useRef<HTMLTableRowElement | null>(null)
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null)

  useEffect(() => {
    const element = rowRef.current
    if (!element) {
      return
    }

    return combine(
      draggable({
        element,
        getInitialData: () => ({ type: 'chat', id: chat.id, parentFolderId: chat.folderId }) satisfies DragItemData
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
            onMoveBefore(source.data.id as number, chat.id)
          } else if (edge === 'bottom') {
            onMoveAfter(source.data.id as number, chat.id)
          }
        }
      })
    )
  }, [chat.id, chat.folderId, isCustomSort, nextChatId, onMoveBefore, onMoveAfter])

  return (
    <ContextMenu>
      <ContextMenuTrigger className="contents">
        <TableRow
          ref={rowRef}
          className={cn('cursor-default select-none', closestEdge === 'top' && '[&>td]:shadow-[inset_0_2px_0_0_var(--primary)]', closestEdge === 'bottom' && '[&>td]:shadow-[inset_0_-2px_0_0_var(--primary)]')}
          onDoubleClick={onOpen}
        >
          <TableCell>
            <span className="inline-flex items-center gap-2">
              <ChatProviderLogo providerId={chat.providerId} />
              <span>{getChatDisplayName(chat)}</span>
            </span>
          </TableCell>
          <TableCell>
            <span className="inline-flex items-center gap-2">
              <ChatProviderLogo providerId={chat.providerId} />
              <span>{getChatProvider(chat.providerId).name}</span>
            </span>
          </TableCell>
          <TableCell>{formatDate(chat.lastOpenedAt)}</TableCell>
        </TableRow>
      </ContextMenuTrigger>
      <SidebarChatContextMenu chat={chat} />
    </ContextMenu>
  )
}
