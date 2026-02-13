"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/lib/store";

/**
 * Initializes auth state by checking the session on mount.
 * Wrap the app in this provider so every page has access to user state.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
