export const dynamic = "force-dynamic";

import { db } from "@/db";
import { categories, groups } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = db.select().from(categories).orderBy(categories.sortOrder).all();
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();

  // Get the next sort order
  const existing = db.select().from(categories).all();
  const maxSort = existing.reduce((max, c) => Math.max(max, c.sortOrder), -1);

  const defaultGroup = db
    .select()
    .from(groups)
    .orderBy(groups.sortOrder)
    .get();

  const result = db
    .insert(categories)
    .values({
      name: body.name,
      groupId: body.groupId || defaultGroup?.id || 1,
      budgetAllocation: body.budgetAllocation || 0,
      sortOrder: maxSort + 1,
    })
    .returning()
    .get();

  return NextResponse.json(result, { status: 201 });
}
