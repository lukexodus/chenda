import type { Metadata } from "next";
import { SellerProductsView } from "./products-view";

export const metadata: Metadata = { title: "My Products — Chenda" };

export default function ProductsPage() {
  return <SellerProductsView />;
}
