import type { Metadata } from "next";

export const metadata: Metadata = { title: "Search — Chenda" };

export default function SearchPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold text-[var(--fresh-text-primary)]">
        Search Products
      </h1>
      <p className="mt-2 text-sm text-[var(--fresh-text-muted)]">
        Algorithm-powered search — coming in Task 2.3
      </p>
    </div>
  );
}
