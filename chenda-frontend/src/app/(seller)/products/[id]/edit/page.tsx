"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProductForm } from "@/components/seller/ProductForm";
import { productsApi } from "@/lib/api";
import type { SellerProduct } from "@/lib/types/seller";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<SellerProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setIsLoading(true);
        const response = await productsApi.getById(productId);
        setProduct(response.data.product);
      } catch (error: any) {
        console.error("Failed to fetch product:", error);
        toast.error(error.response?.data?.message || "Failed to load product");
        router.push("/products");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProduct();
  }, [productId, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--fresh-primary)]" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="p-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold text-[var(--fresh-text-primary)]">
          Edit Product
        </h1>
        <div className="rounded-lg border bg-white p-6">
          <ProductForm product={product} isEdit />
        </div>
      </div>
    </div>
  );
}
