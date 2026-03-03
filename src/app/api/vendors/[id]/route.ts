export const dynamic = "force-dynamic";

import { db } from "@/db";
import { vendors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const vendor = db
    .select()
    .from(vendors)
    .where(eq(vendors.id, parseInt(id)))
    .get();

  if (!vendor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(vendor);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const result = db
    .update(vendors)
    .set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.price !== undefined && { price: body.price }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.pros !== undefined && { pros: body.pros }),
      ...(body.cons !== undefined && { cons: body.cons }),
      ...(body.contactInfo !== undefined && { contactInfo: body.contactInfo }),
      ...(body.depositPaid !== undefined && { depositPaid: body.depositPaid }),
      ...(body.totalPaid !== undefined && { totalPaid: body.totalPaid }),
      ...(body.depositDueDate !== undefined && { depositDueDate: body.depositDueDate || null }),
      ...(body.finalPaymentDueDate !== undefined && {
        finalPaymentDueDate: body.finalPaymentDueDate || null,
      }),
    })
    .where(eq(vendors.id, parseInt(id)))
    .returning()
    .get();

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.delete(vendors).where(eq(vendors.id, parseInt(id))).run();
  return NextResponse.json({ success: true });
}
