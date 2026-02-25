"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { onAuthFailure } from "@/lib/api";

/**
 * Initializes auth state by checking the session on mount.
 * Also subscribes to 401 events from the Axios interceptor and
 * redirects to /login via Next.js router (no full page reload).
 * Wrap the app in this provider so every page has access to user state.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const unsubscribe = onAuthFailure(() => {
      logout();
      router.push("/login");
    });
    return () => { unsubscribe(); };
  }, [logout, router]);

  return <>{children}</>;
}
