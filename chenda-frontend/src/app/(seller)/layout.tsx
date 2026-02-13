"use client";

import type { ReactNode } from "react";
import { TopHeader, BottomNav } from "@/components/layout/navigation";

/**
 * Seller route group layout — same shell as buyer but with seller nav items.
 */
export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--fresh-surface)]">
      <TopHeader />
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
