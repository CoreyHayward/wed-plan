"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/utils";
import { Plus, ChevronRight, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type { Category } from "@/db/schema";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<(Category & { vendorCount?: number; selectedVendorPrice?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    const json = await res.json();
    setCategories(
      json.categories.map((c: any) => ({
        ...c,
        vendorCount: c.vendorCount,
        selectedVendorPrice: c.selectedVendor?.price,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName.trim() }),
    });
    setNewCategoryName("");
    setShowAddCategory(false);
    fetchCategories();
  };

  const deleteCategory = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this category and all its vendors?")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    fetchCategories();
  };

  const moveCategory = async (index: number, direction: "up" | "down", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= categories.length) return;
    const a = categories[index];
    const b = categories[swapIndex];
    // Optimistic update
    const updated = [...categories];
    updated[index] = { ...b, sortOrder: a.sortOrder };
    updated[swapIndex] = { ...a, sortOrder: b.sortOrder };
    setCategories(updated);
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
    fetchCategories();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-sm">
            {categories.length} categories
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddCategory(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="space-y-2 mb-6">
        {categories.map((cat, index) => (
          <Link key={cat.id} href={`/categories/${cat.id}`}>
            <Card className="hover:bg-accent/30 transition-colors cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{cat.name}</h3>
                      {(cat.vendorCount ?? 0) > 0 && (
                        <Badge variant="secondary">
                          {cat.vendorCount} option{cat.vendorCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {cat.budgetAllocation > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Budget: {formatCurrency(cat.budgetAllocation)}
                        </span>
                      )}
                      {cat.selectedVendorPrice !== undefined && (
                        <span className="text-xs font-medium text-primary">
                          Booked: {formatCurrency(cat.selectedVendorPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="flex flex-col">
                      <button
                        onClick={(e) => moveCategory(index, "up", e)}
                        disabled={index === 0}
                        aria-label="Move category up"
                        className="p-1 rounded hover:bg-accent transition-all disabled:opacity-20"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => moveCategory(index, "down", e)}
                        disabled={index === categories.length - 1}
                        aria-label="Move category down"
                        className="p-1 rounded hover:bg-accent transition-all disabled:opacity-20"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    <button
                      onClick={(e) => deleteCategory(cat.id, e)}
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
        ))}
      </div>

      <Sheet
        open={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        title="Add Category"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addCategory();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Category Name
            </label>
            <Input
              placeholder="e.g. Flowers & Décor"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={!newCategoryName.trim()}>
            Add Category
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
