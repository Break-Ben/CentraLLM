import { SidebarMenuItem, SidebarMenuButton, SidebarMenuSubItem, SidebarMenuSubButton } from '@/components/ui/sidebar'
import { useNavigationStore } from '@/stores/navigation-store'
import { useChatStore } from '@/stores/chat-store'
import { ChatRecord, getChatDisplayName } from '@shared/chat'
import { ChatProviderIcon } from '@/components/chat-provider-icon'

interface SidebarChatProps {
  chat: ChatRecord
  isSub?: boolean
}

export function SidebarChat({ chat, isSub = false }: SidebarChatProps): React.JSX.Element {
  const page = useNavigationStore((state) => state.page)
  const { setPage } = useNavigationStore((state) => state.actions)
  const { openChat } = useChatStore((state) => state.actions)

  const displayName = getChatDisplayName(chat)
  const ItemComponent = isSub ? SidebarMenuSubItem : SidebarMenuItem
  const ButtonComponent = isSub ? SidebarMenuSubButton : SidebarMenuButton

  return (
    <ItemComponent>
      <ButtonComponent
        isActive={page.type === 'chat' && page.id === chat.id}
        title={displayName}
        onClick={() => {
          setPage({ type: 'chat', id: chat.id })
          void openChat(chat.id)
        }}
      >
        <ChatProviderIcon providerId={chat.providerId} />
        <span>{displayName}</span>
      </ButtonComponent>
    </ItemComponent>
  )
}
