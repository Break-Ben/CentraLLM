import { ChevronRight, Folder, FolderPlus, MessageSquarePlus, Pencil, Trash2 } from 'lucide-react'
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from '@/components/ui/sidebar'
import { SidebarChat } from '@/components/sidebar/sidebar-chat'
import { InlineEdit } from '@/components/ui/inline-edit'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from '@/components/ui/context-menu'
import { FolderNode } from '@shared/folder'
import { useAppStateStore } from '@/stores/app-state-store'
import { useUiStore } from '@/stores/ui-store'
import { useChatStore } from '@/stores/chat-store'
import { ChatProviderIcon } from '@/components/chat-provider-icon'
import { useNavigationStore } from '@/stores/navigation-store'
import { getChatProvider, ChatProviderId, CHAT_PROVIDER_LIST } from '@shared/chat'

interface SidebarFolderProps {
  folder: FolderNode
  isSub?: boolean
}

export function SidebarFolder({ folder, isSub = false }: SidebarFolderProps): React.JSX.Element {
  const expandedFolderIds = useAppStateStore((state) => state.expandedFolderIds)
  const { set } = useAppStateStore((state) => state.actions)

  const editingFolderId = useUiStore((state) => state.editingFolderId)
  const { startFolderRename, stopFolderRename } = useUiStore((state) => state.actions)

  const isEditing = editingFolderId === folder.id
  const isExpanded = expandedFolderIds.includes(folder.id)
  const ItemComponent = isSub ? SidebarMenuSubItem : SidebarMenuItem
  const ButtonComponent = isSub ? SidebarMenuSubButton : SidebarMenuButton

  return (
    <ItemComponent>
      <ContextMenu>
        <ContextMenuTrigger>
          <ButtonComponent
            title={folder.name}
            onClick={() => {
              if (isEditing) {
                return
              }
              const next = isExpanded ? expandedFolderIds.filter((id) => id !== folder.id) : [...expandedFolderIds, folder.id]
              void set('expandedFolderIds', next)
            }}
          >
            <ChevronRight className={isExpanded ? 'rotate-90 transition-transform' : 'transition-transform'} />
            <Folder />
            {isEditing ? (
              <InlineEdit
                initialValue={folder.name}
                onSave={async (next) => {
                  await window.api.folders.rename(folder.id, next)
                }}
                onClose={stopFolderRename}
                aria-label={`Rename folder ${folder.name}`}
              />
            ) : (
              <span>{folder.name}</span>
            )}
          </ButtonComponent>
        </ContextMenuTrigger>
        <SidebarFolderContextMenu folder={folder} onRename={() => startFolderRename(folder.id)} />
      </ContextMenu>

      {isExpanded && (folder.chats.length > 0 || folder.folders.length > 0) && (
        <SidebarMenuSub>
          {folder.chats.map((chat) => (
            <SidebarChat key={chat.id} chat={chat} isSub={true} />
          ))}
          {folder.folders.map((child) => (
            <SidebarFolder key={child.id} folder={child} isSub={true} />
          ))}
        </SidebarMenuSub>
      )}
    </ItemComponent>
  )
}

interface SidebarFolderContextMenuProps {
  folder: FolderNode
  onRename: () => void
}

function SidebarFolderContextMenu({ folder, onRename }: SidebarFolderContextMenuProps): React.JSX.Element {
  const lastUsedProviderId = useAppStateStore((state) => state.lastUsedProviderId)
  const { set } = useAppStateStore((state) => state.actions)
  const { newChat } = useChatStore((state) => state.actions)
  const { setPage } = useNavigationStore((state) => state.actions)
  const { startFolderRename } = useUiStore((state) => state.actions)

  const lastUsedProvider = getChatProvider(lastUsedProviderId)

  const createChat = (providerId: ChatProviderId) => {
    void set('lastUsedProviderId', providerId)
    void newChat(providerId, folder.id)
    setPage({ type: 'chat', id: null })
  }

  const handleNewFolder = async (): Promise<void> => {
    const newFolder = await window.api.folders.create(null, folder.id)
    if (newFolder) {
      startFolderRename(newFolder.id)
    }
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

          {CHAT_PROVIDER_LIST.map((provider) => (
            <ContextMenuItem key={provider.id} aria-label={`New ${provider.name} chat`} title={`New ${provider.name} chat`} onClick={() => createChat(provider.id)}>
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

      <ContextMenuSeparator />

      <ContextMenuItem onClick={onRename}>
        <Pencil />
        <span>Rename</span>
      </ContextMenuItem>
      <ContextMenuItem variant="destructive" onClick={() => void window.api.folders.delete(folder.id)}>
        <Trash2 />
        <span>Remove</span>
      </ContextMenuItem>
    </ContextMenuContent>
  )
}
