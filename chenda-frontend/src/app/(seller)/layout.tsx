"use client";

import type { ReactNode } from "react";
import { TopHeader, BottomNav } from "@/components/layout/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

/**
 * Seller route group layout — same shell as buyer but with seller nav items.
 * Protected route: requires authentication and seller/both type.
 */
export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedTypes={["seller", "both"]}>
      <div className="min-h-screen bg-[var(--fresh-surface)]">
        <TopHeader />
        <main className="pb-20">{children}</main>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
