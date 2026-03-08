export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { timelineItems } from "@/db/schema";
import { ensureTimelineItemsTable } from "@/db/timeline";
import { normalizeTimelinePhase } from "@/lib/timeline";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  ensureTimelineItemsTable();

  const { id } = await params;
  const itemId = parseInt(id, 10);
  const body = await request.json();

  const title =
    body.title === undefined ? undefined : String(body.title).trim();

  if (title !== undefined && !title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const result = db
    .update(timelineItems)
    .set({
      ...(title !== undefined && { title }),
      ...(body.phase !== undefined && {
        phase: normalizeTimelinePhase(String(body.phase)),
      }),
      ...(body.startTime !== undefined && {
        startTime: String(body.startTime || "13:00"),
      }),
      ...(body.notes !== undefined && { notes: String(body.notes).trim() }),
    })
    .where(eq(timelineItems.id, itemId))
    .returning()
    .get();

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  ensureTimelineItemsTable();

  const { id } = await params;
  const itemId = parseInt(id, 10);

  const existingItem = db
    .select()
    .from(timelineItems)
    .where(eq(timelineItems.id, itemId))
    .get();

  if (!existingItem) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.delete(timelineItems).where(eq(timelineItems.id, itemId)).run();
  return NextResponse.json({ success: true });
}
