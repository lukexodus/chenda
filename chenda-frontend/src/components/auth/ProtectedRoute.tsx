"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredType?: "buyer" | "seller" | "both";
  allowedTypes?: Array<"buyer" | "seller" | "both">;
}

/**
 * Wrapper component for protected routes.
 * - Redirects to /login if not authenticated
 * - Optionally checks user type/role
 * - Shows loading state while checking auth
 */
export function ProtectedRoute({
  children,
  requiredType,
  allowedTypes,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    // Still loading auth state
    if (loading) return;

    // Not authenticated - redirect to login
    if (!user) {
      router.push("/login");
      return;
    }

    // Check required type if specified
    if (requiredType && user.type !== requiredType && user.type !== "both") {
      // User doesn't have required type - redirect to appropriate dashboard
      if (user.type === "buyer") {
        router.push("/buyer");
      } else if (user.type === "seller") {
        router.push("/seller/dashboard");
      }
      return;
    }

    // Check allowed types if specified
    if (allowedTypes && allowedTypes.length > 0) {
      const hasAccess =
        allowedTypes.includes(user.type) || user.type === "both";
      if (!hasAccess) {
        // User doesn't have access - redirect to appropriate dashboard
        if (user.type === "buyer") {
          router.push("/buyer");
        } else if (user.type === "seller") {
          router.push("/seller/dashboard");
        } else {
          router.push("/");
        }
      }
    }
  }, [user, loading, requiredType, allowedTypes, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--fresh-primary)]" />
          <p className="mt-4 text-sm text-[var(--fresh-text-muted)]">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated - don't render children (redirect will happen)
  if (!user) {
    return null;
  }

  // Check type restrictions
  if (requiredType && user.type !== requiredType && user.type !== "both") {
    return null;
  }

  if (allowedTypes && allowedTypes.length > 0) {
    const hasAccess = allowedTypes.includes(user.type) || user.type === "both";
    if (!hasAccess) {
      return null;
    }
  }

  // Authenticated and authorized - render children
  return <>{children}</>;
}

/**
 * Hook to check if user is authenticated (for use in components)
 */
export function useRequireAuth(redirectTo = "/login") {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  return { user, loading };
}

/**
 * Hook to check user type (for conditional rendering)
 */
export function useUserType() {
  const user = useAuthStore((s) => s.user);

  return {
    isBuyer: user?.type === "buyer" || user?.type === "both",
    isSeller: user?.type === "seller" || user?.type === "both",
    type: user?.type,
  };
}
