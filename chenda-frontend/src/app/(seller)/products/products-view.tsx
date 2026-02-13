"use client";

import { EmptyState } from "@/components/layout/states";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SellerProductsView() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-[var(--fresh-border)] bg-white p-4">
        <h1 className="text-xl font-semibold text-[var(--fresh-text-primary)]">
          My Products
        </h1>
        <Button
          size="sm"
          className="bg-[var(--fresh-primary)] hover:bg-[var(--fresh-primary)]/90"
        >
          + Add Product
        </Button>
      </div>
      <EmptyState
        icon={Package}
        title="No products listed"
        description="Start selling by adding your first product."
      />
    </div>
  );
}
