import type Database from "better-sqlite3";

/**
 * Add room storage without rebuilding existing tables. Keeping room_id nullable
 * makes this safe for every existing guest and ON DELETE SET NULL ensures a
 * deleted room never deletes guest data.
 */
export function ensureRoomsSchema(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      property_name TEXT    NOT NULL,
      room_name     TEXT    NOT NULL,
      capacity      INTEGER,
      notes         TEXT    DEFAULT '',
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const guestsTable = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'guests'")
    .get();

  if (guestsTable) {
    const columns = sqlite.prepare("PRAGMA table_info(guests)").all() as Array<{
      name: string;
    }>;
    if (!columns.some((column) => column.name === "room_id")) {
      sqlite.exec(
        "ALTER TABLE guests ADD COLUMN room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL"
      );
    }
    sqlite.exec("CREATE INDEX IF NOT EXISTS idx_guests_room_id ON guests(room_id)");
  }
}
