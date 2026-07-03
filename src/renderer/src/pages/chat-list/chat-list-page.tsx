import { Fragment, useMemo } from 'react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNavigationStore } from '@/stores/navigation-store'
import { useChatStore } from '@/stores/chat-store'
import { useFolderStore } from '@/stores/folder-store'
import { useAppStateStore } from '@/stores/app-state-store'
import { useDirectory } from '@/hooks/use-directory'
import { FolderRecord } from '@shared/folder'
import { SORTING_OPTIONS } from '@shared/app-state'
import { FolderRow } from '@/pages/chat-list/folder-row'
import { ChatRow } from '@/pages/chat-list/chat-row'

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
