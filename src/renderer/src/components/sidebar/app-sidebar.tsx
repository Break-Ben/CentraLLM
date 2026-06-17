import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from '@/components/ui/sidebar'
import { useEffect } from 'react'
import { House, Settings } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigation-store'
import { useChatStore } from '@/stores/chat-store'
import { SidebarChat } from '@/components/sidebar/sidebar-chat'
import { NewChatSplitButton } from '@/components/sidebar/new-chat-split-button'

export function AppSidebar(): React.JSX.Element {
  const page = useNavigationStore((state) => state.page)
  const setPage = useNavigationStore((state) => state.setPage)

  const chats = useChatStore((state) => state.chats)
  const { setChats } = useChatStore((state) => state.actions)

  useEffect(() => {
    let cancelled = false

    void window.api.chats.list().then((items) => {
      if (!cancelled) {
        setChats(items)
      }
    })
    const disposeChats = window.api.chats.onChanged(setChats)
    const disposeActive = window.api.chats.onActiveChanged((activeId) => {
      setPage({ type: 'chat', id: activeId })
    })

    return () => {
      cancelled = true
      disposeChats()
      disposeActive()
    }
  }, [setChats, setPage])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={page.type === 'home'} onClick={() => setPage({ type: 'home' })}>
              <House />
              <span>Home</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <NewChatSplitButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarChat key={chat.id} chat={chat} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={page.type === 'settings'} onClick={() => setPage({ type: 'settings' })}>
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
