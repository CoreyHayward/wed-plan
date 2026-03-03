export const dynamic = "force-dynamic";

import { db } from "@/db";
import { categories, groups, vendors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export type Reminder = {
  vendorId: number;
  vendorName: string;
  categoryId: number;
  categoryName: string;
  type: "deposit" | "final";
  dueDate: string;
  daysUntil: number;
  status: "overdue" | "today" | "upcoming";
};

export type ExpenseSummary = {
  id: number;
  name: string;
  groupId: number;
  budgetAllocation: number;
  sortOrder: number;
  selectedVendor: {
    id: number;
    name: string;
    price: number;
    totalPaid: number;
    isBooked: boolean;
  } | null;
  vendorCount: number;
};

export type DashboardData = {
  coupleNames: string;
  totalBudget: number;
  totalCommitted: number;
  totalPaid: number;
  reminders: Reminder[];
  categories: ExpenseSummary[];
  groups: {
    id: number;
    name: string;
    sortOrder: number;
    expenseCount: number;
    budgetTotal: number;
    committedTotal: number;
    paidTotal: number;
    expenses: ExpenseSummary[];
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

  const namesSetting = db
    .select()
    .from(settings)
    .where(eq(settings.key, "coupleNames"))
    .get();
  const coupleNames = namesSetting?.value?.trim() || "";

  // Get all groups, expenses, vendors
  const allGroups = db.select().from(groups).orderBy(groups.sortOrder).all();
  const allCategories = db
    .select()
    .from(categories)
    .orderBy(categories.sortOrder)
    .all();
  const allVendors = db.select().from(vendors).all();

  // Build dashboard data
  let totalCommitted = 0;
  let totalPaid = 0;
  const reminders: Reminder[] = [];

  const dateOnly = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date();
  const todayUtc = new Date(`${dateOnly(today)}T00:00:00Z`);

  const buildReminder = (
    dueDate: string,
    type: "deposit" | "final",
    vendor: (typeof allVendors)[number],
    categoryName: string
  ): Reminder => {
    const dueUtc = new Date(`${dueDate}T00:00:00Z`);
    const daysUntil = Math.round((dueUtc.getTime() - todayUtc.getTime()) / 86400000);
    return {
      vendorId: vendor.id,
      vendorName: vendor.name,
      categoryId: vendor.categoryId,
      categoryName,
      type,
      dueDate,
      daysUntil,
      status: daysUntil < 0 ? "overdue" : daysUntil === 0 ? "today" : "upcoming",
    };
  };

  const categoryData: ExpenseSummary[] = allCategories.map((cat) => {
    const catVendors = allVendors.filter((v) => v.categoryId === cat.id);
    const selected = catVendors.find((v) => v.isSelected) || null;

    if (selected) {
      totalCommitted += selected.price;
      totalPaid += selected.totalPaid;

      if (selected.depositDueDate) {
        reminders.push(buildReminder(selected.depositDueDate, "deposit", selected, cat.name));
      }
      if (selected.finalPaymentDueDate) {
        reminders.push(buildReminder(selected.finalPaymentDueDate, "final", selected, cat.name));
      }
    }

    return {
      id: cat.id,
      name: cat.name,
      groupId: cat.groupId,
      budgetAllocation: cat.budgetAllocation,
      sortOrder: cat.sortOrder,
      selectedVendor: selected
        ? {
            id: selected.id,
            name: selected.name,
            price: selected.price,
            totalPaid: selected.totalPaid,
            isBooked: selected.isBooked,
          }
        : null,
      vendorCount: catVendors.length,
    };
  });

  const groupedData = allGroups.map((group) => {
    const expenses = categoryData.filter((c) => c.groupId === group.id);
    const budgetTotal = expenses.reduce((sum, e) => sum + (e.budgetAllocation || 0), 0);
    const committedTotal = expenses.reduce(
      (sum, e) => sum + (e.selectedVendor?.price || 0),
      0
    );
    const paidTotal = expenses.reduce(
      (sum, e) => sum + (e.selectedVendor?.totalPaid || 0),
      0
    );

    return {
      id: group.id,
      name: group.name,
      sortOrder: group.sortOrder,
      expenseCount: expenses.length,
      budgetTotal,
      committedTotal,
      paidTotal,
      expenses,
    };
  });

  const data: DashboardData = {
    coupleNames,
    totalBudget,
    totalCommitted,
    totalPaid,
    reminders: reminders
      .filter((r) => r.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 8),
    categories: categoryData,
    groups: groupedData,
  };

  return NextResponse.json(data);
}
