import { eq, inArray } from "drizzle-orm";
import type { drizzle } from "drizzle-orm/better-sqlite3";
import { guests, rooms } from "@/db/schema";

export type RoomInput = {
  propertyName: string;
  roomName: string;
  capacity: number | null;
  notes: string;
};

type RoomValidationResult = { value: RoomInput } | { error: string };

export function validateRoomInput(input: unknown): RoomValidationResult {
  const body = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const propertyName = String(body.propertyName ?? "").trim();
  const roomName = String(body.roomName ?? "").trim();
  const notes = String(body.notes ?? "").trim();

  if (!propertyName) return { error: "Accommodation/property name is required" };
  if (!roomName) return { error: "Room name/number is required" };
  if (propertyName.length > 200) {
    return { error: "Accommodation/property name must be 200 characters or fewer" };
  }
  if (roomName.length > 200) {
    return { error: "Room name/number must be 200 characters or fewer" };
  }
  if (notes.length > 4000) return { error: "Notes must be 4000 characters or fewer" };

  const rawCapacity = body.capacity;
  let capacity: number | null = null;
  if (rawCapacity !== undefined && rawCapacity !== null && String(rawCapacity).trim() !== "") {
    capacity = Number(rawCapacity);
    if (!Number.isInteger(capacity)) return { error: "Capacity must be a whole number" };
    if (capacity < 1 || capacity > 1000) {
      return { error: "Capacity must be between 1 and 1000" };
    }
  }

  return { value: { propertyName, roomName, capacity, notes } };
}

export function calculateOccupancy(assignedCount: number, capacity: number | null) {
  return {
    label: capacity === null ? `${assignedCount} assigned` : `${assignedCount} / ${capacity}`,
    isOverCapacity: capacity !== null && assignedCount > capacity,
  };
}

type RoomDatabase = ReturnType<typeof drizzle>;

export function createRoomRepository(db: RoomDatabase) {
  return {
    create(input: RoomInput) {
      return db.insert(rooms).values(input).returning().get();
    },
    update(id: number, input: RoomInput) {
      return db.update(rooms).set(input).where(eq(rooms.id, id)).returning().get();
    },
    delete(id: number) {
      return db.delete(rooms).where(eq(rooms.id, id)).run();
    },
    getAssignedGuestIds(roomId: number) {
      return db
        .select({ id: guests.id })
        .from(guests)
        .where(eq(guests.roomId, roomId))
        .orderBy(guests.id)
        .all()
        .map((guest) => guest.id);
    },
    replaceAssignments(roomId: number, guestIds: number[]) {
      const uniqueGuestIds = [...new Set(guestIds)];
      if (uniqueGuestIds.length !== guestIds.length) {
        throw new Error("Guest ids must be unique");
      }

      const room = db.select({ id: rooms.id }).from(rooms).where(eq(rooms.id, roomId)).get();
      if (!room) throw new Error("Room not found");

      if (uniqueGuestIds.length) {
        const foundGuests = db
          .select({ id: guests.id })
          .from(guests)
          .where(inArray(guests.id, uniqueGuestIds))
          .all();
        if (foundGuests.length !== uniqueGuestIds.length) {
          throw new Error("One or more guests were not found");
        }
      }

      db.transaction((tx) => {
        tx.update(guests).set({ roomId: null }).where(eq(guests.roomId, roomId)).run();
        if (uniqueGuestIds.length) {
          tx.update(guests)
            .set({ roomId })
            .where(inArray(guests.id, uniqueGuestIds))
            .run();
        }
      });
    },
  };
}
