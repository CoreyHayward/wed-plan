"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Check,
  ThumbsUp,
  ThumbsDown,
  StickyNote,
  Phone,
  CreditCard,
  Banknote,
} from "lucide-react";
import type { Category, Vendor } from "@/db/schema";

export default function ComparePage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

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

  const selectVendor = async (vendorId: number) => {
    await fetch(`/api/vendors/${vendorId}/select`, { method: "PUT" });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!category || vendors.length < 2) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        <p>Need at least 2 options to compare.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const cheapestPrice = Math.min(...vendors.map((v) => v.price));

  const rows: {
    label: string;
    icon: React.ReactNode;
    render: (v: Vendor) => React.ReactNode;
  }[] = [
    {
      label: "Price",
      icon: <Banknote className="w-4 h-4" />,
      render: (v) => (
        <div>
          <span
            className={cn(
              "text-lg font-bold",
              v.price === cheapestPrice ? "text-success" : "text-foreground"
            )}
          >
            {formatCurrency(v.price)}
          </span>
          {v.price === cheapestPrice && vendors.length > 1 && (
            <Badge variant="success" className="ml-1 text-[10px]">
              Lowest
            </Badge>
          )}
        </div>
      ),
    },
    {
      label: "Pros",
      icon: <ThumbsUp className="w-4 h-4 text-success" />,
      render: (v) => (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {v.pros || "—"}
        </p>
      ),
    },
    {
      label: "Cons",
      icon: <ThumbsDown className="w-4 h-4 text-destructive" />,
      render: (v) => (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {v.cons || "—"}
        </p>
      ),
    },
    {
      label: "Notes",
      icon: <StickyNote className="w-4 h-4" />,
      render: (v) => (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {v.notes || "—"}
        </p>
      ),
    },
    {
      label: "Contact",
      icon: <Phone className="w-4 h-4" />,
      render: (v) => (
        <p className="text-sm text-muted-foreground">
          {v.contactInfo || "—"}
        </p>
      ),
    },
    {
      label: "Deposit",
      icon: <CreditCard className="w-4 h-4" />,
      render: (v) => (
        <p className="text-sm font-medium">
          {v.depositPaid > 0 ? formatCurrency(v.depositPaid) : "—"}
        </p>
      ),
    },
    {
      label: "Paid",
      icon: <CreditCard className="w-4 h-4" />,
      render: (v) => (
        <p className="text-sm font-medium">
          {v.totalPaid > 0 ? formatCurrency(v.totalPaid) : "—"}
        </p>
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Compare Options</h1>
          <p className="text-sm text-muted-foreground">{category.name}</p>
        </div>
      </div>

      {/* Comparison table (horizontally scrollable on mobile) */}
      <div className="overflow-x-auto -mx-4 px-4 pb-6">
        <table className="w-full border-collapse min-w-[500px]">
          {/* Vendor header row */}
          <thead>
            <tr>
              <th className="sticky left-0 bg-background z-10 w-24 p-2 text-left text-xs font-medium text-muted-foreground">
                &nbsp;
              </th>
              {vendors.map((vendor) => (
                <th
                  key={vendor.id}
                  className={cn(
                    "p-3 text-left border-b min-w-[180px]",
                    vendor.isSelected ? "bg-primary/5" : ""
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm truncate">
                      {vendor.name}
                    </span>
                    {vendor.isSelected && (
                      <Badge variant="success">
                        <Check className="w-3 h-3 mr-0.5" />
                        Selected
                      </Badge>
                    )}
                  </div>
                  {!vendor.isSelected && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => selectVendor(vendor.id)}
                      className="text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Select this
                    </Button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          {/* Data rows */}
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b last:border-b-0">
                <td className="sticky left-0 bg-background z-10 p-2 align-top">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    {row.icon}
                    <span>{row.label}</span>
                  </div>
                </td>
                {vendors.map((vendor) => (
                  <td
                    key={vendor.id}
                    className={cn(
                      "p-3 align-top",
                      vendor.isSelected ? "bg-primary/5" : ""
                    )}
                  >
                    {row.render(vendor)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
