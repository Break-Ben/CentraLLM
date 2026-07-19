import Database from 'better-sqlite3'
import { Preferences, DEFAULTS } from '@shared/preferences'

interface PreferencesRow {
  key: string
  value: string
}

export class PreferencesRepository {
  private readonly getAllQuery: Database.Statement<[], PreferencesRow>
  private readonly setQuery: Database.Statement<[string, string], void>

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
    const rows = this.getAllQuery.all()
    const stored = Object.fromEntries(rows.map((row) => [row.key, JSON.parse(row.value)]))
    const merged = { ...DEFAULTS, ...stored } as Preferences
    merged.keybindings = { ...DEFAULTS.keybindings, ...(merged.keybindings ?? {}) }
    return merged
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
