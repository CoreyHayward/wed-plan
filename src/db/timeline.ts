import { sql } from "drizzle-orm";
import { db } from "@/db";
import { timelineItems } from "@/db/schema";
import { defaultTimelineItems } from "@/lib/timeline";

export function ensureTimelineItemsTable() {
  db.run(sql`CREATE TABLE IF NOT EXISTS timeline_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    phase TEXT NOT NULL DEFAULT 'ceremony',
    start_time TEXT NOT NULL DEFAULT '13:00',
    notes TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  const existingItems = db.select().from(timelineItems).all();
  if (existingItems.length > 0) {
    return;
  }

  db.insert(timelineItems)
    .values(
      defaultTimelineItems.map((item, index) => ({
        ...item,
        sortOrder: index,
      }))
    )
    .run();
}
