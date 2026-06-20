import { useEffect } from 'react'
import { useChatStore } from '@/stores/chat-store'
import { useFolderStore } from '@/stores/folder-store'
import { useAppStateStore } from '@/stores/app-state-store'
import { usePreferencesStore } from '@/stores/preferences-store'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { MainView } from '@/components/main-view'
import { useThemeSync } from '@/hooks/use-theme-sync'

export default function App(): React.JSX.Element {
  useThemeSync()

  useEffect(() => {
    useAppStateStore.getState().actions.init()
    usePreferencesStore.getState().actions.init()
    const cleanupChats = useChatStore.getState().actions.init()
    const cleanupFolders = useFolderStore.getState().actions.init()

    return () => {
      cleanupChats()
      cleanupFolders()
    }
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
