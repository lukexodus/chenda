"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SearchPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main dashboard where search functionality exists
    router.replace("/");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[var(--fresh-primary)]" />
        <p className="text-sm text-[var(--fresh-text-muted)]">
          Redirecting to search...
        </p>
      </div>
    </div>
  );
}
