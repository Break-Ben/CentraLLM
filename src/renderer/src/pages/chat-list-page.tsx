import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Folder } from 'lucide-react'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { attachClosestEdge, extractClosestEdge, Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { attachInstruction, extractInstruction } from '@atlaskit/pragmatic-drag-and-drop-hitbox/list-item'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNavigationStore } from '@/stores/navigation-store'
import { useChatStore } from '@/stores/chat-store'
import { useFolderStore } from '@/stores/folder-store'
import { useAppStateStore } from '@/stores/app-state-store'
import { ChatProviderIcon } from '@/components/chat-provider-icon'
import { useDirectory } from '@/hooks/use-directory'
import { getChatDisplayName, ChatRecord, getChatProvider } from '@shared/chat'
import { FolderRecord } from '@shared/folder'
import { formatDate } from '@shared/preferences'
import { SORTING_OPTIONS } from '@shared/app-state'
import { DragItemData, DropFolderData } from '@/constants/directory'
import { cn } from '@/lib/utils'

type BreadcrumbItemData = {
  id: number | null
  name: string
}

export function ChatListPage(): React.JSX.Element {
  const page = useNavigationStore((state) => state.page)
  const { setPage } = useNavigationStore((state) => state.actions)
  const { openChat, moveToFolder: moveChatToFolder, moveBefore: moveChatBefore, moveAfter: moveChatAfter } = useChatStore((state) => state.actions)
  const folders = useFolderStore((state) => state.folders)
  const { moveToFolder: moveFolderToFolder, moveBefore: moveFolderBefore, moveAfter: moveFolderAfter } = useFolderStore((state) => state.actions)
  const sortingOrder = useAppStateStore((state) => state.sortingOrder)
  const { set } = useAppStateStore((state) => state.actions)

  const folderId = page.type === 'chat-list' ? page.folderId : null

  const folderMap = useMemo(() => new Map(folders.map((folder) => [folder.id, folder])), [folders])
  const breadcrumbs = useMemo(() => buildBreadcrumbs(folderId, folderMap), [folderId, folderMap])
  const directoryItems = useDirectory(sortingOrder, folderId)

  const isCustomSort = sortingOrder === 'custom'

  return (
    <div className="p-4">
      <div className="flex items-center justify-between border-b px-2 pb-3 mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1
              return (
                <Fragment key={crumb.id ?? 'root'}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setPage({ type: 'chat-list', folderId: crumb.id })
                        }}
                      >
                        {crumb.name}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>

        <Select value={sortingOrder} onValueChange={(value) => set('sortingOrder', value!)} items={SORTING_OPTIONS}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTING_OPTIONS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/2">Name</TableHead>
            <TableHead className="w-1/4">Provider</TableHead>
            <TableHead className="w-1/4">Last opened</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {directoryItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="py-4 text-center text-muted-foreground">
                This folder is empty
              </TableCell>
            </TableRow>
          ) : (
            directoryItems.map((item, index) => {
              const nextItem = directoryItems[index + 1]

              if (item.type === 'folder') {
                const nextFolderId = nextItem?.type === 'folder' ? nextItem.folder.id : null

                return (
                  <FolderRow
                    key={`folder-${item.folder.id}`}
                    folder={item.folder}
                    isCustomSort={isCustomSort}
                    nextFolderId={nextFolderId}
                    onOpen={() => setPage({ type: 'chat-list', folderId: item.folder.id })}
                    onMoveBefore={(sourceId, targetId) => void moveFolderBefore(sourceId, targetId)}
                    onMoveAfter={(sourceId, targetId) => void moveFolderAfter(sourceId, targetId)}
                    onDropItem={(source) => {
                      if (source.type === 'chat') {
                        void moveChatToFolder(source.id, item.folder.id)
                      } else {
                        void moveFolderToFolder(source.id, item.folder.id)
                      }
                    }}
                  />
                )
              } else {
                const nextChatId = nextItem?.type === 'chat' ? nextItem.chat.id : null

                return (
                  <ChatRow
                    key={`chat-${item.chat.id}`}
                    chat={item.chat}
                    isCustomSort={isCustomSort}
                    nextChatId={nextChatId}
                    onOpen={() => {
                      void openChat(item.chat.id)
                      setPage({ type: 'chat', id: item.chat.id })
                    }}
                    onMoveBefore={(sourceId, targetId) => void moveChatBefore(sourceId, targetId)}
                    onMoveAfter={(sourceId, targetId) => void moveChatAfter(sourceId, targetId)}
                  />
                )
              }
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

interface FolderRowProps {
  folder: FolderRecord
  isCustomSort: boolean
  nextFolderId: number | null
  onOpen: () => void
  onDropItem: (source: DragItemData) => void
  onMoveBefore: (sourceId: number, targetId: number) => void
  onMoveAfter: (sourceId: number, targetId: number) => void
}

function FolderRow({ folder, isCustomSort, nextFolderId, onOpen, onDropItem, onMoveBefore, onMoveAfter }: FolderRowProps) {
  const rowRef = useRef<HTMLTableRowElement | null>(null)
  const [dropIndicator, setDropIndicator] = useState<'inside' | 'top' | 'bottom' | null>(null)

  useEffect(() => {
    const element = rowRef.current
    if (!element) {
      return
    }

    return combine(
      draggable({
        element,
        getInitialData: () => ({ type: 'folder', id: folder.id, parentFolderId: folder.parentFolderId }) satisfies DragItemData
      }),
      dropTargetForElements({
        element,
        getData: ({ input, element }) =>
          attachInstruction({ type: 'folder', id: folder.id } satisfies DropFolderData, {
            input,
            element,
            operations: isCustomSort ? { 'reorder-before': 'available', 'reorder-after': 'available', combine: 'available' } : { combine: 'available' }
          }),
        canDrop: ({ source }) => {
          if (source.data.id === folder.id) {
            return false
          }
          return source.data.type === 'chat' || source.data.type === 'folder'
        },
        onDragEnter: ({ source, self }) => {
          if (source.data.type === 'chat') {
            setDropIndicator('inside')
          } else {
            const inst = extractInstruction(self.data)
            if (inst?.operation === 'reorder-before') {
              setDropIndicator('top')
            } else if (inst?.operation === 'reorder-after') {
              setDropIndicator('bottom')
            } else if (inst?.operation === 'combine') {
              setDropIndicator('inside')
            } else {
              setDropIndicator(null)
            }
          }
        },
        onDrag: ({ source, self }) => {
          if (source.data.type === 'chat') {
            setDropIndicator('inside')
          } else {
            const operation = extractInstruction(self.data)?.operation
            if (operation === 'reorder-before') {
              setDropIndicator('top')
            } else if (operation === 'reorder-after') {
              setDropIndicator('bottom')
            } else if (operation === 'combine') {
              setDropIndicator('inside')
            } else {
              setDropIndicator(null)
            }
          }
        },
        onDragLeave: () => setDropIndicator(null),
        onDrop: ({ source, self }) => {
          setDropIndicator(null)
          if (source.data.type === 'chat') {
            onDropItem(source.data as DragItemData)
            return
          }
          const operation = extractInstruction(self.data)?.operation
          if (operation === 'reorder-before') {
            onMoveBefore(source.data.id as number, folder.id)
          } else if (operation === 'reorder-after') {
            onMoveAfter(source.data.id as number, folder.id)
          } else {
            onDropItem(source.data as DragItemData)
          }
        }
      })
    )
  }, [folder.id, folder.parentFolderId, isCustomSort, nextFolderId, onDropItem, onMoveAfter, onMoveBefore])

  return (
    <TableRow
      ref={rowRef}
      className={cn(
        'cursor-default select-none',
        dropIndicator === 'inside' && 'bg-accent/60 text-accent-foreground',
        dropIndicator === 'top' && '[&>td]:shadow-[inset_0_2px_0_0_var(--primary)]',
        dropIndicator === 'bottom' && '[&>td]:shadow-[inset_0_-2px_0_0_var(--primary)]'
      )}
      onDoubleClick={onOpen}
    >
      <TableCell>
        <span className="inline-flex items-center gap-2">
          <Folder className="size-4" />
          <span>{folder.name}</span>
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">-</TableCell>
      <TableCell className="text-muted-foreground">-</TableCell>
    </TableRow>
  )
}

interface ChatRowProps {
  chat: ChatRecord
  isCustomSort: boolean
  nextChatId: number | null
  onOpen: () => void
  onMoveBefore: (sourceId: number, targetId: number) => void
  onMoveAfter: (sourceId: number, targetId: number) => void
}

function ChatRow({ chat, isCustomSort, nextChatId, onOpen, onMoveBefore, onMoveAfter }: ChatRowProps) {
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
    <TableRow ref={rowRef} className={cn('cursor-default select-none', closestEdge === 'top' && '[&>td]:shadow-[inset_0_2px_0_0_var(--primary)]', closestEdge === 'bottom' && '[&>td]:shadow-[inset_0_-2px_0_0_var(--primary)]')} onDoubleClick={onOpen}>
      <TableCell>
        <span className="inline-flex items-center gap-2">
          <ChatProviderIcon providerId={chat.providerId} />
          <span>{getChatDisplayName(chat)}</span>
        </span>
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-2">
          <ChatProviderIcon providerId={chat.providerId} />
          <span>{getChatProvider(chat.providerId).name}</span>
        </span>
      </TableCell>
      <TableCell>{formatDate(chat.lastOpenedAt)}</TableCell>
    </TableRow>
  )
}

function buildBreadcrumbs(folderId: number | null, folderMap: Map<number, FolderRecord>): BreadcrumbItemData[] {
  const crumbs: BreadcrumbItemData[] = []
  let currentId = folderId

  while (currentId !== null) {
    const folder = folderMap.get(currentId)
    if (!folder) {
      break
    }

    crumbs.unshift({ id: folder.id, name: folder.name })
    currentId = folder.parentFolderId
  }

  return [{ id: null, name: 'All Chats' }, ...crumbs]
}
