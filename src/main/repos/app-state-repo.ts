import Database from 'better-sqlite3'
import { AppState, DEFAULTS } from '@shared/app-state'

interface AppStateRow {
  key: string
  value: string
}

export class AppStateRepository {
  private readonly getAllQuery: Database.Statement<[], AppStateRow>
  private readonly setQuery: Database.Statement<[string, string], void>

  constructor(private readonly db: Database.Database) {
    this.ensureSchema()

    this.getAllQuery = this.db.prepare(`
      SELECT key, value
      FROM app_state
    `)
    this.setQuery = this.db.prepare(`
      INSERT INTO app_state (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `)
  }

  getAll(): AppState {
    const rows = this.getAllQuery.all()
    const stored = Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.value)]))
    return { ...DEFAULTS, ...stored }
  }

  set<K extends keyof AppState>(key: K, value: AppState[K]): void {
    this.setQuery.run(key, JSON.stringify(value))
  }

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `)
  }
}
