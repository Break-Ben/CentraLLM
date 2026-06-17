import { useEffect } from 'react'
import { useAppStateStore } from '@/stores/app-state-store'
import { usePreferencesStore } from '@/stores/preferences-store'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { MainView } from '@/components/main-view'

export default function App(): React.JSX.Element {
  useEffect(() => {
    useAppStateStore.getState().actions.init()
    usePreferencesStore.getState().actions.init()
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="flex min-h-0 flex-1">
          <MainView />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
