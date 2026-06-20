import { ChevronRight, Folder, FolderPlus, MessageSquarePlus, Pencil, Trash2 } from 'lucide-react'
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from '@/components/ui/sidebar'
import { SidebarChat } from '@/components/sidebar/sidebar-chat'
import { InlineEdit } from '@/components/ui/inline-edit'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu'
import { FolderNode } from '@shared/folder'
import { useAppStateStore } from '@/stores/app-state-store'
import { useUiStore } from '@/stores/ui-store'

interface SidebarFolderProps {
  folder: FolderNode
  isSub?: boolean
}

export function SidebarFolder({ folder, isSub = false }: SidebarFolderProps): React.JSX.Element {
  const expandedFolderIds = useAppStateStore((state) => state.expandedFolderIds)
  const { set } = useAppStateStore((state) => state.actions)

  const editingFolderId = useUiStore((state) => state.editingFolderId)
  const { startFolderRename, stopFolderRename } = useUiStore((state) => state.actions)

  const isEditing = editingFolderId === folder.id
  const isExpanded = expandedFolderIds.includes(folder.id)
  const ItemComponent = isSub ? SidebarMenuSubItem : SidebarMenuItem
  const ButtonComponent = isSub ? SidebarMenuSubButton : SidebarMenuButton

  return (
    <ItemComponent>
      <ContextMenu>
        <ContextMenuTrigger>
          <ButtonComponent
            title={folder.name}
            onClick={() => {
              if (isEditing) {
                return
              }
              const next = isExpanded ? expandedFolderIds.filter((id) => id !== folder.id) : [...expandedFolderIds, folder.id]
              void set('expandedFolderIds', next)
            }}
          >
            <ChevronRight className={isExpanded ? 'rotate-90 transition-transform' : 'transition-transform'} />
            <Folder />
            {isEditing ? (
              <InlineEdit
                initialValue={folder.name}
                onSave={async (next) => {
                  await window.api.folders.rename(folder.id, next)
                }}
                onClose={stopFolderRename}
                aria-label={`Rename folder ${folder.name}`}
              />
            ) : (
              <span>{folder.name}</span>
            )}
          </ButtonComponent>
        </ContextMenuTrigger>
        <SidebarFolderContextMenu folder={folder} onRename={() => startFolderRename(folder.id)} />
      </ContextMenu>

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

interface SidebarFolderContextMenuProps {
  folder: FolderNode
  onRename: () => void
}

function SidebarFolderContextMenu({ folder, onRename }: SidebarFolderContextMenuProps): React.JSX.Element {
  return (
    <ContextMenuContent>
      <ContextMenuItem onClick={() => console.log('New folder clicked', folder.id)}>
        <FolderPlus />
        <span>New folder</span>
      </ContextMenuItem>
      <ContextMenuItem onClick={() => console.log('New chat clicked', folder.id)}>
        <MessageSquarePlus />
        <span>New chat</span>
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem onClick={onRename}>
        <Pencil />
        <span>Rename</span>
      </ContextMenuItem>
      <ContextMenuItem className="text-destructive focus:text-destructive" onClick={() => void window.api.folders.delete(folder.id)}>
        <Trash2 />
        <span>Remove</span>
      </ContextMenuItem>
    </ContextMenuContent>
  )
}
