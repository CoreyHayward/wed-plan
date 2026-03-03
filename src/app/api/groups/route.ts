export const dynamic = "force-dynamic";

import { db } from "@/db";
import { groups } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = db.select().from(groups).orderBy(groups.sortOrder).all();
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();

  const existing = db.select().from(groups).all();
  const maxSort = existing.reduce((max, g) => Math.max(max, g.sortOrder), -1);

  const result = db
    .insert(groups)
    .values({
      name: body.name,
      sortOrder: maxSort + 1,
    })
    .returning()
    .get();

  return NextResponse.json(result, { status: 201 });
}
