import { useAppStateStore } from '@/stores/app-state-store'
import { useChatStore } from '@/stores/chat-store'
import { Button } from '@/components/ui/button'
import { ChatProviderLogo } from '@/components/chat-provider-icon'
import { CHAT_PROVIDERS, getChatProvider } from '@shared/chat'
import { useNavigationStore } from '@/stores/navigation-store'

export function ProviderList(): React.JSX.Element {
  const lastUsedProviderId = useAppStateStore((state) => state.lastUsedProviderId)
  const { set } = useAppStateStore((state) => state.actions)
  const { newChat } = useChatStore((state) => state.actions)
  const { setPage } = useNavigationStore((state) => state.actions)

  const lastUsedProvider = getChatProvider(lastUsedProviderId)

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <Button
        variant="default"
        className="w-full justify-start gap-2"
        aria-label={`New ${lastUsedProvider.name} chat`}
        title={`New ${lastUsedProvider.name} chat`}
        onClick={() => {
          void newChat(lastUsedProviderId)
          setPage({ type: 'chat', chatId: null, folderId: null })
        }}
      >
        <ChatProviderLogo providerId={lastUsedProviderId} />
        <span>New {lastUsedProvider.name} Chat</span>
      </Button>

      <div className="flex flex-col divide-y border rounded-md overflow-hidden">
        {CHAT_PROVIDERS.map((provider) => (
          <Button
            key={provider.id}
            variant="ghost"
            className="w-full justify-start gap-2 rounded-none px-3 font-normal"
            aria-label={`New ${provider.name} chat`}
            title={`New ${provider.name} chat`}
            onClick={() => {
              void set('lastUsedProviderId', provider.id)
              void newChat(provider.id)
              setPage({ type: 'chat', chatId: null, folderId: null })
            }}
          >
            <ChatProviderLogo providerId={provider.id} />
            <span>New {provider.name} Chat</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
