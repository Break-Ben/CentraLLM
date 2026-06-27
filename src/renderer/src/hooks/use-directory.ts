import { useMemo } from 'react'
import { useChatStore } from '@/stores/chat-store'
import { useFolderStore } from '@/stores/folder-store'
import { SortingOrder } from '@shared/app-state'
import { getChatDisplayName, ChatRecord } from '@shared/chat'
import { FolderRecord } from '@shared/folder'

type DirectoryItem = { type: 'folder'; folder: FolderRecord } | { type: 'chat'; chat: ChatRecord }

export function useDirectory(sortingOrder: SortingOrder, folderId?: number | null): DirectoryItem[] {
  const chats = useChatStore((state) => state.chats)
  const folders = useFolderStore((state) => state.folders)

  return useMemo(() => {
    // Filter
    const filteredFolders = folderId === undefined ? folders : folders.filter((folder) => folder.parentFolderId === folderId)
    const filteredChats = folderId === undefined ? chats : chats.filter((chat) => chat.folderId === folderId)

    // Sort
    if (sortingOrder === 'alphabetical') {
      filteredFolders.sort((a, b) => a.name.localeCompare(b.name))
      filteredChats.sort((a, b) => getChatDisplayName(a).localeCompare(getChatDisplayName(b)))
    } else if (sortingOrder === 'last_opened') {
      filteredFolders.sort((a, b) => a.name.localeCompare(b.name))
      filteredChats.sort((a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime())
    }

    // Map
    const folderItems = filteredFolders.map((folder): DirectoryItem => ({ type: 'folder', folder }))
    const chatItems = filteredChats.map((chat): DirectoryItem => ({ type: 'chat', chat }))

    return [...folderItems, ...chatItems]
  }, [chats, folders, sortingOrder, folderId])
}
