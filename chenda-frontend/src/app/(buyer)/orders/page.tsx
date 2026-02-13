import type { Metadata } from "next";

export const metadata: Metadata = { title: "Orders — Chenda" };

export default function OrdersPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold text-[var(--fresh-text-primary)]">
        My Orders
      </h1>
      <p className="mt-2 text-sm text-[var(--fresh-text-muted)]">
        Order management — coming in Task 2.5
      </p>
    </div>
  );
}
