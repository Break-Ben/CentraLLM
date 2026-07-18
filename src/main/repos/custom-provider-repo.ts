import Database from 'better-sqlite3'
import { ChatProvider } from '@shared/chat'

interface CustomProviderRow {
  id: number
  name: string
  newChatUrl: string
  chatUrlPrefix: string
  chatUrlTemplate: string
  titleSuffix: string
}

const SELECT_COLUMNS = `
  id,
  name,
  new_chat_url AS newChatUrl,
  chat_url_prefix AS chatUrlPrefix,
  chat_url_template AS chatUrlTemplate,
  title_suffix AS titleSuffix
`

export class CustomProviderRepository {
  private readonly listQuery: Database.Statement<[], CustomProviderRow>
  private readonly createQuery: Database.Statement<[{ name: string; newChatUrl: string; chatUrlPrefix: string; chatUrlTemplate: string; titleSuffix: string }], CustomProviderRow>
  private readonly updateQuery: Database.Statement<[{ id: number; name: string; newChatUrl: string; chatUrlPrefix: string; chatUrlTemplate: string; titleSuffix: string }], CustomProviderRow>
  private readonly deleteQuery: Database.Statement<[{ id: number }], void>

  constructor(private readonly db: Database.Database) {
    this.ensureSchema()

    this.listQuery = this.db.prepare(`
      SELECT ${SELECT_COLUMNS}
      FROM custom_providers
      ORDER BY id
    `)

    this.createQuery = this.db.prepare(`
      INSERT INTO custom_providers (name, new_chat_url, chat_url_prefix, chat_url_template, title_suffix)
      VALUES (:name, :newChatUrl, :chatUrlPrefix, :chatUrlTemplate, :titleSuffix)
      RETURNING ${SELECT_COLUMNS}
    `)

    this.updateQuery = this.db.prepare(`
      UPDATE custom_providers
      SET name = :name, new_chat_url = :newChatUrl, chat_url_prefix = :chatUrlPrefix, chat_url_template = :chatUrlTemplate, title_suffix = :titleSuffix
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
      chatUrlTemplate: data.chatUrlTemplate,
      titleSuffix: data.titleSuffix
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
      chatUrlTemplate: data.chatUrlTemplate,
      titleSuffix: data.titleSuffix
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
      chatUrlTemplate: row.chatUrlTemplate,
      titleSuffix: row.titleSuffix
    }
  }

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS custom_providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        new_chat_url TEXT NOT NULL,
        chat_url_prefix TEXT NOT NULL,
        chat_url_template TEXT NOT NULL,
        title_suffix TEXT NOT NULL DEFAULT ''
      )
    `)
  }
}
