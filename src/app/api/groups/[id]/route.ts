export const dynamic = "force-dynamic";

import { db } from "@/db";
import { categories, groups } from "@/db/schema";
import { eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const result = db
    .update(groups)
    .set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    })
    .where(eq(groups.id, parseInt(id)))
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
  const { id } = await params;
  const groupId = parseInt(id);

  const existing = db.select().from(groups).where(eq(groups.id, groupId)).get();
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fallbackGroup = db
    .select()
    .from(groups)
    .where(ne(groups.id, groupId))
    .orderBy(groups.sortOrder)
    .get();

  if (!fallbackGroup) {
    return NextResponse.json(
      { error: "At least one group is required" },
      { status: 400 }
    );
  }

  db.update(categories)
    .set({ groupId: fallbackGroup.id })
    .where(eq(categories.groupId, groupId))
    .run();

  db.delete(groups).where(eq(groups.id, groupId)).run();
  return NextResponse.json({ success: true });
}
