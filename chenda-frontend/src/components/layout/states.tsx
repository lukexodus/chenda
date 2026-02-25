"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Package, SearchX, AlertTriangle, ShoppingBag, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Loading States ──

export function PageLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-[60vh] items-center justify-center"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--fresh-primary)] border-t-transparent" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Matches the real ProductCard shape: image + content rows */
export function ProductCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--fresh-border)] bg-white overflow-hidden">
      {/* Image area */}
      <Skeleton className="aspect-square w-full" />
      {/* Content */}
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-1/3 rounded-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-2/5" />
        {/* Freshness bar */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        {/* Distance + score row */}
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        {/* Button */}
        <Skeleton className="h-8 w-full mt-1" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading products"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading products…</span>
    </div>
  );
}

/** Generic form skeleton — rows of label + input */
export function FormSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading form" className="space-y-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 mt-2" />
      <span className="sr-only">Loading form…</span>
    </div>
  );
}

/** Map placeholder while Leaflet loads */
export function MapSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading map"
      className="relative w-full h-[200px] sm:h-[300px] rounded-[var(--radius-card)] overflow-hidden border border-[var(--fresh-border)]"
    >
      <Skeleton className="absolute inset-0 rounded-none" />
      <span className="sr-only">Loading map…</span>
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
    <div
      role="status"
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <Icon className="h-12 w-12 text-[var(--fresh-text-muted)]" aria-hidden="true" />
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
      title="No products found"
      description="Try adjusting your search radius, lowering the freshness threshold, or searching a different location."
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

export function PreSearchEmpty() {
  return (
    <EmptyState
      icon={Search}
      title="Find fresh products near you"
      description="Enter your location above and press Search to discover nearby fresh products ranked by proximity and freshness."
    />
  );
}

export function EmptyOrders({ onShop }: { onShop?: () => void }) {
  return (
    <EmptyState
      icon={ShoppingBag}
      title="No orders yet"
      description="Start shopping for fresh products from nearby sellers."
      action={
        onShop ? (
          <Button onClick={onShop}>Start Shopping</Button>
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
    <div
      role="alert"
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <AlertTriangle className="h-12 w-12 text-[var(--fresh-danger)]" aria-hidden="true" />
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

