export const dynamic = "force-dynamic";

import { db } from "@/db";
import { guests, households } from "@/db/schema";
import { NextResponse } from "next/server";

export type GuestWithHousehold = {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  householdId: number | null;
  householdName: string | null;
  party: string;
  attendance: string;
  rsvpStatus: string;
  isPlusOne: boolean;
  linkedGuestId: number | null;
  linkedGuestName: string | null;
  dietaryRequirements: string | null;
  allergies: string | null;
  accessibilityNeeds: string | null;
  tableAssignment: string | null;
  notes: string | null;
  createdAt: string;
};

export type GuestSummary = {
  total: number;
  accepted: number;
  declined: number;
  pending: number;
  brideGuests: number;
  groomGuests: number;
  jointGuests: number;
  ceremonyCount: number;
  receptionCount: number;
  eveningCount: number;
  allDayCount: number;
  plusOnes: number;
  householdCount: number;
};

export type GuestListData = {
  guests: GuestWithHousehold[];
  summary: GuestSummary;
};

export async function GET() {
  const allGuests = db.select().from(guests).all();
  const allHouseholds = db.select().from(households).all();

  const householdMap = new Map(allHouseholds.map((h) => [h.id, h.name]));
  const guestMap = new Map(
    allGuests.map((g) => [g.id, `${g.firstName} ${g.lastName || ""}`.trim()])
  );

  const guestsWithDetails: GuestWithHousehold[] = allGuests.map((g) => ({
    id: g.id,
    firstName: g.firstName,
    lastName: g.lastName,
    email: g.email,
    phone: g.phone,
    householdId: g.householdId,
    householdName: g.householdId ? householdMap.get(g.householdId) || null : null,
    party: g.party,
    attendance: g.attendance,
    rsvpStatus: g.rsvpStatus,
    isPlusOne: g.isPlusOne,
    linkedGuestId: g.linkedGuestId,
    linkedGuestName: g.linkedGuestId ? guestMap.get(g.linkedGuestId) || null : null,
    dietaryRequirements: g.dietaryRequirements,
    allergies: g.allergies,
    accessibilityNeeds: g.accessibilityNeeds,
    tableAssignment: g.tableAssignment,
    notes: g.notes,
    createdAt: g.createdAt,
  }));

  const uniqueHouseholdIds = new Set(
    allGuests.filter((g) => g.householdId).map((g) => g.householdId)
  );

  const notDeclined = allGuests.filter((g) => g.rsvpStatus !== "declined");

  const summary: GuestSummary = {
    total: allGuests.length,
    accepted: allGuests.filter((g) => g.rsvpStatus === "accepted").length,
    declined: allGuests.filter((g) => g.rsvpStatus === "declined").length,
    pending: allGuests.filter((g) => g.rsvpStatus === "pending").length,
    brideGuests: allGuests.filter((g) => g.party === "bride").length,
    groomGuests: allGuests.filter((g) => g.party === "groom").length,
    jointGuests: allGuests.filter((g) => g.party === "joint").length,
    ceremonyCount: notDeclined.filter(
      (g) => g.attendance === "ceremony" || g.attendance === "all"
    ).length,
    receptionCount: notDeclined.filter(
      (g) => g.attendance === "reception" || g.attendance === "all"
    ).length,
    eveningCount: notDeclined.filter(
      (g) => g.attendance === "evening" || g.attendance === "all"
    ).length,
    allDayCount: notDeclined.filter((g) => g.attendance === "all").length,
    plusOnes: allGuests.filter((g) => g.isPlusOne).length,
    householdCount: uniqueHouseholdIds.size,
  };

  const data: GuestListData = { guests: guestsWithDetails, summary };
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();

  const result = db
    .insert(guests)
    .values({
      firstName: body.firstName,
      lastName: body.lastName || "",
      email: body.email || "",
      phone: body.phone || "",
      householdId: body.householdId || null,
      party: body.party || "joint",
      attendance: body.attendance || "all",
      rsvpStatus: body.rsvpStatus || "pending",
      isPlusOne: body.isPlusOne || false,
      linkedGuestId: body.linkedGuestId || null,
      dietaryRequirements: body.dietaryRequirements || "",
      allergies: body.allergies || "",
      accessibilityNeeds: body.accessibilityNeeds || "",
      tableAssignment: body.tableAssignment || "",
      notes: body.notes || "",
    })
    .returning()
    .get();

  return NextResponse.json(result, { status: 201 });
}
