import { useNavigationStore } from '@/stores/navigation-store'
import { ChatListPage } from '@/pages/chat-list/chat-list-page'
import { ChatPage } from '@/pages/chat/chat-page'
import { SearchPage } from '@/pages/search/search-page'
import { SettingsPage } from '@/pages/settings/settings-page'
import { HomePage } from '@/pages/home/home-page'

export function MainView(): React.JSX.Element {
  const page = useNavigationStore((state) => state.page)

  switch (page.type) {
    case 'chat-list':
      return <ChatListPage />
    case 'chat':
      return <ChatPage />
    case 'search':
      return <SearchPage />
    case 'settings':
      return <SettingsPage />
    case 'home':
    default:
      return <HomePage />
  }
}
