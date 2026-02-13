import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profile — Chenda" };

export default function ProfilePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold text-[var(--fresh-text-primary)]">
        My Profile
      </h1>
      <p className="mt-2 text-sm text-[var(--fresh-text-muted)]">
        Profile management — coming in Task 2.4
      </p>
    </div>
  );
}
