export const dynamic = "force-dynamic";

import { db } from "@/db";
import { guests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guest = db
    .select()
    .from(guests)
    .where(eq(guests.id, parseInt(id)))
    .get();

  if (!guest) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  return NextResponse.json(guest);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const result = db
    .update(guests)
    .set({
      firstName: body.firstName,
      lastName: body.lastName ?? "",
      email: body.email ?? "",
      phone: body.phone ?? "",
      householdId: body.householdId || null,
      party: body.party ?? "joint",
      attendance: body.attendance ?? "all",
      rsvpStatus: body.rsvpStatus ?? "pending",
      isPlusOne: body.isPlusOne ?? false,
      linkedGuestId: body.linkedGuestId || null,
      dietaryRequirements: body.dietaryRequirements ?? "",
      allergies: body.allergies ?? "",
      accessibilityNeeds: body.accessibilityNeeds ?? "",
      tableAssignment: body.tableAssignment ?? "",
      notes: body.notes ?? "",
    })
    .where(eq(guests.id, parseInt(id)))
    .returning()
    .get();

  if (!result) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guestId = parseInt(id);

  // Also unlink any plus-ones that reference this guest
  db.update(guests)
    .set({ linkedGuestId: null, isPlusOne: false })
    .where(eq(guests.linkedGuestId, guestId))
    .run();

  db.delete(guests).where(eq(guests.id, guestId)).run();
  return NextResponse.json({ success: true });
}
