"use client";

import { CardGridSkeleton, NoResults } from "@/components/layout/states";
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
  if (loading) {
    return <CardGridSkeleton count={8} />;
  }

  if (products.length === 0) {
    return <NoResults />;
  }

  return (
    <section aria-label={`${products.length} product${products.length !== 1 ? 's' : ''} found`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onViewDetails={onProductClick}
          />
        ))}
      </div>
    </section>
  );
}
