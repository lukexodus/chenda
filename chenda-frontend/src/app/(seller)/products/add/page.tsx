import type { Metadata } from "next";
import { ProductForm } from "@/components/seller/ProductForm";

export const metadata: Metadata = { title: "Add Product — Chenda" };

export default function AddProductPage() {
  return (
    <div className="p-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold text-[var(--fresh-text-primary)]">
          Add New Product
        </h1>
        <div className="rounded-lg border bg-white p-6">
          <ProductForm />
        </div>
      </div>
    </div>
  );
}
