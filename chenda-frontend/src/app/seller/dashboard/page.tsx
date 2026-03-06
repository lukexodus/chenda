"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SellerAnalytics } from "@/components/seller/SellerAnalytics";
import { productsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { SellerProduct } from "@/lib/types/seller";
import { toast } from "sonner";

export default function SellerDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await productsApi.getAll();
      const data = res.data.products ?? res.data.data ?? res.data ?? [];
      setProducts(data);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="min-h-screen bg-[var(--fresh-bg)]">
      {/* Header */}
      <div className="border-b bg-white px-4 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--fresh-text)]">Seller Dashboard</h1>
            <p className="text-sm text-[var(--fresh-text-muted)]">
              Welcome back, {user?.name ?? "Seller"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/seller/products")}
            >
              <Package className="mr-2 h-4 w-4" />
              My Products
            </Button>
            <Button
              onClick={() => router.push("/seller/products/add")}
              className="bg-[var(--fresh-primary)] hover:bg-[var(--fresh-primary-hover)] text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-lg border bg-white animate-pulse" />
            ))}
          </div>
        ) : (
          <SellerAnalytics products={products} />
        )}
      </div>
    </div>
  );
}
