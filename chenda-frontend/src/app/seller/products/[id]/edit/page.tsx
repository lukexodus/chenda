"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProductForm } from "@/components/seller/ProductForm";
import { productsApi } from "@/lib/api";
import type { SellerProduct } from "@/lib/types/seller";
import { toast } from "sonner";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<SellerProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await productsApi.getById(id);
        const data = res.data.product ?? res.data.data ?? res.data;
        setProduct(data);
      } catch {
        toast.error("Product not found");
        router.push("/seller/products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--fresh-bg)]">
        <p className="text-sm text-[var(--fresh-text-muted)]">Loading product...</p>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-[var(--fresh-bg,#F7F9FA)]">
      <ProductForm product={product} isEdit />
    </div>
  );
}
