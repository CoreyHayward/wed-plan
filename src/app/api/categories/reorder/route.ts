export const dynamic = "force-dynamic";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  const body: { id: number; sortOrder: number }[] = await request.json();

  for (const item of body) {
    db.update(categories)
      .set({ sortOrder: item.sortOrder })
      .where(eq(categories.id, item.id))
      .run();
  }

  return NextResponse.json({ success: true });
}
