export const dynamic = "force-dynamic";

import { db } from "@/db";
import { guests, households } from "@/db/schema";
import { NextResponse } from "next/server";

function escapeCsv(value: string | null | undefined): string {
  const str = value ?? "";
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const allGuests = db.select().from(guests).all();
  const allHouseholds = db.select().from(households).all();

  const householdMap = new Map(allHouseholds.map((h) => [h.id, h]));
  const guestMap = new Map(
    allGuests.map((g) => [g.id, `${g.firstName} ${g.lastName || ""}`.trim()])
  );

  const headers = [
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Party",
    "Attendance",
    "RSVP Status",
    "Plus One",
    "Linked Guest",
    "Household",
    "Household Address",
    "Dietary Requirements",
    "Allergies",
    "Accessibility Needs",
    "Table Assignment",
    "Notes",
  ];

  const rows = allGuests.map((g) => {
    const household = g.householdId ? householdMap.get(g.householdId) : null;
    const linkedName = g.linkedGuestId ? guestMap.get(g.linkedGuestId) : null;
    return [
      escapeCsv(g.firstName),
      escapeCsv(g.lastName),
      escapeCsv(g.email),
      escapeCsv(g.phone),
      escapeCsv(g.party),
      escapeCsv(g.attendance),
      escapeCsv(g.rsvpStatus),
      g.isPlusOne ? "Yes" : "No",
      escapeCsv(linkedName || ""),
      escapeCsv(household?.name),
      escapeCsv(household?.address),
      escapeCsv(g.dietaryRequirements),
      escapeCsv(g.allergies),
      escapeCsv(g.accessibilityNeeds),
      escapeCsv(g.tableAssignment),
      escapeCsv(g.notes),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="guest-list.csv"',
    },
  });
}
