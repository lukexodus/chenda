"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductTable } from "@/components/seller/ProductTable";
import { productsApi } from "@/lib/api";
import type { SellerProduct } from "@/lib/types/seller";
import { toast } from "sonner";

export function SellerProductsView() {
  const router = useRouter();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteProduct, setDeleteProduct] = useState<SellerProduct | null>(null);

  // Fetch seller's products
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

  const handleEdit = (product: SellerProduct) => {
    router.push(`/products/${product.id}/edit`);
  };

  const handleDelete = (product: SellerProduct) => {
    setDeleteProduct(product);
  };

  const confirmDelete = async () => {
    if (!deleteProduct) return;

    try {
      await productsApi.delete(deleteProduct.id);
      setProducts(products.filter((p) => p.id !== deleteProduct.id));
      toast.success("Product deleted successfully");
      setDeleteProduct(null);
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      toast.error(error.response?.data?.message || "Failed to delete product");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--fresh-border)] bg-white p-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--fresh-text-primary)]">
            My Products
          </h1>
          <p className="text-sm text-[var(--fresh-text-muted)]">
            {!isLoading && `${products.length} active ${products.length === 1 ? "product" : "products"}`}
          </p>
        </div>
        <Button
          onClick={() => router.push("/products/add")}
          className="bg-[var(--fresh-primary)] hover:bg-[var(--fresh-primary)]/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Product Table */}
      <div className="p-4">
        <ProductTable
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold">Delete Product</h3>
            <p className="mt-2 text-sm text-[var(--fresh-text-muted)]">
              Are you sure you want to delete <strong>{deleteProduct.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteProduct(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
