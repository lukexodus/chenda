"use client";

import { useState } from "react";
import { TopHeader, BottomNav } from "@/components/layout/navigation";
import { SearchForm } from "@/components/buyer/SearchForm";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SortControls, type SortOption } from "@/components/products/SortControls";
import { PreSearchEmpty } from "@/components/layout/states";
import dynamic from "next/dynamic";
import { useSearchStore, type Product } from "@/lib/stores/searchStore";

const ProductDetail = dynamic(
  () => import("@/components/products/ProductDetail").then((m) => m.ProductDetail),
  { ssr: false }
);

export default function BuyerDashboardPage() {
  const { results, loading, filters } = useSearchStore();
  const [sortBy, setSortBy] = useState<SortOption>("score");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const hasSearched = filters.location !== null;

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case "price_low":
        return a.price - b.price;
      case "price_high":
        return b.price - a.price;
      case "distance":
        return (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity);
      case "freshness":
        return (b.freshness_score ?? 0) - (a.freshness_score ?? 0);
      case "score":
      default:
        return (b.combined_score ?? 0) - (a.combined_score ?? 0);
    }
  });

  return (
    <div className="flex min-h-screen flex-col bg-[var(--fresh-surface)]">
      <TopHeader />

      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4 space-y-4 max-w-5xl mx-auto w-full">
        {/* Search & filters */}
        <SearchForm />

        {/* Results header */}
        {(results.length > 0 || loading) && (
          <SortControls
            value={sortBy}
            onChange={setSortBy}
            resultCount={results.length}
          />
        )}

        {/* Pre-search empty state */}
        {!hasSearched && !loading && <PreSearchEmpty />}

        {/* Product grid (hidden until a search has been made) */}
        {(hasSearched || loading) && (
          <ProductGrid
            products={sortedResults}
            loading={loading}
            onProductClick={setSelectedProduct}
          />
        )}
      </main>

      <BottomNav />

      {/* Product detail modal */}
      <ProductDetail
        product={selectedProduct}
        open={selectedProduct !== null}
        onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}
      />
    </div>
  );
}
