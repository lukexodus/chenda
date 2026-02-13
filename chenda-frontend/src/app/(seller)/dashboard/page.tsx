import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard — Chenda" };

export default function DashboardPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold text-[var(--fresh-text-primary)]">
        Seller Dashboard
      </h1>
      <p className="mt-2 text-sm text-[var(--fresh-text-muted)]">
        Seller analytics — coming in Task 2.6
      </p>
    </div>
  );
}
