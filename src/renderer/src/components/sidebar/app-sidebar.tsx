import { useMemo, useState } from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from '@/components/ui/sidebar'
import { FolderPlus, House, MessageSquarePlus, Settings } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigation-store'
import { useChatStore } from '@/stores/chat-store'
import { useFolderStore } from '@/stores/folder-store'
import { useAppStateStore } from '@/stores/app-state-store'
import { SidebarChat } from '@/components/sidebar/sidebar-chat'
import { SidebarFolder } from '@/components/sidebar/sidebar-folder'
import { NewChatSplitButton } from '@/components/sidebar/new-chat-split-button'
import { ChatRecord } from '@shared/chat'
import { FolderNode, FolderRecord } from '@shared/folder'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'

export function AppSidebar(): React.JSX.Element {
  const page = useNavigationStore((state) => state.page)
  const { setPage } = useNavigationStore((state) => state.actions)
  const chats = useChatStore((state) => state.chats)
  const folders = useFolderStore((state) => state.folders)
  const expandedFolderIds = useAppStateStore((state) => state.expandedFolderIds)
  const { set } = useAppStateStore((state) => state.actions)

  const [prevFolders, setPrevFolders] = useState(folders)

  if (folders !== prevFolders) {
    setPrevFolders(folders)

    const knownIds = new Set(prevFolders.map((folder) => folder.id))
    const newlyCreatedIds = folders.filter((folder) => !knownIds.has(folder.id)).map((folder) => folder.id)

    if (knownIds.size > 0 && newlyCreatedIds.length > 0) {
      void set('expandedFolderIds', [...expandedFolderIds, ...newlyCreatedIds])
    }
  }

  const { rootFolders, rootChats } = useMemo(() => buildTree(folders, chats), [folders, chats])

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
            <NewChatSplitButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <ContextMenu>
          <ContextMenuTrigger className="flex-1">
            <SidebarGroup>
              <SidebarGroupLabel>Chats</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {rootChats.map((chat) => (
                    <SidebarChat key={chat.id} chat={chat} />
                  ))}
                  {rootFolders.map((folder) => (
                    <SidebarFolder key={folder.id} folder={folder} />
                  ))}
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
  return (
    <ContextMenuContent>
      <ContextMenuItem onClick={() => console.log('New folder clicked')}>
        <FolderPlus />
        <span>New folder</span>
      </ContextMenuItem>
      <ContextMenuItem onClick={() => console.log('New chat clicked')}>
        <MessageSquarePlus />
        <span>New chat</span>
      </ContextMenuItem>
    </ContextMenuContent>
  )
}

function buildTree(folders: FolderRecord[], chats: ChatRecord[]) {
  const nodes = new Map<number, FolderNode>()

  for (const folder of folders) {
    nodes.set(folder.id, {
      ...folder,
      folders: [],
      chats: []
    })
  }

  const rootFolders: FolderNode[] = []
  const rootChats: ChatRecord[] = []

  for (const folder of folders) {
    const node = nodes.get(folder.id)!
    if (folder.parentFolderId === null) {
      rootFolders.push(node)
    } else {
      const parent = nodes.get(folder.parentFolderId)
      if (parent) {
        parent.folders.push(node)
      } else {
        rootFolders.push(node)
      }
    }
  }

  for (const chat of chats) {
    if (chat.folderId !== null) {
      const folder = nodes.get(chat.folderId)
      if (folder) {
        folder.chats.push(chat)
      } else {
        rootChats.push(chat)
      }
    } else {
      rootChats.push(chat)
    }
  }

  return { rootFolders, rootChats }
}
