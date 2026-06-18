import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { useNavigationStore } from '@/stores/navigation-store'
import { useChatStore } from '@/stores/chat-store'
import { ChatRecord, getChatDisplayName } from '@shared/chat'
import { ChatProviderIcon } from '@/components/chat-provider-icon'

interface SidebarChatProps {
  chat: ChatRecord
}

export function SidebarChat({ chat }: SidebarChatProps): React.JSX.Element {
  const page = useNavigationStore((state) => state.page)
  const { setPage } = useNavigationStore((state) => state.actions)
  const { openChat } = useChatStore((state) => state.actions)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={page.type === 'chat' && page.id === chat.id}
        onClick={() => {
          setPage({ type: 'chat', id: chat.id })
          void openChat(chat.id)
        }}
      >
        <ChatProviderIcon providerId={chat.providerId} />
        <span>{getChatDisplayName(chat)}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
