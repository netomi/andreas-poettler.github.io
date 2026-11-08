import { DatabaseSync } from 'node:sqlite';

export function openDb(path) {
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY,
      slot TEXT NOT NULL,              -- local Vienna time, 'YYYY-MM-DD HH:MM'
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      level TEXT,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    -- one active booking per slot; makes double-booking impossible even under races
    CREATE UNIQUE INDEX IF NOT EXISTS lessons_active_slot ON lessons(slot) WHERE status != 'cancelled';
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      message TEXT,
      items TEXT NOT NULL,             -- JSON [{id,title,qty,priceCents}]
      total_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','paid','shipped','cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}
