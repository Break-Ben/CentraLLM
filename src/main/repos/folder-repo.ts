import Database from 'better-sqlite3'
import { FolderRecord } from '@shared/folder'

const DEFAULT_FOLDER_NAME = 'New Folder'

const SELECT_COLUMNS = `
  id,
  name,
  parent_folder_id AS parentFolderId
`

export class FolderRepository {
  private readonly listFoldersQuery: Database.Statement<[], FolderRecord>
  private readonly getFolderByIdQuery: Database.Statement<[number], FolderRecord>
  private readonly createFolderQuery: Database.Statement<[string, number | null], FolderRecord>
  private readonly deleteFolderQuery: Database.Statement<[number], void>
  private readonly renameFolderQuery: Database.Statement<[string, number], FolderRecord>
  private readonly moveToFolderQuery: Database.Statement<[number | null, number], FolderRecord>
  private readonly listFolderNamesQuery: Database.Statement<[number | null], { name: string }>

  constructor(private readonly db: Database.Database) {
    this.ensureSchema()

    this.listFoldersQuery = this.db.prepare(`
      SELECT ${SELECT_COLUMNS}
      FROM folders
    `)

    this.getFolderByIdQuery = this.db.prepare(`
      SELECT ${SELECT_COLUMNS}
      FROM folders
      WHERE id = ?
    `)

    this.createFolderQuery = this.db.prepare(`
      INSERT INTO folders (name, parent_folder_id)
      VALUES (?, ?)
      RETURNING ${SELECT_COLUMNS}
    `)

    this.deleteFolderQuery = this.db.prepare(`
      DELETE FROM folders
      WHERE id = ?
    `)

    this.renameFolderQuery = this.db.prepare(`
      UPDATE folders
      SET name = ?
      WHERE id = ?
      RETURNING ${SELECT_COLUMNS}
    `)

    this.moveToFolderQuery = this.db.prepare(`
      UPDATE folders
      SET parent_folder_id = ?
      WHERE id = ?
      RETURNING ${SELECT_COLUMNS}
    `)

    this.listFolderNamesQuery = this.db.prepare(`
      SELECT name
      FROM folders
      WHERE COALESCE(parent_folder_id, 0) = COALESCE(?, 0)
    `)
  }

  listFolders(): FolderRecord[] {
    return this.listFoldersQuery.all()
  }

  getFolderById(folderId: number): FolderRecord | undefined {
    return this.getFolderByIdQuery.get(folderId)
  }

  createFolder(name: string | null = null, parentFolderId: number | null = null): FolderRecord {
    if (parentFolderId !== null && !this.getFolderById(parentFolderId)) {
      throw new Error('Parent folder does not exist')
    }

    const trimmed = name?.trim()
    const folderName = trimmed ? trimmed : this.getNextDefaultFolderName(parentFolderId)
    return this.createFolderQuery.get(folderName, parentFolderId)!
  }

  deleteFolder(folderId: number): void {
    this.deleteFolderQuery.run(folderId)
  }

  renameFolder(folderId: number, name: string): FolderRecord {
    const trimmed = name.trim()
    if (!trimmed) {
      throw new Error('Folder name cannot be empty')
    }

    return this.renameFolderQuery.get(trimmed, folderId)!
  }

  moveToFolder(folderId: number, parentFolderId: number | null): FolderRecord {
    if (parentFolderId !== null) {
      if (folderId === parentFolderId) {
        throw new Error('A folder cannot be moved into itself.')
      }

      let currentId: number | null = parentFolderId
      while (currentId !== null) {
        if (currentId === folderId) {
          throw new Error('Recursion error: Cannot move a folder into one of its own descendants.')
        }
        const parentFolder = this.getFolderById(currentId)
        currentId = parentFolder ? parentFolder.parentFolderId : null
      }
    }

    return this.moveToFolderQuery.get(parentFolderId, folderId)!
  }

  private getNextDefaultFolderName(parentFolderId: number | null): string {
    const names = this.listFolderNamesQuery.all(parentFolderId).map((row) => row.name)
    let maxSuffix = 0

    for (const name of names) {
      if (name === DEFAULT_FOLDER_NAME) {
        maxSuffix = Math.max(maxSuffix, 1)
        continue
      }

      const match = /^New Folder (\d+)$/i.exec(name)
      if (match) {
        maxSuffix = Math.max(maxSuffix, Number(match[1]))
      }
    }

    return maxSuffix === 0 ? DEFAULT_FOLDER_NAME : `${DEFAULT_FOLDER_NAME} ${maxSuffix + 1}`
  }

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_folders_parent_id
      ON folders (parent_folder_id);

      CREATE UNIQUE INDEX IF NOT EXISTS idx_folders_parent_name
      ON folders (COALESCE(parent_folder_id, 0), name COLLATE NOCASE);
    `)
  }
}
