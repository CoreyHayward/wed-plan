"use client";

import { useEffect, useState, useCallback, type DragEvent } from "react";
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
  ArrowUp,
  ArrowDown,
  Folder,
  GripVertical,
  Trash2,
} from "lucide-react";
import type { DashboardData } from "@/app/api/dashboard/route";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseGroupId, setNewExpenseGroupId] = useState<string>("");
  const [showGroups, setShowGroups] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<number[]>([]);
  const [draggedExpenseId, setDraggedExpenseId] = useState<number | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<number | null>(null);
  const [dragOverExpenseId, setDragOverExpenseId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    const json: DashboardData = await res.json();
    setData(json);
    if (!newExpenseGroupId && json.groups?.[0]?.id) {
      setNewExpenseGroupId(String(json.groups[0].id));
    }
    setLoading(false);
  }, [newExpenseGroupId]);

  useEffect(() => {
    // Defer the initial load to satisfy the repo's react-hooks/set-state-in-effect lint rule.
    const timeoutId = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
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

  const addGroup = async () => {
    if (!newGroupName.trim()) return;
    await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGroupName.trim() }),
    });
    setNewGroupName("");
    fetchData();
  };

  const deleteGroup = async (id: number) => {
    if (!confirm("Delete this group? Expenses will move to another group.")) return;
    const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Could not delete group (at least one group must remain).");
      return;
    }
    fetchData();
  };

  const moveGroup = async (index: number, direction: "up" | "down") => {
    if (!data) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= data.groups.length) return;

    const a = data.groups[index];
    const b = data.groups[swapIndex];

    const updatedGroups = [...data.groups];
    updatedGroups[index] = { ...b, sortOrder: a.sortOrder };
    updatedGroups[swapIndex] = { ...a, sortOrder: b.sortOrder };
    setData({ ...data, groups: updatedGroups });

    await Promise.all([
      fetch(`/api/groups/${a.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: b.sortOrder }),
      }),
      fetch(`/api/groups/${b.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: a.sortOrder }),
      }),
    ]);

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

  const reorderExpenses = async (groupId: number, targetExpenseId: number) => {
    const isMissingDragContext = !data || draggedExpenseId === null;
    const isDifferentGroup = draggedGroupId !== groupId;
    const isSameExpense = draggedExpenseId === targetExpenseId;

    if (isMissingDragContext || isDifferentGroup || isSameExpense) {
      setDraggedExpenseId(null);
      setDraggedGroupId(null);
      setDragOverExpenseId(null);
      return;
    }

    const group = data.groups.find((item) => item.id === groupId);
    if (!group) return;

    const currentExpenses = [...group.expenses];
    const fromIndex = currentExpenses.findIndex((expense) => expense.id === draggedExpenseId);
    const toIndex = currentExpenses.findIndex((expense) => expense.id === targetExpenseId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [movedExpense] = currentExpenses.splice(fromIndex, 1);
    currentExpenses.splice(toIndex, 0, movedExpense);

    const orderedSortValues = group.expenses
      .map((expense) => expense.sortOrder)
      .sort((a, b) => a - b);
    const reorderedExpenses = currentExpenses.map((expense, index) => ({
      ...expense,
      sortOrder: orderedSortValues[index] ?? index,
    }));
    const reorderedExpenseMap = new Map(
      reorderedExpenses.map((expense) => [expense.id, expense])
    );

    setData({
      ...data,
      categories: data.categories.map(
        (expense) => reorderedExpenseMap.get(expense.id) ?? expense
      ),
      groups: data.groups.map((item) =>
        item.id === groupId ? { ...item, expenses: reorderedExpenses } : item
      ),
    });

    setDraggedExpenseId(null);
    setDraggedGroupId(null);
    setDragOverExpenseId(null);

    await Promise.all(
      reorderedExpenses.map((expense) =>
        fetch(`/api/categories/${expense.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: expense.sortOrder }),
        })
      )
    );

    fetchData();
  };

  const handleDragStart = (
    event: DragEvent<HTMLButtonElement>,
    groupId: number,
    expenseId: number
  ) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(expenseId));
    setDraggedExpenseId(expenseId);
    setDraggedGroupId(groupId);
    setDragOverExpenseId(expenseId);
  };

  const handleDragEnd = () => {
    setDraggedExpenseId(null);
    setDraggedGroupId(null);
    setDragOverExpenseId(null);
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
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowGroups(true)}>
            <Folder className="w-4 h-4 mr-1" />
            Groups
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowAddExpense(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
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
                    <div
                      key={cat.id}
                      className="mb-2 last:mb-0"
                      onDragOver={(event) => {
                        if (draggedGroupId !== group.id) return;
                        event.preventDefault();
                        setDragOverExpenseId(cat.id);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        void reorderExpenses(group.id, cat.id);
                      }}
                    >
                      <Link href={`/categories/${cat.id}`} className="block relative">
                        <Card
                          className={`cursor-pointer transition-colors pl-10 ${
                            dragOverExpenseId === cat.id && draggedExpenseId !== cat.id
                              ? "ring-2 ring-primary/40 bg-accent/20"
                              : "hover:bg-accent/30"
                          }`}
                        >
                          {/* Drag handle moved inside the card as an absolute, touch-friendly control */}
                          <button
                            type="button"
                            draggable
                            aria-label={`Reorder ${cat.name}`}
                            onClick={(event) => event.preventDefault()}
                            onDragStart={(event) => handleDragStart(event, group.id, cat.id)}
                            onDragEnd={handleDragEnd}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-md border border-dashed border-border text-muted-foreground bg-transparent touch-manipulation" 
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                          >
                            <GripVertical className="w-4 h-4" />
                          </button>

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
                    </div>
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

      <Sheet open={showGroups} onClose={() => setShowGroups(false)} title="Groups">
        <div className="space-y-3">
          {data.groups.map((group, index) => (
            <div key={group.id} className="flex items-center justify-between rounded-lg border p-2.5">
              <span className="text-sm font-medium">{group.name}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveGroup(index, "up")}
                  disabled={index === 0}
                  className="p-1.5 rounded hover:bg-accent disabled:opacity-30"
                >
                  <ArrowUp className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => moveGroup(index, "down")}
                  disabled={index === data.groups.length - 1}
                  className="p-1.5 rounded hover:bg-accent disabled:opacity-30"
                >
                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={() => deleteGroup(group.id)} className="p-1.5 rounded hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t space-y-2">
            <Input
              placeholder="New group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <Button className="w-full" onClick={addGroup} disabled={!newGroupName.trim()}>
              Add Group
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
