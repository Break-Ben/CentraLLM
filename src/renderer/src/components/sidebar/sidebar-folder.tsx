import { Dispatch, SetStateAction } from 'react'
import { ChevronRight, Folder } from 'lucide-react'
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from '@/components/ui/sidebar'
import { SidebarChat } from '@/components/sidebar/sidebar-chat'
import { FolderNode } from '@shared/folder'

interface SidebarFolderProps {
  folder: FolderNode
  isSub?: boolean
  expandedFolderIds: Set<number>
  setExpandedFolderIds: Dispatch<SetStateAction<Set<number>>>
}

export function SidebarFolder({ folder, isSub = false, expandedFolderIds, setExpandedFolderIds }: SidebarFolderProps): React.JSX.Element {
  const isExpanded = expandedFolderIds.has(folder.id)
  const ItemComponent = isSub ? SidebarMenuSubItem : SidebarMenuItem
  const ButtonComponent = isSub ? SidebarMenuSubButton : SidebarMenuButton

  return (
    <ItemComponent>
      <ButtonComponent
        title={folder.name}
        onClick={() => {
          setExpandedFolderIds((current) => {
            const next = new Set(current)
            if (next.has(folder.id)) {
              next.delete(folder.id)
            } else {
              next.add(folder.id)
            }
            return next
          })
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
            <SidebarFolder key={child.id} folder={child} isSub={true} expandedFolderIds={expandedFolderIds} setExpandedFolderIds={setExpandedFolderIds} />
          ))}
        </SidebarMenuSub>
      )}
    </ItemComponent>
  )
}
