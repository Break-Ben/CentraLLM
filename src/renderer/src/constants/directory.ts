import { ChatRecord } from '@shared/chat'
import { FolderRecord } from '@shared/folder'

export type DirectoryItem = { type: 'folder'; folder: FolderRecord } | { type: 'chat'; chat: ChatRecord }
export type FlatDirectoryItem = { type: 'folder'; folder: FolderRecord; depth: number; parentFolderId: number | null } | { type: 'chat'; chat: ChatRecord; depth: number; parentFolderId: number | null }

export type DragItemData = { type: 'chat' | 'folder'; id: number; parentFolderId: number | null }
export type DropFolderData = { type: 'folder'; id: number }
