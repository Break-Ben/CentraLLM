import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from '@/components/ui/sidebar'
import { useEffect } from 'react'
import { Plus, House, Settings } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigation-store'
import { useChatStore } from '@/stores/chat-store'
import { getChatDisplayName } from '@shared/chat'

export function AppSidebar(): React.JSX.Element {
  const page = useNavigationStore((state) => state.page)
  const setPage = useNavigationStore((state) => state.setPage)

  const chats = useChatStore((state) => state.chats)
  const { setChats, openChat, newChat } = useChatStore((state) => state.actions)

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
            <SidebarMenuButton
              onClick={() => {
                setPage({ type: 'chat', id: null })
                void newChat()
              }}
            >
              <Plus />
              <span>New Chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    isActive={page.type === 'chat' && page.id === chat.id}
                    onClick={() => {
                      setPage({ type: 'chat', id: chat.id })
                      void openChat(chat.id)
                    }}
                  >
                    <span>{getChatDisplayName(chat)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
