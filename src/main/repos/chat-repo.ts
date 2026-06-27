import Database from 'better-sqlite3'
import { ChatLocation, ChatRecord } from '@shared/chat'

const SELECT_COLUMNS = `
  id,
  provider_id AS providerId,
  chat_id AS chatId,
  title,
  last_opened_at AS lastOpenedAt,
  folder_id AS folderId
`

export class ChatRepository {
  private readonly listChatsQuery: Database.Statement<[], ChatRecord>
  private readonly getChatByIdQuery: Database.Statement<[number], ChatRecord>
  private readonly getChatByLocationQuery: Database.Statement<[string, string], ChatRecord>
  private readonly getMostRecentChatQuery: Database.Statement<[], ChatRecord>
  private readonly upsertChatQuery: Database.Statement<[string, string, string, number, number | null], ChatRecord>
  private readonly removeChatQuery: Database.Statement<[number], void>
  private readonly updateLastOpenedQuery: Database.Statement<[number, number], ChatRecord>
  private readonly moveToFolderQuery: Database.Statement<[number | null, number], ChatRecord>

  constructor(private readonly db: Database.Database) {
    this.ensureSchema()

    this.listChatsQuery = this.db.prepare(`
      SELECT ${SELECT_COLUMNS}
      FROM chats
    `)

    this.getChatByIdQuery = this.db.prepare(`
      SELECT ${SELECT_COLUMNS}
      FROM chats
      WHERE id = ?
    `)

    this.getChatByLocationQuery = this.db.prepare(`
      SELECT ${SELECT_COLUMNS}
      FROM chats
      WHERE provider_id = ? AND chat_id = ?
    `)

    this.getMostRecentChatQuery = this.db.prepare(`
      SELECT ${SELECT_COLUMNS}
      FROM chats
      ORDER BY last_opened_at DESC
      LIMIT 1
    `)

    this.upsertChatQuery = this.db.prepare(`
      INSERT INTO chats (provider_id, chat_id, title, last_opened_at, folder_id)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(provider_id, chat_id) DO UPDATE SET
        title = CASE WHEN excluded.title <> '' THEN excluded.title ELSE chats.title END,
        last_opened_at = excluded.last_opened_at
      RETURNING ${SELECT_COLUMNS}
    `)

    this.removeChatQuery = this.db.prepare(`
      DELETE FROM chats
      WHERE id = ?
    `)

    this.updateLastOpenedQuery = this.db.prepare(`
      UPDATE chats
      SET last_opened_at = ?
      WHERE id = ?
      RETURNING ${SELECT_COLUMNS}
    `)

    this.moveToFolderQuery = this.db.prepare(`
      UPDATE chats
      SET folder_id = ?
      WHERE id = ?
      RETURNING ${SELECT_COLUMNS}
    `)
  }

  listChats(): ChatRecord[] {
    return this.listChatsQuery.all()
  }

  getChatById(id: number): ChatRecord | undefined {
    return this.getChatByIdQuery.get(id)
  }

  getChatByLocation(location: ChatLocation): ChatRecord | undefined {
    return this.getChatByLocationQuery.get(location.providerId, location.chatId)
  }

  getMostRecentChat(): ChatRecord | undefined {
    return this.getMostRecentChatQuery.get()
  }

  upsertChat(location: ChatLocation, title?: string, folderId: number | null = null): ChatRecord {
    const now = Date.now()
    return this.upsertChatQuery.get(location.providerId, location.chatId, title ?? '', now, folderId)!
  }

  removeChat(id: number): void {
    this.removeChatQuery.run(id)
  }

  updateLastOpened(id: number): ChatRecord | undefined {
    return this.updateLastOpenedQuery.get(Date.now(), id)
  }

  moveToFolder(id: number, folderId: number | null): ChatRecord | undefined {
    return this.moveToFolderQuery.get(folderId, id)
  }

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider_id TEXT NOT NULL,
        chat_id TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        last_opened_at INTEGER NOT NULL,
        folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
        UNIQUE(provider_id, chat_id)
      );

      CREATE INDEX IF NOT EXISTS idx_chats_folder_id
      ON chats (folder_id);
    `)
  }
}
