import type { ReactNode } from "react";

/**
 * Auth route group layout — centered card layout, no nav bars.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--fresh-surface)] px-4 py-8">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
