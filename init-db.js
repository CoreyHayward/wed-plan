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

  CREATE TABLE IF NOT EXISTS categories (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    name              TEXT    NOT NULL,
    budget_allocation REAL    NOT NULL DEFAULT 0,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vendors (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id  INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name         TEXT    NOT NULL,
    price        REAL    NOT NULL DEFAULT 0,
    notes        TEXT    DEFAULT '',
    pros         TEXT    DEFAULT '',
    cons         TEXT    DEFAULT '',
    is_selected  INTEGER NOT NULL DEFAULT 0,
    contact_info TEXT    DEFAULT '',
    deposit_paid REAL    NOT NULL DEFAULT 0,
    total_paid   REAL    NOT NULL DEFAULT 0,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

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

  const insertCat = db.prepare(
    "INSERT INTO categories (name, budget_allocation, sort_order) VALUES (?, 0, ?)"
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
  ].forEach((name, i) => insertCat.run(name, i));

  console.log("✓ Database seeded with defaults.");
} else {
  console.log("✓ Database already initialised.");
}

db.close();
