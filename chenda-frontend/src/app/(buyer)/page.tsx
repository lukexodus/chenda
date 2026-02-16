"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ShoppingCart, History } from "lucide-react";

import { SearchForm } from "@/components/buyer/SearchForm";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductDetail } from "@/components/products/ProductDetail";
import { SortControls, SortOption } from "@/components/products/SortControls";
import { useSearchStore } from "@/lib/stores/searchStore";
import { useCartStore } from "@/lib/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/stores/searchStore";

export default function BuyerDashboardPage() {
  const { results: products, loading, error, history: searchHistory } = useSearchStore();
  const { getTotalItems } = useCartStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("score");
  const [showHistory, setShowHistory] = useState(false);

  // Sort products based on selected option
  const sortedProducts = useMemo(() => {
    if (!products.length) return [];

    const sorted = [...products];

    switch (sortBy) {
      case "score":
        return sorted.sort((a, b) => (b.combined_score || 0) - (a.combined_score || 0));
      case "price_low":
        return sorted.sort((a, b) => a.price - b.price);
      case "price_high":
        return sorted.sort((a, b) => b.price - a.price);
      case "distance":
        return sorted.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
      case "freshness":
        return sorted.sort((a, b) => (b.freshness_score || 0) - (a.freshness_score || 0));
      default:
        return sorted;
    }
  }, [products, sortBy]);

  // Auto-hide search history when search is performed
  useEffect(() => {
    if (products.length > 0) {
      setShowHistory(false);
    }
  }, [products]);

  // Calculate cart badge
  const cartItemCount = getTotalItems();

  return (
    <div className="min-h-screen bg-[var(--fresh-background)]">
      {/* Header */}
      <div className="bg-white border-b border-[var(--fresh-border)] sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--fresh-primary)] flex items-center justify-center">
                <Search className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--fresh-text-primary)]">
                  Find Fresh Products
                </h1>
                <p className="text-sm text-[var(--fresh-text-muted)]">
                  Discover farm-fresh products near you
                </p>
              </div>
            </div>

            {/* Cart Badge */}
            <Button
              variant="outline"
              className="relative"
              onClick={() => (window.location.href = "/buyer/cart")}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Cart
              {cartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-[var(--fresh-primary)] text-white">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Search Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <SearchForm />

              {/* Search History */}
              {searchHistory.length > 0 && (
                <Card className="mt-6 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm flex items-center">
                      <History className="h-4 w-4 mr-2" />
                      Recent Searches
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      {showHistory ? "Hide" : "Show"}
                    </Button>
                  </div>

                  {showHistory && (
                    <div className="space-y-2">
                      {searchHistory.slice(0, 5).map((search, index) => (
                        <div
                          key={index}
                          className="text-xs p-2 rounded bg-[var(--fresh-surface)] hover:bg-[var(--fresh-surface)]/70 cursor-pointer"
                        >
                          <div className="font-medium truncate">
                            {search.filters.location?.address || "Unknown location"}
                          </div>
                          <div className="text-[var(--fresh-text-muted)] flex items-center justify-between mt-1">
                            <span>
                              {search.resultCount} result{search.resultCount !== 1 ? "s" : ""}
                            </span>
                            <span>
                              {new Date(search.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>

          {/* Right Content - Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Error Message */}
            {error && (
              <Card className="p-4 border-[var(--fresh-danger)] bg-red-50">
                <p className="text-[var(--fresh-danger)] text-sm">{error}</p>
              </Card>
            )}

            {/* Empty State - No Search Yet */}
            {!loading && !error && products.length === 0 && searchHistory.length === 0 && (
              <Card className="p-12 text-center">
                <div className="rounded-full bg-[var(--fresh-surface)] p-6 inline-flex mb-4">
                  <Search className="h-12 w-12 text-[var(--fresh-text-muted)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--fresh-text-primary)] mb-2">
                  Start Your Search
                </h3>
                <p className="text-[var(--fresh-text-muted)] max-w-md mx-auto">
                  Set your location and preferences in the search panel to discover
                  fresh products near you. The Chenda algorithm will rank products
                  based on proximity and freshness.
                </p>
              </Card>
            )}

            {/* Empty State - No Results Found */}
            {!loading && !error && products.length === 0 && searchHistory.length > 0 && (
              <Card className="p-12 text-center">
                <div className="rounded-full bg-[var(--fresh-surface)] p-6 inline-flex mb-4">
                  <Search className="h-12 w-12 text-[var(--fresh-text-muted)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--fresh-text-primary)] mb-2">
                  No Products Found
                </h3>
                <p className="text-[var(--fresh-text-muted)] max-w-md mx-auto mb-4">
                  We couldn't find any products matching your search criteria.
                  Try adjusting your filters:
                </p>
                <ul className="text-sm text-[var(--fresh-text-muted)] space-y-1 max-w-md mx-auto">
                  <li>• Increase your search radius</li>
                  <li>• Lower the minimum freshness score</li>
                  <li>• Try a different location</li>
                </ul>
              </Card>
            )}

            {/* Sort Controls & Results */}
            {!loading && products.length > 0 && (
              <>
                <SortControls
                  value={sortBy}
                  onChange={setSortBy}
                  resultCount={products.length}
                />

                <ProductGrid
                  products={sortedProducts}
                  loading={false}
                  onProductClick={setSelectedProduct}
                />
              </>
            )}

            {/* Loading State */}
            {loading && <ProductGrid products={[]} loading={true} />}
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      <ProductDetail
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      />
    </div>
  );
}
