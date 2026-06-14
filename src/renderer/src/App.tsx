import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

export default function App(): React.JSX.Element {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="p-4">
          <p>Hello World</p>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
