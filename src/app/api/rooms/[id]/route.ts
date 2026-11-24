export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { createRoomRepository, validateRoomInput } from "@/lib/rooms";

function roomIdFrom(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = roomIdFrom((await params).id);
  const room = id ? db.select().from(rooms).where(eq(rooms.id, id)).get() : null;
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json(room);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = roomIdFrom((await params).id);
  if (!id) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const validated = validateRoomInput(await request.json());
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const room = createRoomRepository(db).update(id, validated.value);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json(room);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = roomIdFrom((await params).id);
  if (!id) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const existing = db.select({ id: rooms.id }).from(rooms).where(eq(rooms.id, id)).get();
  if (!existing) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  createRoomRepository(db).delete(id);
  return NextResponse.json({ success: true });
}
