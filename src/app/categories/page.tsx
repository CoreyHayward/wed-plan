"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/utils";
import { Plus, ChevronRight, Trash2, ArrowUp, ArrowDown, Folder, ChevronDown } from "lucide-react";
import type { DashboardData } from "@/app/api/dashboard/route";

type Expense = DashboardData["categories"][number] & { selectedVendorPrice?: number };
type Group = DashboardData["groups"][number];

export default function CategoriesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseGroupId, setNewExpenseGroupId] = useState<string>("");

  const [showGroups, setShowGroups] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<number[]>([]);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    const json: DashboardData = await res.json();
    setExpenses(
      json.categories.map((c) => ({
        ...c,
        vendorCount: c.vendorCount,
        selectedVendorPrice: c.selectedVendor?.price,
      }))
    );
    setGroups(json.groups);
    if (!newExpenseGroupId && json.groups[0]?.id) {
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
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= groups.length) return;

    const a = groups[index];
    const b = groups[swapIndex];

    const updated = [...groups];
    updated[index] = { ...b, sortOrder: a.sortOrder };
    updated[swapIndex] = { ...a, sortOrder: b.sortOrder };
    setGroups(updated);

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

  const toggleGroup = (groupId: number) => {
    setCollapsedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const deleteExpense = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this expense and all its vendor options?")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    fetchData();
  };

  const moveExpense = async (
    groupId: number,
    indexInGroup: number,
    direction: "up" | "down",
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const groupExpenses = expenses.filter((ex) => ex.groupId === groupId);
    const swapIndex = direction === "up" ? indexInGroup - 1 : indexInGroup + 1;
    if (swapIndex < 0 || swapIndex >= groupExpenses.length) return;

    const a = groupExpenses[indexInGroup];
    const b = groupExpenses[swapIndex];

    const updated = expenses.map((ex) => {
      if (ex.id === a.id) return { ...ex, sortOrder: b.sortOrder };
      if (ex.id === b.id) return { ...ex, sortOrder: a.sortOrder };
      return ex;
    });
    setExpenses(updated);

    await Promise.all([
      fetch(`/api/categories/${a.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: b.sortOrder }),
      }),
      fetch(`/api/categories/${b.id}`, {
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

  const expensesByGroup = groups.map((group) => ({
    ...group,
    expenses: expenses.filter((e) => e.groupId === group.id),
  }));

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground text-sm">{expenses.length} expenses</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowGroups(true)}>
            <Folder className="w-4 h-4 mr-1" />
            Groups
          </Button>
          <Button size="sm" onClick={() => setShowAddExpense(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {expensesByGroup.map((group) => {
          const isCollapsed = collapsedGroupIds.includes(group.id);
          return (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between mb-2 px-1"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.name}
                </p>
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {!isCollapsed && (
                <div className="space-y-2">
                  {group.expenses.map((expense, indexInGroup) => {
                    return (
                      <Link key={expense.id} href={`/categories/${expense.id}`} className="block mb-2 last:mb-0">
                        <Card className="hover:bg-accent/30 transition-colors cursor-pointer group">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium truncate">{expense.name}</h3>
                                  {(expense.vendorCount ?? 0) > 0 && (
                                    <Badge variant="secondary">
                                      {expense.vendorCount} option{expense.vendorCount !== 1 ? "s" : ""}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  {expense.budgetAllocation > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      Budget: {formatCurrency(expense.budgetAllocation)}
                                    </span>
                                  )}
                                  {expense.selectedVendorPrice !== undefined && (
                                    <span className="text-xs font-medium text-primary">
                                      {expense.selectedVendor?.isBooked ? "Booked" : "Selected"}: {formatCurrency(expense.selectedVendorPrice)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <div className="flex flex-col">
                                  <button
                                    onClick={(e) => moveExpense(group.id, indexInGroup, "up", e)}
                                    disabled={indexInGroup === 0}
                                    aria-label="Move expense up"
                                    className="p-1 rounded hover:bg-accent transition-all disabled:opacity-20"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5 text-muted-foreground" />
                                  </button>
                                  <button
                                    onClick={(e) => moveExpense(group.id, indexInGroup, "down", e)}
                                    disabled={indexInGroup === group.expenses.length - 1}
                                    aria-label="Move expense down"
                                    className="p-1 rounded hover:bg-accent transition-all disabled:opacity-20"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5 text-muted-foreground" />
                                  </button>
                                </div>
                                <button
                                  onClick={(e) => deleteExpense(expense.id, e)}
                                  className="p-2 rounded-full hover:bg-destructive/10 transition-all"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </button>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
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
              {groups.map((g) => (
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
          {groups.map((group, index) => (
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
                  disabled={index === groups.length - 1}
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
