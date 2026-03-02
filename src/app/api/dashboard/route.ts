export const dynamic = "force-dynamic";

import { db } from "@/db";
import { categories, vendors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export type DashboardData = {
  totalBudget: number;
  totalCommitted: number;
  totalPaid: number;
  categories: {
    id: number;
    name: string;
    budgetAllocation: number;
    sortOrder: number;
    selectedVendor: {
      id: number;
      name: string;
      price: number;
      totalPaid: number;
    } | null;
    vendorCount: number;
  }[];
};

export async function GET() {
  const { settings } = await import("@/db/schema");

  // Get budget
  const budgetSetting = db
    .select()
    .from(settings)
    .where(eq(settings.key, "totalBudget"))
    .get();
  const totalBudget = budgetSetting ? parseFloat(budgetSetting.value) : 0;

  // Get all categories
  const allCategories = db
    .select()
    .from(categories)
    .orderBy(categories.sortOrder)
    .all();

  // Get all vendors
  const allVendors = db.select().from(vendors).all();

  // Build dashboard data
  let totalCommitted = 0;
  let totalPaid = 0;

  const categoryData = allCategories.map((cat) => {
    const catVendors = allVendors.filter((v) => v.categoryId === cat.id);
    const selected = catVendors.find((v) => v.isSelected) || null;

    if (selected) {
      totalCommitted += selected.price;
      totalPaid += selected.totalPaid;
    }

    return {
      id: cat.id,
      name: cat.name,
      budgetAllocation: cat.budgetAllocation,
      sortOrder: cat.sortOrder,
      selectedVendor: selected
        ? {
            id: selected.id,
            name: selected.name,
            price: selected.price,
            totalPaid: selected.totalPaid,
          }
        : null,
      vendorCount: catVendors.length,
    };
  });

  const data: DashboardData = {
    totalBudget,
    totalCommitted,
    totalPaid,
    categories: categoryData,
  };

  return NextResponse.json(data);
}
