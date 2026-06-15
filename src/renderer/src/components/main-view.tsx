import { useNavigationStore } from '@/stores/navigation-store'
import { SettingsPage } from '@/pages/settings-page'
import { HomePage } from '@/pages/home-page'
import { ChatPage } from '@/pages/chat-page'

export function MainView(): React.JSX.Element {
  const page = useNavigationStore((state) => state.page)

  switch (page.type) {
    case 'settings':
      return <SettingsPage />
    case 'chat':
      return <ChatPage />
    case 'home':
    default:
      return <HomePage />
  }
}
