export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { createRoomRepository } from "@/lib/rooms";

function roomIdFrom(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validateGuestIds(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const ids = value.map(Number);
  if (ids.some((id) => !Number.isSafeInteger(id) || id < 1)) return null;
  if (new Set(ids).size !== ids.length) return null;
  return ids;
}

/** Replaces the room's guest list; guests selected from another room are reassigned. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = roomIdFrom((await params).id);
  if (!id) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const guestIds = validateGuestIds((await request.json()).guestIds);
  if (!guestIds) {
    return NextResponse.json({ error: "guestIds must be an array of unique guest ids" }, { status: 400 });
  }

  try {
    createRoomRepository(db).replaceAssignments(id, guestIds);
    return NextResponse.json({ roomId: id, guestIds });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update room guests";
    return NextResponse.json(
      { error: message },
      { status: message === "Room not found" ? 404 : 400 }
    );
  }
}
