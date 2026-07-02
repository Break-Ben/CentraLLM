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
import { ChatProviderIcon } from '@/components/chat-provider-icon'
import { CHAT_PROVIDERS, ChatProviderId, getChatProvider } from '@shared/chat'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { DragLocationHistory } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types'
import { DragItemData } from '@/constants/directory'
import { cn } from '@/lib/utils'

export function AppSidebar(): React.JSX.Element {
  const page = useNavigationStore((state) => state.page)
  const { setPage } = useNavigationStore((state) => state.actions)
  const folders = useFolderStore((state) => state.folders)
  const expandedFolderIds = useAppStateStore((state) => state.expandedFolderIds)
  const sortingOrder = useAppStateStore((state) => state.sortingOrder)
  const { set } = useAppStateStore((state) => state.actions)
  const { moveToFolder: moveFolderToFolder } = useFolderStore((state) => state.actions)
  const { moveToFolder: moveChatToFolder } = useChatStore((state) => state.actions)

  const [prevFolders, setPrevFolders] = useState(folders)
  const [isDragOver, setIsDragOver] = useState(false)
  const groupRef = useRef<HTMLDivElement | null>(null)

  if (folders !== prevFolders) {
    setPrevFolders(folders)

    const knownIds = new Set(prevFolders.map((folder) => folder.id))
    const newlyCreatedIds = folders.filter((folder) => !knownIds.has(folder.id)).map((folder) => folder.id)

    if (knownIds.size > 0 && newlyCreatedIds.length > 0) {
      void set('expandedFolderIds', [...expandedFolderIds, ...newlyCreatedIds])
    }
  }

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

  const isCustomSort = sortingOrder === 'custom'
  const items = useFlatDirectory(sortingOrder, expandedFolderIds)

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
          <ContextMenuTrigger className="flex flex-1 h-full">
            <SidebarGroup ref={groupRef} className={cn(isDragOver && 'bg-sidebar-accent')}>
              <SidebarGroupLabel>Chats</SidebarGroupLabel>
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
            <SidebarMenuButton isActive={page.type === 'settings'} onClick={() => setPage({ type: 'settings' })}>
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
  const { startFolderRename } = useUiStore((state) => state.actions)

  const lastUsedProvider = getChatProvider(lastUsedProviderId)

  const handleNewFolder = async (): Promise<void> => {
    const newFolder = await window.api.folders.create()
    if (newFolder) {
      startFolderRename(newFolder.id)
    }
  }

  const createChat = (providerId: ChatProviderId) => {
    void set('lastUsedProviderId', providerId)
    void newChat(providerId)
    setPage({ type: 'chat', id: null })
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
            <ChatProviderIcon providerId={lastUsedProvider.id} />
            <span>{lastUsedProvider.name}</span>
          </ContextMenuItem>

          <ContextMenuSeparator />

          {CHAT_PROVIDERS.map((provider) => (
            <ContextMenuItem aria-label={`New ${provider.name} chat`} title={`New ${provider.name} chat`} key={provider.id} onClick={() => createChat(provider.id)}>
              <ChatProviderIcon providerId={provider.id} />
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
