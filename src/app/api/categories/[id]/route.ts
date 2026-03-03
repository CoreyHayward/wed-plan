export const dynamic = "force-dynamic";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const category = db
    .select()
    .from(categories)
    .where(eq(categories.id, parseInt(id)))
    .get();

  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(category);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const result = db
    .update(categories)
    .set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.budgetAllocation !== undefined && {
        budgetAllocation: body.budgetAllocation,
      }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      ...(body.groupId !== undefined && { groupId: body.groupId }),
    })
    .where(eq(categories.id, parseInt(id)))
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
  db.delete(categories).where(eq(categories.id, parseInt(id))).run();
  return NextResponse.json({ success: true });
}
