export const dynamic = "force-dynamic";

import { db } from "@/db";
import { households } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = db.select().from(households).all();
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();

  const result = db
    .insert(households)
    .values({
      name: body.name,
      address: body.address || "",
    })
    .returning()
    .get();

  return NextResponse.json(result, { status: 201 });
}
