"use client";

import type { ReactNode } from "react";
import { TopHeader, BottomNav } from "@/components/layout/navigation";

/**
 * Buyer route group layout — top header + bottom tab navigation.
 */
export default function BuyerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--fresh-surface)]">
      <TopHeader />
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
