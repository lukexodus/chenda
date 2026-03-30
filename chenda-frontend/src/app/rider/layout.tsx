"use client";

import { ReactNode } from "react";
import { TopHeader, BottomNav } from "@/components/layout/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function RiderLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedTypes={["rider"]}>
      <div className="flex min-h-screen flex-col bg-fresh-bg">
        <TopHeader />
        <main className="flex-1 pb-20">{children}</main>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
