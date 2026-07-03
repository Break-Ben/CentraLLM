import { useEffect, useRef, useState } from 'react'
import { Folder } from 'lucide-react'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { attachInstruction, extractInstruction } from '@atlaskit/pragmatic-drag-and-drop-hitbox/list-item'
import { TableCell, TableRow } from '@/components/ui/table'
import { useFolderStore } from '@/stores/folder-store'
import { FolderRecord } from '@shared/folder'
import { DragItemData, DropFolderData } from '@/constants/directory'
import { cn } from '@/lib/utils'

interface FolderRowProps {
  folder: FolderRecord
  isCustomSort: boolean
  nextFolderId: number | null
  onOpen: () => void
  onDropItem: (source: DragItemData) => void
  onMoveBefore: (sourceId: number, targetId: number) => void
  onMoveAfter: (sourceId: number, targetId: number) => void
}

export function FolderRow({ folder, isCustomSort, nextFolderId, onOpen, onDropItem, onMoveBefore, onMoveAfter }: FolderRowProps) {
  const rowRef = useRef<HTMLTableRowElement | null>(null)
  const [dropIndicator, setDropIndicator] = useState<'inside' | 'top' | 'bottom' | null>(null)
  const isDescendant = useFolderStore((state) => state.actions.isDescendant)

  useEffect(() => {
    const element = rowRef.current
    if (!element) {
      return
    }

    return combine(
      draggable({
        element,
        getInitialData: () => ({ type: 'folder', id: folder.id, parentFolderId: folder.parentFolderId }) satisfies DragItemData
      }),
      dropTargetForElements({
        element,
        getData: ({ input, element }) =>
          attachInstruction({ type: 'folder', id: folder.id } satisfies DropFolderData, {
            input,
            element,
            operations: isCustomSort ? { 'reorder-before': 'available', 'reorder-after': 'available', combine: 'available' } : { combine: 'available' }
          }),
        canDrop: ({ source }) => {
          if (source.data.type === 'folder' && source.data.id === folder.id) {
            return false
          }
          if (source.data.type === 'folder' && isDescendant(source.data.id as number, folder.id)) {
            return false
          }
          return source.data.type === 'chat' || source.data.type === 'folder'
        },
        onDragEnter: ({ source, self }) => {
          if (source.data.type === 'chat') {
            setDropIndicator('inside')
          } else {
            const inst = extractInstruction(self.data)
            if (inst?.operation === 'reorder-before') {
              setDropIndicator('top')
            } else if (inst?.operation === 'reorder-after') {
              setDropIndicator('bottom')
            } else if (inst?.operation === 'combine') {
              setDropIndicator('inside')
            } else {
              setDropIndicator(null)
            }
          }
        },
        onDrag: ({ source, self }) => {
          if (source.data.type === 'chat') {
            setDropIndicator('inside')
          } else {
            const operation = extractInstruction(self.data)?.operation
            if (operation === 'reorder-before') {
              setDropIndicator('top')
            } else if (operation === 'reorder-after') {
              setDropIndicator('bottom')
            } else if (operation === 'combine') {
              setDropIndicator('inside')
            } else {
              setDropIndicator(null)
            }
          }
        },
        onDragLeave: () => setDropIndicator(null),
        onDrop: ({ source, self }) => {
          setDropIndicator(null)
          if (source.data.type === 'chat') {
            onDropItem(source.data as DragItemData)
            return
          }
          const operation = extractInstruction(self.data)?.operation
          if (operation === 'reorder-before') {
            onMoveBefore(source.data.id as number, folder.id)
          } else if (operation === 'reorder-after') {
            onMoveAfter(source.data.id as number, folder.id)
          } else {
            onDropItem(source.data as DragItemData)
          }
        }
      })
    )
  }, [folder.id, folder.parentFolderId, isCustomSort, nextFolderId, onDropItem, onMoveAfter, onMoveBefore, isDescendant])

  return (
    <TableRow
      ref={rowRef}
      className={cn(
        'cursor-default select-none',
        dropIndicator === 'inside' && 'bg-accent/60 text-accent-foreground',
        dropIndicator === 'top' && '[&>td]:shadow-[inset_0_2px_0_0_var(--primary)]',
        dropIndicator === 'bottom' && '[&>td]:shadow-[inset_0_-2px_0_0_var(--primary)]'
      )}
      onDoubleClick={onOpen}
    >
      <TableCell>
        <span className="inline-flex items-center gap-2">
          <Folder className="size-4" />
          <span>{folder.name}</span>
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">-</TableCell>
      <TableCell className="text-muted-foreground">-</TableCell>
    </TableRow>
  )
}
