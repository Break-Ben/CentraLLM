import { ChevronDownIcon } from 'lucide-react'
import { useAppStateStore } from '@/stores/app-state-store'
import { useChatStore } from '@/stores/chat-store'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChatProviderIcon } from '@/components/chat-provider-icon'
import { useSidebar } from '@/components/ui/sidebar'
import { CHAT_PROVIDER_LIST, getChatProvider } from '@shared/chat'
import { useNavigationStore } from '@/stores/navigation-store'

export function NewChatSplitButton(): React.JSX.Element {
  const { state: sidebarState, isMobile } = useSidebar()
  const isCompact = sidebarState === 'collapsed' || isMobile

  const lastUsedProviderId = useAppStateStore((state) => state.lastUsedProviderId)
  const { set } = useAppStateStore((state) => state.actions)
  const { newChat } = useChatStore((state) => state.actions)
  const { setPage } = useNavigationStore((state) => state.actions)

  const lastUsedProvider = getChatProvider(lastUsedProviderId)

  if (isCompact) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start px-1.75"
        aria-label={`New ${lastUsedProvider.name} chat`}
        title={`New ${lastUsedProvider.name} chat`}
        onClick={() => {
          void newChat(lastUsedProviderId)
          setPage({ type: 'chat', id: null })
        }}
      >
        <ChatProviderIcon providerId={lastUsedProviderId} />
      </Button>
    )
  }

  return (
    <ButtonGroup className="w-full">
      <Button
        variant="outline"
        className="flex-1 justify-start gap-2 px-1.75"
        aria-label={`New ${lastUsedProvider.name} chat`}
        title={`New ${lastUsedProvider.name} chat`}
        onClick={() => {
          void newChat(lastUsedProviderId)
          setPage({ type: 'chat', id: null })
        }}
      >
        <ChatProviderIcon providerId={lastUsedProviderId} />
        <span>New Chat</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="px-2"
          render={
            <Button variant="outline" aria-label="Choose chat provider" title="Choose chat provider">
              <ChevronDownIcon />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            {CHAT_PROVIDER_LIST.map((provider) => (
              <DropdownMenuItem
                key={provider.id}
                aria-label={`New ${provider.name} chat`}
                title={`New ${provider.name} chat`}
                onClick={() => {
                  void set('lastUsedProviderId', provider.id)
                  void newChat(provider.id)
                  setPage({ type: 'chat', id: null })
                }}
              >
                <ChatProviderIcon providerId={provider.id} />
                <span>{provider.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}
