"use client";

import { Package } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/stores/searchStore";

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  onProductClick?: (product: Product) => void;
}

export function ProductGrid({
  products,
  loading,
  onProductClick,
}: ProductGridProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-[420px] rounded-[var(--radius-card)] border border-[var(--fresh-border)] bg-white animate-pulse"
          >
            <div className="aspect-square w-full bg-gray-200" />
            <div className="p-3 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/2" />
              <div className="h-2 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-8 bg-gray-200 rounded w-full mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state - no products
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="rounded-full bg-[var(--fresh-surface)] p-6 mb-4">
          <Package className="h-12 w-12 text-[var(--fresh-text-muted)]" />
        </div>
        <h3 className="text-xl font-semibold text-[var(--fresh-text-primary)] mb-2">
          No products found
        </h3>
        <p className="text-[var(--fresh-text-muted)] max-w-md">
          Try adjusting your search filters, increasing your search radius, or
          lowering the minimum freshness score to see more results.
        </p>
      </div>
    );
  }

  // Product grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onViewDetails={onProductClick}
        />
      ))}
    </div>
  );
}
