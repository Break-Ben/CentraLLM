import { useState, useEffect, useRef } from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from '@/components/ui/sidebar'
import { House, MessagesSquare, Search, Settings } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigation-store'
import { useChatStore } from '@/stores/chat-store'
import { useFolderStore } from '@/stores/folder-store'
import { useAppStateStore } from '@/stores/app-state-store'
import { useFlatDirectory } from '@/hooks/use-flat-directory'
import { SidebarChat } from '@/components/sidebar/sidebar-chat'
import { SidebarFolder } from '@/components/sidebar/sidebar-folder'
import { NewChatSplitButton } from '@/components/sidebar/new-chat-split-button'
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import { DirectoryContextMenu } from '@/components/context-menus/directory-context-menu'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { DragLocationHistory } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types'
import { DragItemData } from '@/constants/directory'
import { cn } from '@/lib/utils'
import { usePinnedChats } from '@/hooks/use-pinned-chats'

export function AppSidebar(): React.JSX.Element {
  const page = useNavigationStore((state) => state.page)
  const { setPage } = useNavigationStore((state) => state.actions)
  const expandedFolderIds = useAppStateStore((state) => state.expandedFolderIds)
  const sortingOrder = useAppStateStore((state) => state.sortingOrder)
  const { moveToFolder: moveFolderToFolder } = useFolderStore((state) => state.actions)
  const { moveToFolder: moveChatToFolder } = useChatStore((state) => state.actions)

  const pinnedChats = usePinnedChats()
  const isCustomSort = sortingOrder === 'custom'
  const items = useFlatDirectory(sortingOrder, expandedFolderIds)

  const [isDragOver, setIsDragOver] = useState(false)
  const groupRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const element = groupRef.current
    if (!element) {
      return
    }

    const isOverBackground = (location: DragLocationHistory) => {
      const { clientX, clientY } = location.current.input
      return !document.elementFromPoint(clientX, clientY)?.closest('li')
    }

    return dropTargetForElements({
      element,
      canDrop: ({ source }) => (source.data.type === 'chat' || source.data.type === 'folder') && source.data.parentFolderId !== null,
      onDragEnter: ({ location }) => setIsDragOver(isOverBackground(location)),
      onDrag: ({ location }) => setIsDragOver(isOverBackground(location)),
      onDragLeave: () => setIsDragOver(false),
      onDrop: ({ source, location }) => {
        if (!isOverBackground(location)) {
          return
        }

        setIsDragOver(false)
        const src = source.data as DragItemData
        if (src.type === 'chat') {
          void moveChatToFolder(src.id, null)
        } else if (src.type === 'folder') {
          void moveFolderToFolder(src.id, null)
        }
      }
    })
  }, [moveChatToFolder, moveFolderToFolder])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={page.type === 'home'} onClick={() => setPage({ type: 'home' })}>
              <House />
              <span>Home</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton isActive={page.type === 'chat-list'} onClick={() => setPage({ type: 'chat-list', folderId: null })}>
              <MessagesSquare />
              <span>Chats</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton isActive={page.type === 'search'} onClick={() => setPage({ type: 'search' })}>
              <Search />
              <span>Search</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <NewChatSplitButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <ContextMenu>
          <ContextMenuTrigger className="flex flex-col flex-1 h-full">
            {pinnedChats.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Pinned Chats</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {pinnedChats.map((chat) => (
                      <SidebarChat key={`pinned-${chat.id}`} chat={chat} depth={0} parentFolderId={chat.folderId} isCustomSort={false} />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            <SidebarGroup ref={groupRef} className={cn(isDragOver && 'bg-sidebar-accent')}>
              <SidebarGroupLabel>All Chats</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) =>
                    item.type === 'folder' ? (
                      <SidebarFolder key={`folder-${item.folder.id}`} folder={item.folder} depth={item.depth} parentFolderId={item.parentFolderId} isCustomSort={isCustomSort} />
                    ) : (
                      <SidebarChat key={`chat-${item.chat.id}`} chat={item.chat} depth={item.depth} parentFolderId={item.parentFolderId} isCustomSort={isCustomSort} />
                    )
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </ContextMenuTrigger>
          <DirectoryContextMenu parentFolderId={null} editingType="sidebar-folder" />
        </ContextMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={page.type === 'settings'} onClick={() => setPage({ type: 'settings', category: 'general' })}>
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
