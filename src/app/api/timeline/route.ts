export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { timelineItems } from "@/db/schema";
import { ensureTimelineItemsTable } from "@/db/timeline";
import { compareTimelineItems, normalizeTimelinePhase } from "@/lib/timeline";

export async function GET() {
  ensureTimelineItemsTable();

  const items = db
    .select()
    .from(timelineItems)
    .all()
    .sort(compareTimelineItems);

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  ensureTimelineItemsTable();

  const body = await request.json();
  const existingItems = db.select().from(timelineItems).all();
  const maxSortOrder = existingItems.reduce(
    (max, item) => Math.max(max, item.sortOrder),
    -1
  );

  const title = String(body.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const result = db
    .insert(timelineItems)
    .values({
      title,
      phase: normalizeTimelinePhase(String(body.phase || "")),
      startTime: String(body.startTime || "13:00"),
      notes: String(body.notes || "").trim(),
      sortOrder: maxSortOrder + 1,
    })
    .returning()
    .get();

  return NextResponse.json(result, { status: 201 });
}
