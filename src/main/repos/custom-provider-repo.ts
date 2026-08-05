import Database from 'better-sqlite3'
import { ChatProvider } from '@shared/chat'

interface CustomProviderRow {
  id: number
  name: string
  newChatUrl: string
  chatUrlPrefix: string
  titleSuffix: string | null
  chatIdExclusionRegex: string | null
}

const SELECT_COLUMNS = `
  id,
  name,
  new_chat_url AS newChatUrl,
  chat_url_prefix AS chatUrlPrefix,
  title_suffix AS titleSuffix,
  chat_id_exclusion_regex AS chatIdExclusionRegex
`

export class CustomProviderRepository {
  private readonly listQuery: Database.Statement<[], CustomProviderRow>
  private readonly createQuery: Database.Statement<[{ name: string; newChatUrl: string; chatUrlPrefix: string; titleSuffix: string | null; chatIdExclusionRegex: string | null }], CustomProviderRow>
  private readonly updateQuery: Database.Statement<[{ id: number; name: string; newChatUrl: string; chatUrlPrefix: string; titleSuffix: string | null; chatIdExclusionRegex: string | null }], CustomProviderRow>
  private readonly deleteQuery: Database.Statement<[{ id: number }], void>

  constructor(private readonly db: Database.Database) {
    this.ensureSchema()

    this.listQuery = this.db.prepare(`
      SELECT ${SELECT_COLUMNS}
      FROM custom_providers
      ORDER BY id
    `)

    this.createQuery = this.db.prepare(`
      INSERT INTO custom_providers (name, new_chat_url, chat_url_prefix, title_suffix, chat_id_exclusion_regex)
      VALUES (:name, :newChatUrl, :chatUrlPrefix, :titleSuffix, :chatIdExclusionRegex)
      RETURNING ${SELECT_COLUMNS}
    `)

    this.updateQuery = this.db.prepare(`
      UPDATE custom_providers
      SET name = :name, new_chat_url = :newChatUrl, chat_url_prefix = :chatUrlPrefix, title_suffix = :titleSuffix, chat_id_exclusion_regex = :chatIdExclusionRegex
      WHERE id = :id
      RETURNING ${SELECT_COLUMNS}
    `)

    this.deleteQuery = this.db.prepare(`
      DELETE FROM custom_providers 
      WHERE id = :id
    `)
  }

  list(): ChatProvider[] {
    return this.listQuery.all().map((row) => this.rowToProvider(row))
  }

  create(data: Omit<ChatProvider, 'id'>): ChatProvider {
    const row = this.createQuery.get({
      name: data.name,
      newChatUrl: data.newChatUrl,
      chatUrlPrefix: data.chatUrlPrefix,
      titleSuffix: data.titleSuffix ?? null,
      chatIdExclusionRegex: data.chatIdExclusionRegex ?? null
    })!
    return this.rowToProvider(row)
  }

  update(id: string, data: Omit<ChatProvider, 'id'>): ChatProvider | null {
    const numericId = this.parseId(id)
    if (numericId === null) {
      return null
    }
    const row = this.updateQuery.get({
      id: numericId,
      name: data.name,
      newChatUrl: data.newChatUrl,
      chatUrlPrefix: data.chatUrlPrefix,
      titleSuffix: data.titleSuffix ?? null,
      chatIdExclusionRegex: data.chatIdExclusionRegex ?? null
    })
    return row ? this.rowToProvider(row) : null
  }

  remove(id: string): void {
    const numericId = this.parseId(id)
    if (numericId !== null) {
      this.deleteQuery.run({ id: numericId })
    }
  }

  private parseId(id: string): number | null {
    if (!id.startsWith('custom_')) {
      return null
    }
    const numericId = parseInt(id.slice(7), 10)
    return isNaN(numericId) ? null : numericId
  }

  private rowToProvider(row: CustomProviderRow): ChatProvider {
    return {
      id: `custom_${row.id}`,
      name: row.name,
      newChatUrl: row.newChatUrl,
      chatUrlPrefix: row.chatUrlPrefix,
      titleSuffix: row.titleSuffix ?? undefined,
      chatIdExclusionRegex: row.chatIdExclusionRegex ?? undefined
    }
  }

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS custom_providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        new_chat_url TEXT NOT NULL,
        chat_url_prefix TEXT NOT NULL,
        title_suffix TEXT,
        chat_id_exclusion_regex TEXT
      )
    `)
  }
}
