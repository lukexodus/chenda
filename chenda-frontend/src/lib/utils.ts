import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Philippine Peso
 */
export function formatCurrency(
  amount: number,
  includeSymbol: boolean = true
): string {
  const formatted = amount.toFixed(2);
  return includeSymbol ? `₱${formatted}` : formatted;
}

/**
 * Get freshness status color based on score
 */
export function getFreshnessColor(score: number): string {
  if (score >= 70) return "text-fresh-primary";
  if (score >= 40) return "text-fresh-warning";
  return "text-fresh-danger";
}

/**
 * Get freshness badge variant based on score
 */
export function getFreshnessBadgeVariant(
  score: number
): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 70) return "default";
  if (score >= 40) return "secondary";
  return "destructive";
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

/**
 * Format relative time (e.g., "2 days left")
 */
export function formatDaysLeft(days: number): string {
  if (days <= 0) return "Expired";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}
