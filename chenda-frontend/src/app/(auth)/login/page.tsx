import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign In — Chenda" };

export default function LoginPage() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--fresh-border)] bg-white p-6 shadow-[var(--shadow-small)]">
      <h1 className="mb-6 text-center text-2xl font-semibold text-[var(--fresh-text-primary)]">
        Sign In
      </h1>
      {/* LoginForm component will go here in Task 2.2 */}
      <p className="text-center text-sm text-[var(--fresh-text-muted)]">
        Login form — coming in Task 2.2
      </p>
    </div>
  );
}
