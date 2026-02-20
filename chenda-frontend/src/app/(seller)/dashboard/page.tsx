"use client";

import { useEffect, useState } from "react";
import { productsApi } from "@/lib/api";
import { SellerAnalytics } from "@/components/seller/SellerAnalytics";
import type { SellerProduct } from "@/lib/types/seller";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);
        const response = await productsApi.getAll({ status: "active" });
        setProducts(response.data.products || []);
      } catch (error: any) {
        console.error("Failed to fetch products:", error);
        toast.error(error.response?.data?.message || "Failed to load products");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--fresh-text-primary)]">
          Seller Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--fresh-text-muted)]">
          Overview of your products and performance
        </p>
      </div>

      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--fresh-primary)]" />
        </div>
      ) : (
        <SellerAnalytics products={products} />
      )}
    </div>
  );
}
