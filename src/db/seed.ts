import { db } from "./index";
import { categories, groups, settings } from "./schema";
import { sql } from "drizzle-orm";
import { ensureTimelineItemsTable } from "./timeline";

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

  db.run(sql`CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    group_id INTEGER NOT NULL DEFAULT 1 REFERENCES groups(id),
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
    is_booked INTEGER NOT NULL DEFAULT 0,
    contact_info TEXT DEFAULT '',
    deposit_paid REAL NOT NULL DEFAULT 0,
    total_paid REAL NOT NULL DEFAULT 0,
    deposit_due_date TEXT,
    final_payment_due_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  ensureTimelineItemsTable();

  db.run(sql`CREATE TABLE IF NOT EXISTS households (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT DEFAULT '',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    household_id INTEGER REFERENCES households(id) ON DELETE SET NULL,
    party TEXT NOT NULL DEFAULT 'joint',
    attendance TEXT NOT NULL DEFAULT 'all',
    rsvp_status TEXT NOT NULL DEFAULT 'pending',
    is_plus_one INTEGER NOT NULL DEFAULT 0,
    linked_guest_id INTEGER,
    dietary_requirements TEXT DEFAULT '',
    allergies TEXT DEFAULT '',
    accessibility_needs TEXT DEFAULT '',
    table_assignment TEXT DEFAULT '',
    notes TEXT DEFAULT '',
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

  // Insert default group
  db.insert(groups).values({
    name: "General",
    sortOrder: 0,
  }).run();

  // Insert default categories
  DEFAULT_CATEGORIES.forEach((name, index) => {
    db.insert(categories).values({
      name,
      budgetAllocation: 0,
      sortOrder: index,
    }).run();
  });

  console.log("Database seeded with default categories, timeline items, and settings.");
}

// Run if called directly
seed().catch(console.error);
