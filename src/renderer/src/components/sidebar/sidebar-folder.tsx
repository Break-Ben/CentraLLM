import { useEffect, useRef, useState } from 'react'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { attachInstruction, extractInstruction } from '@atlaskit/pragmatic-drag-and-drop-hitbox/list-item'
import { ChevronRight, Folder } from 'lucide-react'
import { SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'
import { InlineEdit } from '@/components/ui/inline-edit'
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import { FolderRecord } from '@shared/folder'
import { useAppStateStore } from '@/stores/app-state-store'
import { useUiStore } from '@/stores/ui-store'
import { useChatStore } from '@/stores/chat-store'
import { useFolderStore } from '@/stores/folder-store'
import { DragItemData, DropFolderData } from '@/constants/directory'
import { cn } from '@/lib/utils'
import { SidebarFolderContextMenu } from '@/components/context-menus/folder-context-menu'

interface SidebarFolderProps {
  folder: FolderRecord
  depth: number
  parentFolderId: number | null
  isCustomSort: boolean
}

export function SidebarFolder({ folder, depth, parentFolderId, isCustomSort }: SidebarFolderProps): React.JSX.Element {
  const { state: sidebarState } = useSidebar()
  const itemRef = useRef<HTMLButtonElement | null>(null)
  const [dropIndicator, setDropIndicator] = useState<'inside' | 'top' | 'bottom' | null>(null)

  const { moveToFolder: moveFolderToFolder, moveBefore, moveAfter, isDescendant } = useFolderStore((state) => state.actions)
  const { moveToFolder: moveChatToFolder } = useChatStore((state) => state.actions)

  const expandedFolderIds = useAppStateStore((state) => state.expandedFolderIds)
  const { set } = useAppStateStore((state) => state.actions)

  const editingElement = useUiStore((state) => state.editingElement)
  const { startEditing, stopEditing } = useUiStore((state) => state.actions)

  const isEditing = editingElement?.type === 'sidebar-folder' && editingElement.id === folder.id
  const isExpanded = expandedFolderIds.includes(folder.id)

  useEffect(() => {
    const element = itemRef.current
    if (!element) {
      return
    }

    return combine(
      draggable({
        element,
        getInitialData: () => ({ type: 'folder', id: folder.id, parentFolderId }) satisfies DragItemData
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => {
          if (source.data.type === 'folder' && source.data.id === folder.id) {
            return false
          }
          if (source.data.type === 'folder' && isDescendant(source.data.id as number, folder.id)) {
            return false
          }
          return source.data.type === 'chat' || source.data.type === 'folder'
        },
        getData: ({ input, element }) =>
          attachInstruction({ type: 'folder', id: folder.id } satisfies DropFolderData, {
            input,
            element,
            operations: isCustomSort ? { 'reorder-before': 'available', 'reorder-after': 'available', combine: 'available' } : { combine: 'available' }
          }),
        onDragEnter: ({ source, self }) => updateIndicator(source.data as DragItemData, self),
        onDrag: ({ source, self }) => updateIndicator(source.data as DragItemData, self),
        onDragLeave: () => setDropIndicator(null),
        onDrop: ({ source, self }) => {
          setDropIndicator(null)
          const src = source.data as DragItemData
          if (src.type === 'chat') {
            void moveChatToFolder(src.id, folder.id)
            return
          }

          const operation = extractInstruction(self.data)?.operation
          if (operation === 'reorder-before') {
            void moveBefore(src.id, folder.id)
          } else if (operation === 'reorder-after') {
            void moveAfter(src.id, folder.id)
          } else {
            void moveFolderToFolder(src.id, folder.id)
          }
        }
      })
    )

    function updateIndicator(src: DragItemData, self: { data: Record<string, unknown> }): void {
      if (src.type === 'chat') {
        setDropIndicator('inside')
        return
      }

      const operation = extractInstruction(self.data)?.operation
      if (operation === 'reorder-before') {
        setDropIndicator('top')
      } else if (operation === 'reorder-after') {
        setDropIndicator('bottom')
      } else {
        setDropIndicator('inside')
      }
    }
  }, [folder.id, parentFolderId, isCustomSort, moveChatToFolder, moveFolderToFolder, moveBefore, moveAfter, isDescendant])

  return (
    <SidebarMenuItem
      className={cn('transition-[margin-left] duration-200 ease-linear', dropIndicator === 'top' && 'shadow-[inset_0_2px_0_0_var(--primary)]', dropIndicator === 'bottom' && 'shadow-[inset_0_-2px_0_0_var(--primary)]')}
      style={{ marginLeft: sidebarState === 'expanded' ? depth * 24 : 0 }}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <SidebarMenuButton
            ref={itemRef}
            title={folder.name}
            className={cn('[clip-path:inset(0_round_var(--radius-md))]', dropIndicator === 'inside' && 'bg-sidebar-accent text-sidebar-accent-foreground')}
            onClick={() => {
              if (isEditing) {
                return
              }
              const next = isExpanded ? expandedFolderIds.filter((id) => id !== folder.id) : [...expandedFolderIds, folder.id]
              void set('expandedFolderIds', next)
            }}
            onDoubleClick={() => {
              startEditing({ type: 'sidebar-folder', id: folder.id })
            }}
          >
            <ChevronRight className={isExpanded ? 'rotate-90 transition-transform' : 'transition-transform'} />
            <Folder />
            <InlineEdit
              value={folder.name}
              isEditing={isEditing}
              onSave={async (next) => {
                await window.api.folders.rename(folder.id, next)
              }}
              onClose={stopEditing}
              aria-label={`Rename folder ${folder.name}`}
            />
          </SidebarMenuButton>
        </ContextMenuTrigger>
        <SidebarFolderContextMenu folder={folder} onRename={(folderId) => startEditing({ type: 'sidebar-folder', id: folderId })} />
      </ContextMenu>
    </SidebarMenuItem>
  )
}
