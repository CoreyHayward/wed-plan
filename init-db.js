#!/usr/bin/env node
/**
 * Plain-JS database initialiser — runs on every container start.
 * Creates tables if they don't exist and seeds default data on first run.
 */
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH =
  process.env.DATABASE_PATH ||
  path.join(process.cwd(), "data", "wedding.db");

const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS groups (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    name              TEXT    NOT NULL,
    group_id          INTEGER NOT NULL DEFAULT 1 REFERENCES groups(id) ON DELETE RESTRICT,
    budget_allocation REAL    NOT NULL DEFAULT 0,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vendors (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id            INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name                   TEXT    NOT NULL,
    price                  REAL    NOT NULL DEFAULT 0,
    notes                  TEXT    DEFAULT '',
    pros                   TEXT    DEFAULT '',
    cons                   TEXT    DEFAULT '',
    is_selected            INTEGER NOT NULL DEFAULT 0,
    is_booked              INTEGER NOT NULL DEFAULT 0,
    contact_info           TEXT    DEFAULT '',
    deposit_paid           REAL    NOT NULL DEFAULT 0,
    total_paid             REAL    NOT NULL DEFAULT 0,
    deposit_due_date       TEXT,
    final_payment_due_date TEXT,
    created_at             TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS households (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    address    TEXT    DEFAULT '',
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS guests (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name           TEXT    NOT NULL,
    last_name            TEXT    DEFAULT '',
    email                TEXT    DEFAULT '',
    phone                TEXT    DEFAULT '',
    household_id         INTEGER REFERENCES households(id) ON DELETE SET NULL,
    party                TEXT    NOT NULL DEFAULT 'joint',
    attendance           TEXT    NOT NULL DEFAULT 'all',
    rsvp_status          TEXT    NOT NULL DEFAULT 'pending',
    is_plus_one          INTEGER NOT NULL DEFAULT 0,
    linked_guest_id      INTEGER,
    dietary_requirements TEXT    DEFAULT '',
    allergies            TEXT    DEFAULT '',
    accessibility_needs  TEXT    DEFAULT '',
    table_assignment     TEXT    DEFAULT '',
    notes                TEXT    DEFAULT '',
    created_at           TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// Lightweight migrations for existing databases
function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`✓ Added column ${table}.${column}`);
  }
}

ensureColumn("vendors", "is_booked", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("vendors", "deposit_due_date", "TEXT");
ensureColumn("vendors", "final_payment_due_date", "TEXT");
ensureColumn("categories", "group_id", "INTEGER NOT NULL DEFAULT 1");

// Ensure at least one group exists and backfill category group ids
const groupCount = db.prepare("SELECT COUNT(*) AS count FROM groups").get();
if (!groupCount || groupCount.count === 0) {
  db.prepare("INSERT INTO groups (name, sort_order) VALUES (?, ?)").run("General", 0);
  console.log("✓ Seeded default group.");
}

const defaultGroup =
  db.prepare("SELECT id FROM groups ORDER BY sort_order, id LIMIT 1").get() ||
  db.prepare("SELECT id FROM groups ORDER BY id LIMIT 1").get();
if (defaultGroup?.id) {
  db.prepare("UPDATE categories SET group_id = ? WHERE group_id IS NULL OR group_id = 0").run(defaultGroup.id);
}

// Only seed once
const already = db
  .prepare("SELECT key FROM settings WHERE key = ?")
  .get("totalBudget");

if (!already) {
  const insertSetting = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?)"
  );
  insertSetting.run("totalBudget", "15000");
  insertSetting.run("weddingDate", "");
  insertSetting.run("coupleNames", "");

  const defaultGroupId =
    db.prepare("SELECT id FROM groups ORDER BY sort_order, id LIMIT 1").get()?.id || 1;

  const insertCat = db.prepare(
    "INSERT INTO categories (name, group_id, budget_allocation, sort_order) VALUES (?, ?, 0, ?)"
  );
  [
    "Venue",
    "Catering",
    "Photography",
    "Videography",
    "Flowers & Décor",
    "Music & Entertainment",
    "Wedding Dress",
    "Suits & Attire",
    "Hair & Makeup",
    "Cake",
    "Stationery & Invitations",
    "Transport",
    "Rings",
    "Favours",
    "Honeymoon",
  ].forEach((name, i) => insertCat.run(name, defaultGroupId, i));

  console.log("✓ Database seeded with defaults.");
} else {
  console.log("✓ Database already initialised.");
}

db.close();
