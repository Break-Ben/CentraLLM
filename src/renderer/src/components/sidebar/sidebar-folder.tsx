import { ChevronRight, Folder } from 'lucide-react'
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from '@/components/ui/sidebar'
import { SidebarChat } from '@/components/sidebar/sidebar-chat'
import { FolderNode } from '@shared/folder'
import { useAppStateStore } from '@/stores/app-state-store'

interface SidebarFolderProps {
  folder: FolderNode
  isSub?: boolean
}

export function SidebarFolder({ folder, isSub = false }: SidebarFolderProps): React.JSX.Element {
  const expandedFolderIds = useAppStateStore((state) => state.expandedFolderIds)
  const { set } = useAppStateStore((state) => state.actions)

  const isExpanded = expandedFolderIds.includes(folder.id)
  const ItemComponent = isSub ? SidebarMenuSubItem : SidebarMenuItem
  const ButtonComponent = isSub ? SidebarMenuSubButton : SidebarMenuButton

  return (
    <ItemComponent>
      <ButtonComponent
        title={folder.name}
        onClick={() => {
          const next = isExpanded ? expandedFolderIds.filter((id) => id !== folder.id) : [...expandedFolderIds, folder.id]
          void set('expandedFolderIds', next)
        }}
      >
        <ChevronRight className={isExpanded ? 'rotate-90 transition-transform' : 'transition-transform'} />
        <Folder />
        <span>{folder.name}</span>
      </ButtonComponent>

      {isExpanded && (folder.chats.length > 0 || folder.folders.length > 0) && (
        <SidebarMenuSub>
          {folder.chats.map((chat) => (
            <SidebarChat key={chat.id} chat={chat} isSub={true} />
          ))}
          {folder.folders.map((child) => (
            <SidebarFolder key={child.id} folder={child} isSub={true} />
          ))}
        </SidebarMenuSub>
      )}
    </ItemComponent>
  )
}
