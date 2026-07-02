import { useMemo } from 'react'
import { useChatStore } from '@/stores/chat-store'
import { useFolderStore } from '@/stores/folder-store'
import { SortingOrder } from '@shared/app-state'
import { sortDirectoryLevel } from '@/hooks/use-directory'
import { FlatDirectoryItem } from '@/constants/directory'

export function useFlatDirectory(sortingOrder: SortingOrder, expandedFolderIds: number[]): FlatDirectoryItem[] {
  const chats = useChatStore((state) => state.chats)
  const folders = useFolderStore((state) => state.folders)

  return useMemo(() => {
    const expandedSet = new Set(expandedFolderIds)
    const items: FlatDirectoryItem[] = []

    function walk(parentFolderId: number | null, depth: number): void {
      const levelFolders = folders.filter((folder) => folder.parentFolderId === parentFolderId)
      const levelChats = chats.filter((chat) => chat.folderId === parentFolderId)
      const { folders: sortedFolders, chats: sortedChats } = sortDirectoryLevel(levelFolders, levelChats, sortingOrder)

      sortedFolders.forEach((folder, index) => {
        items.push({
          type: 'folder',
          folder,
          depth,
          parentFolderId,
          nextSiblingId: sortedFolders[index + 1]?.id ?? null
        })
        if (expandedSet.has(folder.id)) {
          walk(folder.id, depth + 1)
        }
      })

      sortedChats.forEach((chat, index) => {
        items.push({
          type: 'chat',
          chat,
          depth,
          parentFolderId,
          nextSiblingId: sortedChats[index + 1]?.id ?? null
        })
      })
    }

    walk(null, 0)
    return items
  }, [chats, folders, sortingOrder, expandedFolderIds])
}
