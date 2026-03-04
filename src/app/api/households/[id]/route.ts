export const dynamic = "force-dynamic";

import { db } from "@/db";
import { households, guests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const result = db
    .update(households)
    .set({
      name: body.name,
      address: body.address ?? "",
    })
    .where(eq(households.id, parseInt(id)))
    .returning()
    .get();

  if (!result) {
    return NextResponse.json(
      { error: "Household not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const householdId = parseInt(id);

  // Clear household references on guests first
  db.update(guests)
    .set({ householdId: null })
    .where(eq(guests.householdId, householdId))
    .run();

  db.delete(households).where(eq(households.id, householdId)).run();
  return NextResponse.json({ success: true });
}
