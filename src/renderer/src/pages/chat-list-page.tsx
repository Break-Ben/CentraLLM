import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Folder } from 'lucide-react'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
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

type BreadcrumbItemData = {
  id: number | null
  name: string
}

export function ChatListPage(): React.JSX.Element {
  const page = useNavigationStore((state) => state.page)
  const { setPage } = useNavigationStore((state) => state.actions)
  const { openChat, moveToFolder: moveChatToFolder } = useChatStore((state) => state.actions)
  const folders = useFolderStore((state) => state.folders)
  const { moveToFolder: moveFolderToFolder } = useFolderStore((state) => state.actions)
  const sortingOrder = useAppStateStore((state) => state.sortingOrder)
  const { set } = useAppStateStore((state) => state.actions)

  const folderId = page.type === 'chat-list' ? page.folderId : null

  const folderMap = useMemo(() => new Map(folders.map((folder) => [folder.id, folder])), [folders])
  const breadcrumbs = useMemo(() => buildBreadcrumbs(folderId, folderMap), [folderId, folderMap])
  const directoryItems = useDirectory(sortingOrder, folderId)

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
            directoryItems.map((item) =>
              item.type === 'folder' ? (
                <FolderRow
                  key={`folder-${item.folder.id}`}
                  folder={item.folder}
                  onOpen={() => setPage({ type: 'chat-list', folderId: item.folder.id })}
                  onDropItem={(source) => {
                    if (source.type === 'chat') {
                      void moveChatToFolder(source.id, item.folder.id)
                    } else {
                      void moveFolderToFolder(source.id, item.folder.id)
                    }
                  }}
                />
              ) : (
                <ChatRow
                  key={`chat-${item.chat.id}`}
                  chat={item.chat}
                  onOpen={() => {
                    void openChat(item.chat.id)
                    setPage({ type: 'chat', id: item.chat.id })
                  }}
                />
              )
            )
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function FolderRow({ folder, onOpen, onDropItem }: { folder: FolderRecord; onOpen: () => void; onDropItem: (source: DragItemData) => void }) {
  const rowRef = useRef<HTMLTableRowElement | null>(null)
  const [isDraggedOver, setIsDraggedOver] = useState(false)

  useEffect(() => {
    const element = rowRef.current
    if (!element) {
      return
    }

    return combine(
      draggable({
        element,
        getInitialData: () => ({ type: 'folder', id: folder.id }) satisfies DragItemData
      }),
      dropTargetForElements({
        element,
        getData: () => ({ type: 'folder', id: folder.id }) satisfies DropFolderData,
        canDrop: ({ source }) => {
          if (source.data.id === folder.id) {
            return false
          }
          return source.data.type === 'chat' || source.data.type === 'folder'
        },
        onDragEnter: () => setIsDraggedOver(true),
        onDragLeave: () => setIsDraggedOver(false),
        onDrop: ({ source }) => {
          setIsDraggedOver(false)
          onDropItem(source.data as DragItemData)
        }
      })
    )
  }, [folder.id, onDropItem])

  return (
    <TableRow ref={rowRef} className={`cursor-default select-none ${isDraggedOver ? 'bg-accent/60 text-accent-foreground' : ''}`} onDoubleClick={onOpen}>
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

function ChatRow({ chat, onOpen }: { chat: ChatRecord; onOpen: () => void }) {
  const rowRef = useRef<HTMLTableRowElement | null>(null)

  useEffect(() => {
    const element = rowRef.current
    if (!element) {
      return
    }

    return draggable({
      element,
      getInitialData: () => ({ type: 'chat', id: chat.id }) satisfies DragItemData
    })
  }, [chat.id])

  return (
    <TableRow ref={rowRef} className="cursor-default select-none" onDoubleClick={onOpen}>
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
