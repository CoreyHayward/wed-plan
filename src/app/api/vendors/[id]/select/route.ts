import { db } from "@/db";
import { vendors } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const vendorId = parseInt(id);

  // Get the vendor to find its category
  const vendor = db
    .select()
    .from(vendors)
    .where(eq(vendors.id, vendorId))
    .get();

  if (!vendor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Deselect all vendors in the same category
  db.update(vendors)
    .set({ isSelected: false })
    .where(eq(vendors.categoryId, vendor.categoryId))
    .run();

  // Select this vendor
  const result = db
    .update(vendors)
    .set({ isSelected: true })
    .where(eq(vendors.id, vendorId))
    .returning()
    .get();

  return NextResponse.json(result);
}
