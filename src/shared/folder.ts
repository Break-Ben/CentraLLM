import { ChatRecord } from '@shared/chat'

export interface FolderRecord {
  id: number
  name: string
  parentFolderId: number | null
  customOrder: number
}

export interface FolderNode extends FolderRecord {
  folders: FolderNode[]
  chats: ChatRecord[]
}
