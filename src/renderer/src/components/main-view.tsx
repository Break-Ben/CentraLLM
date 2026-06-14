import { useNavigationStore } from '@/stores/navigation-store'
import { SettingsPage } from '@/pages/settings-page'
import { HomePage } from '@/pages/home-page'

export function MainView(): React.JSX.Element {
  const page = useNavigationStore((state) => state.page)

  switch (page) {
    case 'settings':
      return <SettingsPage />
    case 'home':
    default:
      return <HomePage />
  }
}
