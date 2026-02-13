"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Package, SearchX, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Loading States ──

export function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--fresh-primary)] border-t-transparent" />
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-32 w-full rounded-[var(--radius-card)]" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ── Empty States ──

export function EmptyState({
  icon: Icon = Package,
  title = "Nothing here yet",
  description = "There are no items to display.",
  action,
}: {
  icon?: React.ElementType;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <Icon className="h-12 w-12 text-[var(--fresh-text-muted)]" />
      <h3 className="text-lg font-medium text-[var(--fresh-text-primary)]">
        {title}
      </h3>
      <p className="max-w-xs text-sm text-[var(--fresh-text-muted)]">
        {description}
      </p>
      {action}
    </div>
  );
}

export function NoResults({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      icon={SearchX}
      title="No results found"
      description="Try adjusting your search or filters."
      action={
        onReset ? (
          <Button variant="outline" onClick={onReset}>
            Reset Filters
          </Button>
        ) : undefined
      }
    />
  );
}

// ── Error States ──

export function ErrorState({
  message = "Something went wrong",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle className="h-12 w-12 text-[var(--fresh-danger)]" />
      <h3 className="text-lg font-medium text-[var(--fresh-text-primary)]">
        Oops!
      </h3>
      <p className="max-w-xs text-sm text-[var(--fresh-text-muted)]">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
