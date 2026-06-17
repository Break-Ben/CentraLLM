import Database from 'better-sqlite3'
import { ChatLocation, ChatRecord } from '@shared/chat'

const SELECT_COLUMNS = `
  id,
  provider_id AS providerId,
  chat_id AS chatId,
  title,
  last_opened_at AS lastOpenedAt
`

export class ChatRepository {
  private readonly listChatsQuery: Database.Statement
  private readonly getChatByIdQuery: Database.Statement
  private readonly getChatByLocationQuery: Database.Statement
  private readonly getMostRecentChatQuery: Database.Statement
  private readonly upsertChatQuery: Database.Statement
  private readonly updateLastOpenedQuery: Database.Statement

  constructor(private readonly db: Database.Database) {
    this.ensureSchema()

    this.listChatsQuery = this.db.prepare(`
      SELECT ${SELECT_COLUMNS}
      FROM chats
      ORDER BY last_opened_at DESC, id DESC
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
      INSERT INTO chats (provider_id, chat_id, title, last_opened_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(provider_id, chat_id) DO UPDATE SET
        title = CASE WHEN excluded.title <> '' THEN excluded.title ELSE chats.title END,
        last_opened_at = excluded.last_opened_at
      RETURNING ${SELECT_COLUMNS}
    `)

    this.updateLastOpenedQuery = this.db.prepare(`
      UPDATE chats
      SET last_opened_at = ?
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

  upsertChat(location: ChatLocation, title?: string): ChatRecord {
    const now = Date.now()
    return this.upsertChatQuery.get(location.providerId, location.chatId, title?.trim() ?? '', now)
  }

  updateLastOpened(id: number): ChatRecord | undefined {
    return this.updateLastOpenedQuery.get(Date.now(), id)
  }

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider_id TEXT NOT NULL,
        chat_id TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        last_opened_at INTEGER NOT NULL,
        UNIQUE(provider_id, chat_id)
      );

      CREATE INDEX IF NOT EXISTS idx_chats_last_opened 
      ON chats (last_opened_at DESC);
    `)
  }
}
