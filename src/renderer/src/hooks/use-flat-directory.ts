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

    const foldersByParent = Map.groupBy(folders, (folder) => folder.parentFolderId)
    const chatsByFolder = Map.groupBy(chats, (chat) => chat.folderId)

    function walk(parentFolderId: number | null, depth: number): void {
      const levelFolders = foldersByParent.get(parentFolderId) ?? []
      const levelChats = chatsByFolder.get(parentFolderId) ?? []
      const { folders: sortedFolders, chats: sortedChats } = sortDirectoryLevel(levelFolders, levelChats, sortingOrder)

      sortedFolders.forEach((folder) => {
        items.push({ type: 'folder', folder, depth, parentFolderId })
        if (expandedSet.has(folder.id)) {
          walk(folder.id, depth + 1)
        }
      })

      sortedChats.forEach((chat) => {
        items.push({ type: 'chat', chat, depth, parentFolderId })
      })
    }

    walk(null, 0)
    return items
  }, [chats, folders, sortingOrder, expandedFolderIds])
}
