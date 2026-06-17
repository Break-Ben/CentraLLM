import Database from 'better-sqlite3'
import { AppState, DEFAULTS } from '@shared/app-state'

export class AppStateRepository {
  private readonly getAllQuery: Database.Statement
  private readonly setQuery: Database.Statement

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
    const rows = this.getAllQuery.all() as { key: string; value: string }[]
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
