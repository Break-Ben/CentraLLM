import { ChatProviderIcon } from '@/components/chat-provider-icon'
import { ContextMenuContent, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu'
import { useAppStateStore } from '@/stores/app-state-store'
import { useChatStore } from '@/stores/chat-store'
import { useNavigationStore } from '@/stores/navigation-store'
import { getChatProvider, ChatProviderId, CHAT_PROVIDERS } from '@shared/chat'
import { FolderRecord } from '@shared/folder'
import { MessageSquarePlus, FolderPlus, Pencil, Trash2 } from 'lucide-react'

interface SidebarFolderContextMenuProps {
  folder: FolderRecord
  onRename: (folderId: number) => void
}

export function SidebarFolderContextMenu({ folder, onRename }: SidebarFolderContextMenuProps): React.JSX.Element {
  const lastUsedProviderId = useAppStateStore((state) => state.lastUsedProviderId)
  const { set } = useAppStateStore((state) => state.actions)
  const { newChat } = useChatStore((state) => state.actions)
  const { setPage } = useNavigationStore((state) => state.actions)

  const lastUsedProvider = getChatProvider(lastUsedProviderId)

  const createChat = (providerId: ChatProviderId) => {
    void set('lastUsedProviderId', providerId)
    void newChat(providerId, folder.id)
    setPage({ type: 'chat', id: null })
  }

  const handleNewFolder = async (): Promise<void> => {
    const newFolder = await window.api.folders.create(null, folder.id)
    if (newFolder) {
      onRename(newFolder.id)
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

          {CHAT_PROVIDERS.map((provider) => (
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

      <ContextMenuItem onClick={() => onRename(folder.id)}>
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
