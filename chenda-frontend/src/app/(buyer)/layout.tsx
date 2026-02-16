"use client";

import type { ReactNode } from "react";
import { TopHeader, BottomNav } from "@/components/layout/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

/**
 * Buyer route group layout — top header + bottom tab navigation.
 * Protected route: requires authentication and buyer/both type.
 */
export default function BuyerLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedTypes={["buyer", "both"]}>
      <div className="min-h-screen bg-[var(--fresh-surface)]">
        <TopHeader />
        <main className="pb-20">{children}</main>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
