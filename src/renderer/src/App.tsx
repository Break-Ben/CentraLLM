import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { MainView } from '@/components/main-view'

export default function App(): React.JSX.Element {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main>
          <MainView />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
