"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet } from "@/components/ui/sheet";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrency, parseCurrencyInput } from "@/lib/utils";
import {
  ArrowLeft,
  Plus,
  Check,
  Pencil,
  Trash2,
  GitCompareArrows,
  Phone,
  ThumbsUp,
  ThumbsDown,
  StickyNote,
} from "lucide-react";
import type { Category, Vendor } from "@/db/schema";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  // Sheet states
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [showEditBudget, setShowEditBudget] = useState(false);
  const [showEditName, setShowEditName] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    price: "",
    notes: "",
    pros: "",
    cons: "",
    contactInfo: "",
    depositPaid: "",
    totalPaid: "",
  });
  const [budgetInput, setBudgetInput] = useState("");
  const [nameInput, setNameInput] = useState("");

  const fetchData = useCallback(async () => {
    const [catRes, vendorRes] = await Promise.all([
      fetch(`/api/categories/${categoryId}`),
      fetch(`/api/categories/${categoryId}/vendors`),
    ]);
    const catData = await catRes.json();
    const vendorData = await vendorRes.json();
    setCategory(catData);
    setVendors(vendorData);
    setLoading(false);
  }, [categoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setForm({
      name: "",
      price: "",
      notes: "",
      pros: "",
      cons: "",
      contactInfo: "",
      depositPaid: "",
      totalPaid: "",
    });
  };

  const openAddVendor = () => {
    resetForm();
    setEditingVendor(null);
    setShowAddVendor(true);
  };

  const openEditVendor = (vendor: Vendor) => {
    setForm({
      name: vendor.name,
      price: vendor.price.toString(),
      notes: vendor.notes || "",
      pros: vendor.pros || "",
      cons: vendor.cons || "",
      contactInfo: vendor.contactInfo || "",
      depositPaid: vendor.depositPaid.toString(),
      totalPaid: vendor.totalPaid.toString(),
    });
    setEditingVendor(vendor);
    setShowAddVendor(true);
  };

  const saveVendor = async () => {
    if (!form.name.trim()) return;

    const payload = {
      name: form.name.trim(),
      price: parseCurrencyInput(form.price),
      notes: form.notes,
      pros: form.pros,
      cons: form.cons,
      contactInfo: form.contactInfo,
      depositPaid: parseCurrencyInput(form.depositPaid),
      totalPaid: parseCurrencyInput(form.totalPaid),
    };

    if (editingVendor) {
      await fetch(`/api/vendors/${editingVendor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`/api/categories/${categoryId}/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setShowAddVendor(false);
    resetForm();
    setEditingVendor(null);
    fetchData();
  };

  const deleteVendor = async (vendorId: number) => {
    if (!confirm("Delete this vendor option?")) return;
    await fetch(`/api/vendors/${vendorId}`, { method: "DELETE" });
    fetchData();
  };

  const selectVendor = async (vendorId: number) => {
    await fetch(`/api/vendors/${vendorId}/select`, { method: "PUT" });
    fetchData();
  };

  const deselectVendor = async (vendorId: number) => {
    await fetch(`/api/vendors/${vendorId}/deselect`, { method: "PUT" });
    fetchData();
  };

  const updateBudget = async () => {
    await fetch(`/api/categories/${categoryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budgetAllocation: parseCurrencyInput(budgetInput) }),
    });
    setShowEditBudget(false);
    fetchData();
  };

  const updateName = async () => {
    if (!nameInput.trim()) return;
    await fetch(`/api/categories/${categoryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameInput.trim() }),
    });
    setShowEditName(false);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        <p>Category not found.</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Go back
        </Button>
      </div>
    );
  }

  const selectedVendor = vendors.find((v) => v.isSelected);
  const cheapestVendor = vendors.length > 0
    ? vendors.reduce((min, v) => (v.price < min.price ? v : min), vendors[0])
    : null;

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => {
              setNameInput(category.name);
              setShowEditName(true);
            }}
            className="flex items-center gap-1.5 group"
          >
            <h1 className="text-xl font-bold tracking-tight truncate">
              {category.name}
            </h1>
            <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={() => {
              setBudgetInput(category.budgetAllocation.toString());
              setShowEditBudget(true);
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Budget: {category.budgetAllocation > 0
              ? formatCurrency(category.budgetAllocation)
              : "Set budget →"}
          </button>
        </div>
      </div>

      {/* Budget progress for this category */}
      {category.budgetAllocation > 0 && selectedVendor && (
        <div className="mb-4">
          <ProgressBar
            value={selectedVendor.price}
            max={category.budgetAllocation}
            variant={
              selectedVendor.price > category.budgetAllocation
                ? "danger"
                : selectedVendor.price > category.budgetAllocation * 0.9
                ? "warning"
                : "default"
            }
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>
              {formatCurrency(selectedVendor.price)} committed
            </span>
            <span>
              {formatCurrency(
                Math.max(0, category.budgetAllocation - selectedVendor.price)
              )}{" "}
              remaining
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <Button onClick={openAddVendor} className="flex-1">
          <Plus className="w-4 h-4 mr-1" />
          Add Option
        </Button>
        {vendors.length >= 2 && (
          <Link href={`/categories/${categoryId}/compare`}>
            <Button variant="outline">
              <GitCompareArrows className="w-4 h-4 mr-1" />
              Compare
            </Button>
          </Link>
        )}
      </div>

      {/* Vendor list */}
      {vendors.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-2">No vendor options yet</p>
            <p className="text-sm text-muted-foreground">
              Add different vendors to compare prices and services
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 mb-6">
          {vendors.map((vendor) => (
            <Card
              key={vendor.id}
              className={
                vendor.isSelected
                  ? "ring-2 ring-primary/50 border-primary/30"
                  : ""
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{vendor.name}</h3>
                      {vendor.isSelected && (
                        <Badge variant="success">
                          <Check className="w-3 h-3 mr-0.5" />
                          Selected
                        </Badge>
                      )}
                      {cheapestVendor && vendor.id === cheapestVendor.id && !vendor.isSelected && (
                        <Badge variant="secondary">Cheapest</Badge>
                      )}
                    </div>
                    <p className="text-xl font-bold text-primary mt-1">
                      {formatCurrency(vendor.price)}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 mb-3">
                  {vendor.pros && (
                    <div className="flex items-start gap-2 text-sm">
                      <ThumbsUp className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{vendor.pros}</span>
                    </div>
                  )}
                  {vendor.cons && (
                    <div className="flex items-start gap-2 text-sm">
                      <ThumbsDown className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{vendor.cons}</span>
                    </div>
                  )}
                  {vendor.notes && (
                    <div className="flex items-start gap-2 text-sm">
                      <StickyNote className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{vendor.notes}</span>
                    </div>
                  )}
                  {vendor.contactInfo && (
                    <div className="flex items-start gap-2 text-sm">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{vendor.contactInfo}</span>
                    </div>
                  )}
                </div>

                {/* Payment info */}
                {(vendor.depositPaid > 0 || vendor.totalPaid > 0) && (
                  <div className="flex gap-3 text-xs text-muted-foreground mb-3 bg-muted/50 rounded-lg p-2">
                    {vendor.depositPaid > 0 && (
                      <span>Deposit: {formatCurrency(vendor.depositPaid)}</span>
                    )}
                    {vendor.totalPaid > 0 && (
                      <span>Paid: {formatCurrency(vendor.totalPaid)}</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {!vendor.isSelected && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => selectVendor(vendor.id)}
                      className="flex-1"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Select
                    </Button>
                  )}
                  {vendor.isSelected && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deselectVendor(vendor.id)}
                      className="flex-1"
                    >
                      Deselect
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditVendor(vendor)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteVendor(vendor.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Vendor Sheet */}
      <Sheet
        open={showAddVendor}
        onClose={() => {
          setShowAddVendor(false);
          setEditingVendor(null);
          resetForm();
        }}
        title={editingVendor ? "Edit Option" : "Add Option"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveVendor();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium mb-1.5 block">Vendor Name *</label>
            <Input
              placeholder="e.g. Smith Photography"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Price (£)</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Pros</label>
            <Textarea
              placeholder="What's good about this option?"
              value={form.pros}
              onChange={(e) => setForm({ ...form, pros: e.target.value })}
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Cons</label>
            <Textarea
              placeholder="Any downsides?"
              value={form.cons}
              onChange={(e) => setForm({ ...form, cons: e.target.value })}
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Notes</label>
            <Textarea
              placeholder="Any additional notes..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Contact Info</label>
            <Input
              placeholder="Phone, email, or website"
              value={form.contactInfo}
              onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Deposit Paid (£)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.depositPaid}
                onChange={(e) => setForm({ ...form, depositPaid: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Total Paid (£)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.totalPaid}
                onChange={(e) => setForm({ ...form, totalPaid: e.target.value })}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={!form.name.trim()}>
            {editingVendor ? "Save Changes" : "Add Option"}
          </Button>
        </form>
      </Sheet>

      {/* Edit Budget Sheet */}
      <Sheet
        open={showEditBudget}
        onClose={() => setShowEditBudget(false)}
        title="Set Category Budget"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateBudget();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Budget Allocation (£)
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full">
            Save Budget
          </Button>
        </form>
      </Sheet>

      {/* Edit Name Sheet */}
      <Sheet
        open={showEditName}
        onClose={() => setShowEditName(false)}
        title="Rename Category"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateName();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Category Name
            </label>
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={!nameInput.trim()}>
            Save
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
