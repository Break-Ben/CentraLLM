import { useMemo } from 'react'
import { useChatStore } from '@/stores/chat-store'
import { useFolderStore } from '@/stores/folder-store'
import { SortingOrder } from '@shared/app-state'
import { getChatDisplayName } from '@shared/chat'
import { DirectoryItem } from '@/constants/directory'

export function useDirectory(sortingOrder: SortingOrder, folderId?: number | null): DirectoryItem[] {
  const chats = useChatStore((state) => state.chats)
  const folders = useFolderStore((state) => state.folders)

  return useMemo(() => {
    const filteredFolders = folderId === undefined ? folders : folders.filter((folder) => folder.parentFolderId === folderId)
    const filteredChats = folderId === undefined ? chats : chats.filter((chat) => chat.folderId === folderId)

    if (sortingOrder === 'alphabetical') {
      filteredFolders.sort((a, b) => a.name.localeCompare(b.name))
      filteredChats.sort((a, b) => getChatDisplayName(a).localeCompare(getChatDisplayName(b)))
    } else if (sortingOrder === 'last_opened') {
      filteredFolders.sort((a, b) => a.name.localeCompare(b.name))
      filteredChats.sort((a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime())
    } else if (sortingOrder === 'custom') {
      filteredFolders.sort((a, b) => a.customOrder - b.customOrder)
      filteredChats.sort((a, b) => a.customOrder - b.customOrder)
    }

    const folderItems = filteredFolders.map((folder): DirectoryItem => ({ type: 'folder', folder }))
    const chatItems = filteredChats.map((chat): DirectoryItem => ({ type: 'chat', chat }))

    return [...folderItems, ...chatItems]
  }, [chats, folders, sortingOrder, folderId])
}
