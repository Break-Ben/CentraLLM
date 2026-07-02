import Database from 'better-sqlite3'
import { FolderRecord } from '@shared/folder'

const DEFAULT_FOLDER_NAME = 'New Folder'

const SELECT_COLUMNS = `
  id,
  name,
  parent_folder_id AS parentFolderId,
  custom_order AS customOrder
`

export class FolderRepository {
  private readonly listFoldersQuery: Database.Statement<[], FolderRecord>
  private readonly getFolderByIdQuery: Database.Statement<[{ folderId: number }], FolderRecord>
  private readonly createFolderQuery: Database.Statement<[{ name: string; parentFolderId: number | null }], FolderRecord>
  private readonly deleteFolderQuery: Database.Statement<[{ folderId: number }], void>
  private readonly renameFolderQuery: Database.Statement<[{ folderId: number; name: string }], FolderRecord>
  private readonly moveToFolderQuery: Database.Statement<[{ folderId: number; parentFolderId: number | null }], FolderRecord>
  private readonly listFolderNamesQuery: Database.Statement<[{ parentFolderId: number | null }], { name: string }>
  private readonly updateCustomOrderQuery: Database.Statement<[{ folderId: number; customOrder: number }], FolderRecord>
  private readonly getMoveBeforeBoundsQuery: Database.Statement<[{ sourceId: number; targetId: number }], { parentFolderId: number | null; targetOrder: number; prevOrder: number | null }>
  private readonly getMoveAfterBoundsQuery: Database.Statement<[{ sourceId: number; targetId: number }], { parentFolderId: number | null; targetOrder: number; nextOrder: number | null }>

  constructor(private readonly db: Database.Database) {
    this.ensureSchema()

    this.listFoldersQuery = this.db.prepare(`
      SELECT ${SELECT_COLUMNS}
      FROM folders
    `)

    this.getFolderByIdQuery = this.db.prepare(`
      SELECT ${SELECT_COLUMNS}
      FROM folders
      WHERE id = :folderId
    `)

    this.createFolderQuery = this.db.prepare(`
      INSERT INTO folders (name, parent_folder_id, custom_order)
      VALUES (:name, :parentFolderId, (SELECT COALESCE(MAX(custom_order), 0) + 1 FROM folders))
      RETURNING ${SELECT_COLUMNS}
    `)

    this.deleteFolderQuery = this.db.prepare(`
      DELETE FROM folders
      WHERE id = :folderId
    `)

    this.renameFolderQuery = this.db.prepare(`
      UPDATE folders
      SET name = :name
      WHERE id = :folderId
      RETURNING ${SELECT_COLUMNS}
    `)

    this.moveToFolderQuery = this.db.prepare(`
      UPDATE folders
      SET parent_folder_id = :parentFolderId,
        custom_order = (SELECT COALESCE(MAX(custom_order), 0) + 1 FROM folders WHERE parent_folder_id IS :parentFolderId)
      WHERE id = :folderId
      RETURNING ${SELECT_COLUMNS}
    `)

    this.listFolderNamesQuery = this.db.prepare(`
      SELECT name
      FROM folders
      WHERE COALESCE(parent_folder_id, 0) = COALESCE(:parentFolderId, 0)
    `)

    this.updateCustomOrderQuery = this.db.prepare(`
      UPDATE folders
      SET custom_order = :customOrder
      WHERE id = :folderId
      RETURNING ${SELECT_COLUMNS}
    `)

    this.getMoveBeforeBoundsQuery = this.db.prepare(`
      WITH target AS (SELECT custom_order, parent_folder_id FROM folders WHERE id = :targetId)
      SELECT
        target.parent_folder_id AS parentFolderId,
        target.custom_order AS targetOrder,
        (
          SELECT MAX(custom_order)
          FROM folders
          WHERE parent_folder_id IS target.parent_folder_id AND custom_order < target.custom_order AND id != :sourceId
        ) AS prevOrder
      FROM target
    `)

    this.getMoveAfterBoundsQuery = this.db.prepare(`
      WITH target AS (SELECT custom_order, parent_folder_id FROM folders WHERE id = :targetId)
      SELECT
        target.parent_folder_id AS parentFolderId,
        target.custom_order AS targetOrder,
        (
          SELECT MIN(custom_order)
          FROM folders
          WHERE parent_folder_id IS target.parent_folder_id AND custom_order > target.custom_order AND id != :sourceId
        ) AS nextOrder
      FROM target
    `)
  }

  listFolders(): FolderRecord[] {
    return this.listFoldersQuery.all()
  }

  getFolderById(folderId: number): FolderRecord | undefined {
    return this.getFolderByIdQuery.get({ folderId })
  }

  createFolder(name: string | null = null, parentFolderId: number | null = null): FolderRecord {
    if (parentFolderId !== null && !this.getFolderById(parentFolderId)) {
      throw new Error('Parent folder does not exist')
    }

    const trimmed = name?.trim()
    const folderName = trimmed ? trimmed : this.getNextDefaultFolderName(parentFolderId)
    return this.createFolderQuery.get({ name: folderName, parentFolderId })!
  }

  deleteFolder(folderId: number): void {
    this.deleteFolderQuery.run({ folderId })
  }

  renameFolder(folderId: number, name: string): FolderRecord {
    const trimmed = name.trim()
    if (!trimmed) {
      throw new Error('Folder name cannot be empty')
    }

    return this.renameFolderQuery.get({ folderId, name: trimmed })!
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

    return this.moveToFolderQuery.get({ folderId, parentFolderId })!
  }

  moveBefore(sourceId: number, targetId: number): FolderRecord | undefined {
    const { parentFolderId, targetOrder, prevOrder } = this.getMoveBeforeBoundsQuery.get({ sourceId, targetId })!
    this.moveToFolder(sourceId, parentFolderId)
    const newOrder = prevOrder !== null ? (prevOrder + targetOrder) / 2 : targetOrder - 1
    return this.updateCustomOrderQuery.get({ folderId: sourceId, customOrder: newOrder })
  }

  moveAfter(sourceId: number, targetId: number): FolderRecord | undefined {
    const { parentFolderId, targetOrder, nextOrder } = this.getMoveAfterBoundsQuery.get({ sourceId, targetId })!
    this.moveToFolder(sourceId, parentFolderId)
    const newOrder = nextOrder !== null ? (targetOrder + nextOrder) / 2 : targetOrder + 1
    return this.updateCustomOrderQuery.get({ folderId: sourceId, customOrder: newOrder })
  }

  private getNextDefaultFolderName(parentFolderId: number | null): string {
    const names = this.listFolderNamesQuery.all({ parentFolderId }).map((row) => row.name)
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
        parent_folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
        custom_order REAL
      );

      CREATE INDEX IF NOT EXISTS idx_folders_parent_id
      ON folders (parent_folder_id);

      CREATE UNIQUE INDEX IF NOT EXISTS idx_folders_parent_name
      ON folders (COALESCE(parent_folder_id, 0), name COLLATE NOCASE);
    `)
  }
}
