import { useState, useEffect, useRef } from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from '@/components/ui/sidebar'
import { FolderPlus, House, MessageSquarePlus, MessagesSquare, Settings } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigation-store'
import { useChatStore } from '@/stores/chat-store'
import { useFolderStore } from '@/stores/folder-store'
import { useAppStateStore } from '@/stores/app-state-store'
import { useUiStore } from '@/stores/ui-store'
import { useFlatDirectory } from '@/hooks/use-flat-directory'
import { SidebarChat } from '@/components/sidebar/sidebar-chat'
import { SidebarFolder } from '@/components/sidebar/sidebar-folder'
import { NewChatSplitButton } from '@/components/sidebar/new-chat-split-button'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from '@/components/ui/context-menu'
import { ChatProviderLogo } from '@/components/chat-provider-icon'
import { ChatProviderId } from '@shared/chat'
import { getChatProvider } from '@/lib/chat'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { DragLocationHistory } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types'
import { DragItemData } from '@/constants/directory'
import { cn } from '@/lib/utils'
import { useShownProviders } from '@/hooks/use-providers'
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
          <AppSidebarContextMenu />
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

function AppSidebarContextMenu(): React.JSX.Element {
  const lastUsedProviderId = useAppStateStore((state) => state.lastUsedProviderId)
  const { set } = useAppStateStore((state) => state.actions)
  const { newChat } = useChatStore((state) => state.actions)
  const { setPage } = useNavigationStore((state) => state.actions)
  const { startEditing } = useUiStore((state) => state.actions)
  const shownProviders = useShownProviders()

  const lastUsedProvider = getChatProvider(lastUsedProviderId)

  const handleNewFolder = async (): Promise<void> => {
    const newFolder = await window.api.folders.create()
    if (newFolder) {
      startEditing({ type: 'sidebar-folder', id: newFolder.id })
    }
  }

  const createChat = (providerId: ChatProviderId) => {
    void set('lastUsedProviderId', providerId)
    void newChat(providerId)
    setPage({ type: 'chat', chatId: null, folderId: null })
  }

  return (
    <ContextMenuContent>
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <MessageSquarePlus />
          <span>New chat</span>
        </ContextMenuSubTrigger>

        <ContextMenuSubContent>
          <ContextMenuItem aria-label={`New ${lastUsedProvider.name} chat`} title={`New ${lastUsedProvider.name} chat`} onClick={() => createChat(lastUsedProvider.id)}>
            <ChatProviderLogo providerId={lastUsedProvider.id} />
            <span>{lastUsedProvider.name}</span>
          </ContextMenuItem>

          <ContextMenuSeparator />

          {shownProviders.map((provider) => (
            <ContextMenuItem aria-label={`New ${provider.name} chat`} title={`New ${provider.name} chat`} key={provider.id} onClick={() => createChat(provider.id)}>
              <ChatProviderLogo providerId={provider.id} />
              <span>{provider.name}</span>
            </ContextMenuItem>
          ))}
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuItem onClick={handleNewFolder}>
        <FolderPlus />
        <span>New folder</span>
      </ContextMenuItem>
    </ContextMenuContent>
  )
}
