import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
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

  const result = db
    .insert(categories)
    .values({
      name: body.name,
      budgetAllocation: body.budgetAllocation || 0,
      sortOrder: maxSort + 1,
    })
    .returning()
    .get();

  return NextResponse.json(result, { status: 201 });
}
