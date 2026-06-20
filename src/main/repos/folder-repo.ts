import Database from 'better-sqlite3'
import { FolderRecord } from '@shared/folder'

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

  constructor(private readonly db: Database.Database) {
    this.ensureSchema()

    this.listFoldersQuery = this.db.prepare(`
      SELECT ${SELECT_COLUMNS}
      FROM folders
      ORDER BY name COLLATE NOCASE ASC, id ASC
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
  }

  listFolders(): FolderRecord[] {
    return this.listFoldersQuery.all()
  }

  getFolderById(folderId: number): FolderRecord | undefined {
    return this.getFolderByIdQuery.get(folderId)
  }

  createFolder(name: string, parentFolderId: number | null = null): FolderRecord {
    const trimmed = name.trim()
    if (!trimmed) {
      throw new Error('Folder name cannot be empty')
    }

    if (parentFolderId !== null && !this.getFolderById(parentFolderId)) {
      throw new Error('Parent folder does not exist')
    }

    return this.createFolderQuery.get(trimmed, parentFolderId)!
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
