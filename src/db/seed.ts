import { db } from "./index";
import { categories, settings } from "./schema";
import { sql } from "drizzle-orm";

const DEFAULT_CATEGORIES = [
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
];

export async function seed() {
  // Create tables if they don't exist
  db.run(sql`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    budget_allocation REAL NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    pros TEXT DEFAULT '',
    cons TEXT DEFAULT '',
    is_selected INTEGER NOT NULL DEFAULT 0,
    contact_info TEXT DEFAULT '',
    deposit_paid REAL NOT NULL DEFAULT 0,
    total_paid REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Check if already seeded
  const existing = db.select().from(settings).all();
  if (existing.length > 0) {
    console.log("Database already seeded.");
    return;
  }

  // Insert default settings
  db.insert(settings).values([
    { key: "totalBudget", value: "15000" },
    { key: "weddingDate", value: "" },
    { key: "coupleNames", value: "" },
    { key: "passphraseHash", value: "" },
  ]).run();

  // Insert default categories
  DEFAULT_CATEGORIES.forEach((name, index) => {
    db.insert(categories).values({
      name,
      budgetAllocation: 0,
      sortOrder: index,
    }).run();
  });

  console.log("Database seeded with default categories and settings.");
}

// Run if called directly
seed().catch(console.error);
