import { db } from "@/db";
import { vendors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = db
    .select()
    .from(vendors)
    .where(eq(vendors.categoryId, parseInt(id)))
    .all();

  return NextResponse.json(rows);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const result = db
    .insert(vendors)
    .values({
      categoryId: parseInt(id),
      name: body.name,
      price: body.price || 0,
      notes: body.notes || "",
      pros: body.pros || "",
      cons: body.cons || "",
      contactInfo: body.contactInfo || "",
      depositPaid: body.depositPaid || 0,
      totalPaid: body.totalPaid || 0,
    })
    .returning()
    .get();

  return NextResponse.json(result, { status: 201 });
}
