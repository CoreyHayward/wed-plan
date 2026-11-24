export const dynamic = "force-dynamic";

import { db } from "@/db";
import { guests, rooms } from "@/db/schema";
import { formatGuestName } from "@/lib/utils";
import { createRoomRepository, calculateOccupancy, validateRoomInput } from "@/lib/rooms";
import { NextResponse } from "next/server";

export type RoomGuest = { id: number; name: string };
export type RoomWithGuests = {
  id: number;
  propertyName: string;
  roomName: string;
  capacity: number | null;
  notes: string | null;
  createdAt: string;
  guests: RoomGuest[];
  occupancy: ReturnType<typeof calculateOccupancy>;
};

export type RoomListData = {
  rooms: RoomWithGuests[];
  unassignedGuests: RoomGuest[];
};

export function listRooms(): RoomListData {
  const allRooms = db.select().from(rooms).all();
  const allGuests = db.select().from(guests).all();
  const guestsByRoom = new Map<number, RoomGuest[]>();
  const unassignedGuests: RoomGuest[] = [];

  for (const guest of allGuests) {
    const summary = { id: guest.id, name: formatGuestName(guest.firstName, guest.lastName) };
    if (guest.roomId === null) {
      unassignedGuests.push(summary);
    } else {
      const assigned = guestsByRoom.get(guest.roomId) || [];
      assigned.push(summary);
      guestsByRoom.set(guest.roomId, assigned);
    }
  }

  const byName = (a: RoomGuest, b: RoomGuest) => a.name.localeCompare(b.name);
  return {
    rooms: allRooms
      .map((room) => {
        const assigned = (guestsByRoom.get(room.id) || []).sort(byName);
        return {
          ...room,
          guests: assigned,
          occupancy: calculateOccupancy(assigned.length, room.capacity),
        };
      })
      .sort((a, b) =>
        a.propertyName.localeCompare(b.propertyName) || a.roomName.localeCompare(b.roomName)
      ),
    unassignedGuests: unassignedGuests.sort(byName),
  };
}

export async function GET() {
  return NextResponse.json(listRooms());
}

export async function POST(request: Request) {
  const body = await request.json();
  const validated = validateRoomInput(body);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const room = createRoomRepository(db).create(validated.value);
  return NextResponse.json(room, { status: 201 });
}
