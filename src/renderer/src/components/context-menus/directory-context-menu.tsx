import { ChatProviderLogo } from '@/components/chat-provider-logo'
import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger } from '@/components/ui/context-menu'
import { useShownProviders } from '@/hooks/use-providers'
import { useAppStateStore } from '@/stores/app-state-store'
import { useChatStore } from '@/stores/chat-store'
import { useNavigationStore } from '@/stores/navigation-store'
import { useUiStore } from '@/stores/ui-store'
import { ChatProviderId } from '@shared/chat'
import { getChatProvider } from '@/lib/chat'
import { MessageSquarePlus, FolderPlus } from 'lucide-react'

interface DirectoryContextMenuProps {
  parentFolderId: number | null
  editingType: 'sidebar-folder' | 'row-folder'
}

export function DirectoryContextMenu({ parentFolderId, editingType }: DirectoryContextMenuProps): React.JSX.Element {
  const lastUsedProviderId = useAppStateStore((state) => state.lastUsedProviderId)
  const { set } = useAppStateStore((state) => state.actions)
  const { newChat } = useChatStore((state) => state.actions)
  const { setPage } = useNavigationStore((state) => state.actions)
  const { startEditing } = useUiStore((state) => state.actions)
  const shownProviders = useShownProviders()

  const lastUsedProvider = getChatProvider(lastUsedProviderId)

  const handleNewFolder = async (): Promise<void> => {
    const newFolder = await window.api.folders.create(null, parentFolderId)
    if (newFolder) {
      startEditing({ type: editingType, id: newFolder.id })
    }
  }

  const createChat = (providerId: ChatProviderId) => {
    void set('lastUsedProviderId', providerId)
    void newChat(providerId, parentFolderId ?? undefined)
    setPage({ type: 'chat', chatId: null, folderId: parentFolderId })
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
    </ContextMenuContent>
  )
}
