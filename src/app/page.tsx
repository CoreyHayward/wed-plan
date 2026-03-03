"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  ChevronRight,
  TrendingUp,
  Wallet,
  CreditCard,
  CalendarClock,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import type { DashboardData } from "@/app/api/dashboard/route";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseGroupId, setNewExpenseGroupId] = useState<string>("");
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<number[]>([]);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    const json = await res.json();
    setData(json);
    if (!newExpenseGroupId && json.groups?.[0]?.id) {
      setNewExpenseGroupId(String(json.groups[0].id));
    }
    setLoading(false);
  }, [newExpenseGroupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addExpense = async () => {
    if (!newExpenseName.trim()) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newExpenseName.trim(),
        groupId: newExpenseGroupId ? parseInt(newExpenseGroupId) : undefined,
      }),
    });
    setNewExpenseName("");
    setShowAddExpense(false);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  const remainingBudget = data.totalBudget - data.totalCommitted;
  const budgetVariant =
    remainingBudget < 0
      ? "danger"
      : remainingBudget < data.totalBudget * 0.1
      ? "warning"
      : "default";

  const reminderLabel = (daysUntil: number) => {
    if (daysUntil < 0) return `${Math.abs(daysUntil)}d overdue`;
    if (daysUntil === 0) return "Due today";
    if (daysUntil === 1) return "Due tomorrow";
    return `Due in ${daysUntil}d`;
  };

  const toggleGroup = (groupId: number) => {
    setCollapsedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {data.coupleNames ? `${data.coupleNames} Wedding Plan` : "Wed Plan"}
        </h1>
        <p className="text-muted-foreground text-sm">Your wedding budget at a glance</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            Budget Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Committed</span>
                <span className="font-semibold">
                  {formatCurrency(data.totalCommitted)} / {formatCurrency(data.totalBudget)}
                </span>
              </div>
              <ProgressBar value={data.totalCommitted} max={data.totalBudget} variant={budgetVariant} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <TrendingUp className="w-4 h-4 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="text-sm font-semibold">{formatCurrency(Math.max(0, remainingBudget))}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <CreditCard className="w-4 h-4 mx-auto mb-1 text-success" />
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-sm font-semibold">{formatCurrency(data.totalPaid)}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <Wallet className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-sm font-semibold">{formatCurrency(data.totalCommitted - data.totalPaid)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.reminders.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primary" />
              Upcoming Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.reminders.map((r) => (
                <Link key={`${r.vendorId}-${r.type}`} href={`/categories/${r.categoryId}`}>
                  <div className="flex items-center justify-between rounded-lg border p-2.5 hover:bg-accent/30 transition-colors cursor-pointer">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.vendorName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.categoryName} • {r.type === "deposit" ? "Deposit" : "Final payment"}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        r.status === "overdue"
                          ? "bg-destructive text-destructive-foreground"
                          : r.status === "today"
                          ? "bg-amber-500 text-white"
                          : undefined
                      }
                    >
                      {r.status === "overdue" && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {reminderLabel(r.daysUntil)}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Expenses</h2>
        <Button size="sm" variant="outline" onClick={() => setShowAddExpense(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="space-y-4 mb-6">
        {data.groups.map((group) => {
          const isCollapsed = collapsedGroupIds.includes(group.id);
          const remaining = group.budgetTotal - group.committedTotal;

          return (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-start justify-between mb-2 px-1"
              >
                <div className="text-left min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {formatCurrency(group.committedTotal)} / {formatCurrency(group.budgetTotal)} • {group.expenseCount} expense{group.expenseCount !== 1 ? "s" : ""} • {formatCurrency(remaining)} left
                  </p>
                </div>
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
              </button>

              {!isCollapsed && (
                <div className="space-y-2">
                  {group.expenses.map((cat) => (
                    <Link key={cat.id} href={`/categories/${cat.id}`} className="block mb-2 last:mb-0">
                      <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium truncate">{cat.name}</h3>
                                {cat.vendorCount > 0 && (
                                  <Badge variant="secondary">
                                    {cat.vendorCount} option{cat.vendorCount !== 1 ? "s" : ""}
                                  </Badge>
                                )}
                              </div>

                              {cat.selectedVendor ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant={cat.selectedVendor.isBooked ? "success" : "secondary"}>
                                    {cat.selectedVendor.isBooked ? "Booked" : "Selected"}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground truncate">{cat.selectedVendor.name}</span>
                                  <span className="text-sm font-semibold ml-auto shrink-0">
                                    {formatCurrency(cat.selectedVendor.price)}
                                  </span>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  {cat.vendorCount > 0 ? "No vendor selected yet" : "No options added yet"}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground ml-2 shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {group.expenses.length === 0 && (
                    <p className="text-xs text-muted-foreground px-1">No expenses in this group yet.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Sheet open={showAddExpense} onClose={() => setShowAddExpense(false)} title="Add Expense">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addExpense();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium mb-1.5 block">Expense Name</label>
            <Input
              placeholder="e.g. Venue"
              value={newExpenseName}
              onChange={(e) => setNewExpenseName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Group</label>
            <select
              value={newExpenseGroupId}
              onChange={(e) => setNewExpenseGroupId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {data.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={!newExpenseName.trim()}>
            Add Expense
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
