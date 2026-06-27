import { ChatRecord } from '@shared/chat'
import { FolderRecord } from '@shared/folder'

export type DirectoryItem = { type: 'folder'; folder: FolderRecord } | { type: 'chat'; chat: ChatRecord }

export type DragItemData = { type: 'chat' | 'folder'; id: number }
export type DropFolderData = { type: 'folder'; id: number }
