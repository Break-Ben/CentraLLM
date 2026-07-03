import { useNavigationStore } from '@/stores/navigation-store'
import { HomePage } from '@/pages/home/home-page'
import { ChatListPage } from '@/pages/chat-list/chat-list-page'
import { ChatPage } from '@/pages/chat/chat-page'
import { SettingsPage } from '@/pages/settings/settings-page'

export function MainView(): React.JSX.Element {
  const page = useNavigationStore((state) => state.page)

  switch (page.type) {
    case 'chat-list':
      return <ChatListPage />
    case 'chat':
      return <ChatPage />
    case 'settings':
      return <SettingsPage />
    case 'home':
    default:
      return <HomePage />
  }
}
