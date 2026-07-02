export interface FolderRecord {
  id: number
  name: string
  parentFolderId: number | null
  customOrder: number
}
