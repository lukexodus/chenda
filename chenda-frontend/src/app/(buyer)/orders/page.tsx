"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function OrdersPage() {
  return (
    <ProtectedRoute allowedTypes={["buyer", "both"]}>
      <div className="p-4">
        <h1 className="text-2xl font-semibold text-[var(--fresh-text-primary)]">
          My Orders
        </h1>
        <p className="mt-2 text-sm text-[var(--fresh-text-muted)]">
          Order history and tracking — coming in Task 2.8
        </p>
      </div>
    </ProtectedRoute>
  );
}
