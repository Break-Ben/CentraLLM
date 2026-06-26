import { Fragment, useMemo } from 'react'
import { Folder } from 'lucide-react'
import { DragDropProvider, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useNavigationStore } from '@/stores/navigation-store'
import { useChatStore } from '@/stores/chat-store'
import { useFolderStore } from '@/stores/folder-store'
import { ChatProviderIcon } from '@/components/chat-provider-icon'
import { getChatDisplayName, ChatRecord, getChatProvider } from '@shared/chat'
import { FolderRecord } from '@shared/folder'
import { formatDate } from '@shared/preferences'

type DirectoryItem = { type: 'folder'; folder: FolderRecord } | { type: 'chat'; chat: ChatRecord }

type BreadcrumbItemData = {
  id: number | null
  name: string
}

export function ChatListPage(): React.JSX.Element {
  const page = useNavigationStore((state) => state.page)
  const { setPage } = useNavigationStore((state) => state.actions)
  const chats = useChatStore((state) => state.chats)
  const { openChat, moveToFolder: moveChatToFolder } = useChatStore((state) => state.actions)
  const folders = useFolderStore((state) => state.folders)
  const { moveToFolder: moveFolderToFolder } = useFolderStore((state) => state.actions)

  const folderId = page.type === 'chat-list' ? page.folderId : null

  const folderMap = useMemo(() => new Map(folders.map((folder) => [folder.id, folder])), [folders])
  const breadcrumbs = useMemo(() => buildBreadcrumbs(folderId, folderMap), [folderId, folderMap])
  const items = useMemo(() => buildDirectoryItems(folderId, folders, chats), [folderId, folders, chats])

  const handleDrop = async (event: DragEndEvent) => {
    const { source, target } = event.operation
    if (!source || !target) {
      return
    }

    const sourceId = Number(source.id)
    const targetId = Number(target.id)

    if (source.type === 'chat') {
      await moveChatToFolder(sourceId, targetId)
    } else if (source.type === 'folder' && sourceId !== targetId) {
      await moveFolderToFolder(sourceId, targetId)
    }
  }

  return (
    <DragDropProvider onDragEnd={handleDrop}>
      <div className="p-4">
        <Breadcrumb className="border-b px-2 pb-3 mb-4">
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

        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/2">Name</TableHead>
              <TableHead className="w-1/4">Provider</TableHead>
              <TableHead className="w-1/4">Last opened</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-4 text-center text-muted-foreground">
                  This folder is empty
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) =>
                item.type === 'folder' ? (
                  <FolderRow key={`folder-${item.folder.id}`} folder={item.folder} onOpen={() => setPage({ type: 'chat-list', folderId: item.folder.id })} />
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
    </DragDropProvider>
  )
}

function FolderRow({ folder, onOpen }: { folder: FolderRecord; onOpen: () => void }) {
  const { ref: dragRef } = useDraggable({ id: folder.id, type: 'folder' })
  const { ref: dropRef } = useDroppable({ id: folder.id, accept: ['chat', 'folder'] })

  return (
    <TableRow
      ref={(node) => {
        dragRef(node)
        dropRef(node)
      }}
      className="cursor-default select-none"
      data-item-type="folder"
      data-item-id={folder.id}
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

function ChatRow({ chat, onOpen }: { chat: ChatRecord; onOpen: () => void }) {
  const { ref: dragRef } = useDraggable({ id: chat.id, type: 'chat' })

  return (
    <TableRow ref={dragRef} className="cursor-default select-none" data-item-type="chat" data-item-id={chat.id} onDoubleClick={onOpen}>
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

function buildDirectoryItems(folderId: number | null, folders: FolderRecord[], chats: ChatRecord[]): DirectoryItem[] {
  const folderItems: DirectoryItem[] = folders.filter((folder) => folder.parentFolderId === folderId).map((folder) => ({ type: 'folder', folder }))
  const chatItems: DirectoryItem[] = chats.filter((chat) => chat.folderId === folderId).map((chat) => ({ type: 'chat', chat }))

  return [...folderItems, ...chatItems]
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
