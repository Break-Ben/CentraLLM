import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import { DirectoryContextMenu } from '@/components/context-menus/directory-context-menu'
import { useNavigationStore } from '@/stores/navigation-store'
import { useChatStore } from '@/stores/chat-store'
import { useFolderStore } from '@/stores/folder-store'
import { useAppStateStore } from '@/stores/app-state-store'
import { useDirectory } from '@/hooks/use-directory'
import { SORTING_OPTIONS } from '@shared/app-state'
import { FolderRow } from '@/pages/chat-list/folder-row'
import { ChatRow } from '@/pages/chat-list/chat-row'

export function ChatListPage(): React.JSX.Element {
  const page = useNavigationStore((state) => state.page)
  const { setPage } = useNavigationStore((state) => state.actions)
  const { openChat, moveToFolder: moveChatToFolder, moveBefore: moveChatBefore, moveAfter: moveChatAfter, togglePin } = useChatStore((state) => state.actions)
  const { moveToFolder: moveFolderToFolder, moveBefore: moveFolderBefore, moveAfter: moveFolderAfter } = useFolderStore((state) => state.actions)
  const sortingOrder = useAppStateStore((state) => state.sortingOrder)
  const { set } = useAppStateStore((state) => state.actions)

  const folderId = page.type === 'chat-list' ? page.folderId : null
  const directoryItems = useDirectory(sortingOrder, folderId)

  const isCustomSort = sortingOrder === 'custom'

  return (
    <ContextMenu>
      <ContextMenuTrigger className="overflow-y-auto scrollbar-none">
        <div className="p-4">
          <div className="flex justify-end px-2 pb-3">
            <Select value={sortingOrder} onValueChange={(value) => set('sortingOrder', value!)} items={SORTING_OPTIONS}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
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
                <TableHead className="w-1/5">Provider</TableHead>
                <TableHead className="w-1/5">Last opened</TableHead>
                <TableHead className="w-1/10">Pinned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {directoryItems.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="py-4 text-center text-muted-foreground">
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
                          setPage({ type: 'chat', chatId: null, folderId: item.chat.folderId })
                        }}
                        onMoveBefore={(sourceId, targetId) => void moveChatBefore(sourceId, targetId)}
                        onMoveAfter={(sourceId, targetId) => void moveChatAfter(sourceId, targetId)}
                        onTogglePin={(chatId) => void togglePin(chatId)}
                      />
                    )
                  }
                })
              )}
            </TableBody>
          </Table>
        </div>
      </ContextMenuTrigger>
      <DirectoryContextMenu parentFolderId={folderId} editingType="row-folder" />
    </ContextMenu>
  )
}
