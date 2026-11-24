import assert from "node:assert/strict";
import test from "node:test";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "@/db/schema";
import { ensureRoomsSchema } from "@/db/rooms";
import {
  calculateOccupancy,
  createRoomRepository,
  validateRoomInput,
} from "./rooms";

function makeRepository() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(`
    CREATE TABLE guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT DEFAULT '',
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      household_id INTEGER,
      party TEXT NOT NULL DEFAULT 'joint',
      attendance TEXT NOT NULL DEFAULT 'all',
      rsvp_status TEXT NOT NULL DEFAULT 'pending',
      is_plus_one INTEGER NOT NULL DEFAULT 0,
      linked_guest_id INTEGER,
      dietary_requirements TEXT DEFAULT '',
      allergies TEXT DEFAULT '',
      accessibility_needs TEXT DEFAULT '',
      table_assignment TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  ensureRoomsSchema(sqlite);
  const db = drizzle(sqlite, { schema });
  return { sqlite, db, rooms: createRoomRepository(db) };
}

test("validates required room fields and normalizes optional fields", () => {
  assert.deepEqual(validateRoomInput({ propertyName: "", roomName: "" }), {
    error: "Accommodation/property name is required",
  });
  assert.deepEqual(
    validateRoomInput({ propertyName: "The Inn", roomName: "7", capacity: "1.5" }),
    { error: "Capacity must be a whole number" }
  );
  assert.deepEqual(
    validateRoomInput({
      propertyName: " The Inn ",
      roomName: " Suite 7 ",
      capacity: " 2 ",
      notes: " Quiet end of the hall ",
    }),
    {
      value: {
        propertyName: "The Inn",
        roomName: "Suite 7",
        capacity: 2,
        notes: "Quiet end of the hall",
      },
    }
  );
});

test("calculates occupancy and an over-capacity warning without blocking", () => {
  assert.deepEqual(calculateOccupancy(2, 2), {
    label: "2 / 2",
    isOverCapacity: false,
  });
  assert.deepEqual(calculateOccupancy(3, 2), {
    label: "3 / 2",
    isOverCapacity: true,
  });
  assert.deepEqual(calculateOccupancy(3, null), {
    label: "3 assigned",
    isOverCapacity: false,
  });
});

test("persists assignment, reassignment, unassignment, and safe room deletion", () => {
  const { sqlite, db, rooms } = makeRepository();
  const guestIds = db
    .insert(schema.guests)
    .values([
      { firstName: "Guest", lastName: "One" },
      { firstName: "Guest", lastName: "Two" },
    ])
    .returning({ id: schema.guests.id })
    .all()
    .map((guest) => guest.id);

  const firstRoom = rooms.create({
    propertyName: "The Inn",
    roomName: "1",
    capacity: 1,
    notes: "",
  });
  const secondRoom = rooms.create({
    propertyName: "The Inn",
    roomName: "2",
    capacity: null,
    notes: "",
  });

  rooms.replaceAssignments(firstRoom.id, guestIds);
  assert.equal(rooms.getAssignedGuestIds(firstRoom.id).length, 2);

  rooms.replaceAssignments(secondRoom.id, [guestIds[0]]);
  assert.deepEqual(rooms.getAssignedGuestIds(firstRoom.id), [guestIds[1]]);
  assert.deepEqual(rooms.getAssignedGuestIds(secondRoom.id), [guestIds[0]]);

  rooms.replaceAssignments(secondRoom.id, []);
  assert.deepEqual(rooms.getAssignedGuestIds(secondRoom.id), []);

  rooms.delete(firstRoom.id);
  const remainingRoomIds = sqlite
    .prepare("SELECT room_id FROM guests ORDER BY id")
    .all() as Array<{ room_id: number | null }>;
  assert.deepEqual(remainingRoomIds, [{ room_id: null }, { room_id: null }]);
  sqlite.close();
});
