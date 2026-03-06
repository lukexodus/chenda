"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductTable } from "@/components/seller/ProductTable";
import { productsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { SellerProduct } from "@/lib/types/seller";
import { toast } from "sonner";

export default function SellerProductsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await productsApi.getAll();
      const data = res.data.products ?? res.data.data ?? res.data ?? [];
      setProducts(data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleEdit = (product: SellerProduct) => {
    router.push(`/products/${product.id}/edit`);
  };

  const handleDelete = async (product: SellerProduct) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      setDeletingId(product.id);
      await productsApi.delete(product.id);
      toast.success("Product deleted");
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--fresh-bg)]">
      {/* Header */}
      <div className="border-b bg-white px-4 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--fresh-text)]">My Products</h1>
            <p className="text-sm text-[var(--fresh-text-muted)]">
              {user?.name ?? "Seller"} · {products.length} listing{products.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => router.push("/seller/products/add")}
            className="bg-[var(--fresh-primary)] hover:bg-[var(--fresh-primary-hover)] text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        <ProductTable
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
