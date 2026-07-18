import { useMemo } from 'react'
import { useChatStore } from '@/stores/chat-store'
import { useFolderStore } from '@/stores/folder-store'
import { SortingOrder } from '@shared/app-state'
import { ChatRecord } from '@shared/chat'
import { getChatDisplayName } from '@/lib/chat'
import { FolderRecord } from '@shared/folder'
import { DirectoryItem } from '@/constants/directory'

export function useDirectory(sortingOrder: SortingOrder, folderId: number | null): DirectoryItem[] {
  const chats = useChatStore((state) => state.chats)
  const folders = useFolderStore((state) => state.folders)

  return useMemo(() => {
    const levelFolders = folders.filter((folder) => folder.parentFolderId === folderId)
    const levelChats = chats.filter((chat) => chat.folderId === folderId)
    const { folders: sortedFolders, chats: sortedChats } = sortDirectoryLevel(levelFolders, levelChats, sortingOrder)

    const folderItems = sortedFolders.map((folder): DirectoryItem => ({ type: 'folder', folder }))
    const chatItems = sortedChats.map((chat): DirectoryItem => ({ type: 'chat', chat }))

    return [...folderItems, ...chatItems]
  }, [chats, folders, sortingOrder, folderId])
}

export function sortDirectoryLevel(folders: FolderRecord[], chats: ChatRecord[], sortingOrder: SortingOrder): { folders: FolderRecord[]; chats: ChatRecord[] } {
  const sortedFolders = [...folders]
  const sortedChats = [...chats]

  if (sortingOrder === 'alphabetical') {
    sortedFolders.sort((a, b) => a.name.localeCompare(b.name))
    sortedChats.sort((a, b) => getChatDisplayName(a).localeCompare(getChatDisplayName(b)))
  } else if (sortingOrder === 'last_opened') {
    sortedFolders.sort((a, b) => a.name.localeCompare(b.name))
    sortedChats.sort((a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime())
  } else if (sortingOrder === 'custom') {
    sortedFolders.sort((a, b) => a.customOrder - b.customOrder)
    sortedChats.sort((a, b) => a.customOrder - b.customOrder)
  }

  return { folders: sortedFolders, chats: sortedChats }
}
