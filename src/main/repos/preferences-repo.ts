import Database from 'better-sqlite3'
import { Preferences, DEFAULTS } from '@shared/preferences'

export class PreferencesRepository {
  private readonly getAllQuery: Database.Statement
  private readonly setQuery: Database.Statement

  constructor(private readonly db: Database.Database) {
    this.ensureSchema()

    this.getAllQuery = this.db.prepare(`
      SELECT key, value
      FROM preferences
    `)
    this.setQuery = this.db.prepare(`
      INSERT INTO preferences (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `)
  }

  getAll(): Preferences {
    const rows = this.getAllQuery.all() as { key: string; value: string }[]
    const stored = Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.value)]))
    return { ...DEFAULTS, ...stored }
  }

  set<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
    this.setQuery.run(key, JSON.stringify(value))
  }

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `)
  }
}
