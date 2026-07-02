import { useEffect, useRef, useState } from 'react'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { attachInstruction, extractInstruction } from '@atlaskit/pragmatic-drag-and-drop-hitbox/list-item'
import { ChevronRight, Folder, FolderPlus, MessageSquarePlus, Pencil, Trash2 } from 'lucide-react'
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { InlineEdit } from '@/components/ui/inline-edit'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from '@/components/ui/context-menu'
import { FolderRecord } from '@shared/folder'
import { useAppStateStore } from '@/stores/app-state-store'
import { useUiStore } from '@/stores/ui-store'
import { useChatStore } from '@/stores/chat-store'
import { useFolderStore } from '@/stores/folder-store'
import { ChatProviderIcon } from '@/components/chat-provider-icon'
import { useNavigationStore } from '@/stores/navigation-store'
import { getChatProvider, ChatProviderId, CHAT_PROVIDERS } from '@shared/chat'
import { DragItemData, DropFolderData } from '@/constants/directory'
import { cn } from '@/lib/utils'

interface SidebarFolderProps {
  folder: FolderRecord
  depth: number
  parentFolderId: number | null
  nextSiblingId: number | null
  isCustomSort: boolean
}

export function SidebarFolder({ folder, depth, parentFolderId, nextSiblingId, isCustomSort }: SidebarFolderProps): React.JSX.Element {
  const itemRef = useRef<HTMLLIElement | null>(null)
  const [dropIndicator, setDropIndicator] = useState<'inside' | 'top' | 'bottom' | null>(null)

  const folders = useFolderStore((state) => state.folders)
  const { moveToFolder: moveFolderToFolder, moveBefore: moveFolderBefore } = useFolderStore((state) => state.actions)
  const { moveToFolder: moveChatToFolder } = useChatStore((state) => state.actions)

  const expandedFolderIds = useAppStateStore((state) => state.expandedFolderIds)
  const { set } = useAppStateStore((state) => state.actions)

  const editingFolderId = useUiStore((state) => state.editingFolderId)
  const { startFolderRename, stopFolderRename } = useUiStore((state) => state.actions)

  const isEditing = editingFolderId === folder.id
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
          if (source.data.type === 'folder' && isDescendant(source.data.id as number, folder.id, folders)) {
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
            void moveFolderBefore(src.id, folder.id)
          } else if (operation === 'reorder-after') {
            void moveFolderBefore(src.id, nextSiblingId)
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
  }, [folder.id, parentFolderId, nextSiblingId, isCustomSort, folders, moveChatToFolder, moveFolderToFolder, moveFolderBefore])

  return (
    <SidebarMenuItem
      ref={itemRef}
      className={cn('[clip-path:inset(0_round_0.375rem)]', dropIndicator === 'top' && 'shadow-[inset_0_2px_0_0_var(--primary)]', dropIndicator === 'bottom' && 'shadow-[inset_0_-2px_0_0_var(--primary)]')}
      style={{ marginLeft: depth * 24 }}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <SidebarMenuButton
            title={folder.name}
            className={cn(dropIndicator === 'inside' && 'bg-sidebar-accent text-sidebar-accent-foreground')}
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
          </SidebarMenuButton>
        </ContextMenuTrigger>
        <SidebarFolderContextMenu folder={folder} onRename={() => startFolderRename(folder.id)} />
      </ContextMenu>
    </SidebarMenuItem>
  )
}

interface SidebarFolderContextMenuProps {
  folder: FolderRecord
  onRename: () => void
}

function SidebarFolderContextMenu({ folder, onRename }: SidebarFolderContextMenuProps): React.JSX.Element {
  const lastUsedProviderId = useAppStateStore((state) => state.lastUsedProviderId)
  const { set } = useAppStateStore((state) => state.actions)
  const { newChat } = useChatStore((state) => state.actions)
  const { setPage } = useNavigationStore((state) => state.actions)
  const { startFolderRename } = useUiStore((state) => state.actions)

  const lastUsedProvider = getChatProvider(lastUsedProviderId)

  const createChat = (providerId: ChatProviderId) => {
    void set('lastUsedProviderId', providerId)
    void newChat(providerId, folder.id)
    setPage({ type: 'chat', id: null })
  }

  const handleNewFolder = async (): Promise<void> => {
    const newFolder = await window.api.folders.create(null, folder.id)
    if (newFolder) {
      startFolderRename(newFolder.id)
    }
  }

  return (
    <ContextMenuContent>
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <MessageSquarePlus />
          <span>New chat</span>
        </ContextMenuSubTrigger>

        <ContextMenuSubContent>
          <ContextMenuItem aria-label={`New ${lastUsedProvider.name} chat`} title={`New ${lastUsedProvider.name} chat`} onClick={() => createChat(lastUsedProvider.id)}>
            <ChatProviderIcon providerId={lastUsedProvider.id} />
            <span>{lastUsedProvider.name}</span>
          </ContextMenuItem>

          <ContextMenuSeparator />

          {CHAT_PROVIDERS.map((provider) => (
            <ContextMenuItem key={provider.id} aria-label={`New ${provider.name} chat`} title={`New ${provider.name} chat`} onClick={() => createChat(provider.id)}>
              <ChatProviderIcon providerId={provider.id} />
              <span>{provider.name}</span>
            </ContextMenuItem>
          ))}
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuItem onClick={handleNewFolder}>
        <FolderPlus />
        <span>New folder</span>
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem onClick={onRename}>
        <Pencil />
        <span>Rename</span>
      </ContextMenuItem>
      <ContextMenuItem variant="destructive" onClick={() => void window.api.folders.delete(folder.id)}>
        <Trash2 />
        <span>Remove</span>
      </ContextMenuItem>
    </ContextMenuContent>
  )
}

function isDescendant(ancestorId: number, folderId: number, folders: FolderRecord[]): boolean {
  const foldersById = new Map(folders.map((folder) => [folder.id, folder]))
  let current = foldersById.get(folderId)?.parentFolderId ?? null
  while (current !== null) {
    if (current === ancestorId) {
      return true
    }
    current = foldersById.get(current)?.parentFolderId ?? null
  }
  return false
}
