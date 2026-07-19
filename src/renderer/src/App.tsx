import { useEffect } from 'react'
import { useNavigationStore } from '@/stores/navigation-store'
import { useChatStore } from '@/stores/chat-store'
import { useFolderStore } from '@/stores/folder-store'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { MainView } from '@/components/main-view'
import { useThemeSync } from '@/hooks/use-theme-sync'
import { AppTitlebar } from '@/components/app-titlebar'

export default function App(): React.JSX.Element {
  useThemeSync()

  useEffect(() => {
    const cleanupNavigation = useNavigationStore.getState().actions.init()
    const cleanupChats = useChatStore.getState().actions.init()
    const cleanupFolders = useFolderStore.getState().actions.init()

    return () => {
      cleanupNavigation()
      cleanupChats()
      cleanupFolders()
    }
  }, [])

  return (
    <div className="flex h-screen flex-col">
      <AppTitlebar />
      <SidebarProvider className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar />
        <SidebarInset>
          <main className="flex min-h-0 flex-1 overflow-hidden">
            <MainView />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
