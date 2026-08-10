import { ChatProviderLogo } from '@/components/chat-provider-logo'
import { ContextMenuContent, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu'
import { useShownProviders } from '@/hooks/use-providers'
import { useAppStateStore } from '@/stores/app-state-store'
import { useChatStore } from '@/stores/chat-store'
import { useNavigationStore } from '@/stores/navigation-store'
import { ChatProviderId } from '@shared/chat'
import { FolderRecord } from '@shared/folder'
import { getChatProvider } from '@/lib/chat'
import { MessageSquarePlus, FolderPlus, Pencil, Trash2, FolderOpen } from 'lucide-react'

interface SidebarFolderContextMenuProps {
  folder: FolderRecord
  onRename: (folderId: number) => void
}

export function SidebarFolderContextMenu({ folder, onRename }: SidebarFolderContextMenuProps): React.JSX.Element {
  const lastUsedProviderId = useAppStateStore((state) => state.lastUsedProviderId)
  const { set } = useAppStateStore((state) => state.actions)
  const { newChat } = useChatStore((state) => state.actions)
  const { setPage } = useNavigationStore((state) => state.actions)
  const shownProviders = useShownProviders()

  const lastUsedProvider = getChatProvider(lastUsedProviderId)

  const createChat = (providerId: ChatProviderId) => {
    void set('lastUsedProviderId', providerId)
    void newChat(providerId, folder.id)
    setPage({ type: 'chat', chatId: null, folderId: folder.id })
  }

  const handleNewFolder = async (): Promise<void> => {
    const newFolder = await window.api.folders.create(null, folder.id)
    if (newFolder) {
      onRename(newFolder.id)
    }
  }

  return (
    <ContextMenuContent>
      <ContextMenuItem onClick={() => setPage({ type: 'chat-list', folderId: folder.id })}>
        <FolderOpen />
        <span>View folder</span>
      </ContextMenuItem>

      <ContextMenuSeparator />

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
            <ContextMenuItem key={provider.id} aria-label={`New ${provider.name} chat`} title={`New ${provider.name} chat`} onClick={() => createChat(provider.id)}>
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
