"use client";

import { TrendingUp, Package, AlertTriangle, Star } from "lucide-react";
import type { SellerProduct } from "@/lib/types/seller";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color: string;
}

function MetricCard({ title, value, icon: Icon, trend, color }: MetricCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--fresh-text-muted)]">{title}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
          {trend && (
            <p className="mt-1 text-xs text-[var(--fresh-text-muted)]">{trend}</p>
          )}
        </div>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

interface SellerAnalyticsProps {
  products: SellerProduct[];
}

/**
 * Calculate freshness percentage
 */
function calculateFreshness(daysUsed: number, totalDays: number, listedDate: string): number {
  const daysPassedSinceListing = Math.floor(
    (Date.now() - new Date(listedDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalUsedDays = daysUsed + daysPassedSinceListing;
  const remainingDays = totalDays - totalUsedDays;
  return Math.max(0, Math.min(100, (remainingDays / totalDays) * 100));
}

/**
 * Calculate days remaining
 */
function calculateDaysRemaining(daysUsed: number, totalDays: number, listedDate: string): number {
  const daysPassedSinceListing = Math.floor(
    (Date.now() - new Date(listedDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalUsedDays = daysUsed + daysPassedSinceListing;
  return Math.max(0, totalDays - totalUsedDays);
}

export function SellerAnalytics({ products }: SellerAnalyticsProps) {
  // Calculate metrics
  const activeProducts = products.filter((p) => p.status === "active");
  const totalProducts = activeProducts.length;

  // Average freshness
  const avgFreshness =
    totalProducts > 0
      ? activeProducts.reduce((sum, p) => {
          return sum + calculateFreshness(p.days_already_used, p.total_shelf_life_days, p.listed_date);
        }, 0) / totalProducts
      : 0;

  // Products expiring within 3 days
  const expiringSoon = activeProducts.filter((p) => {
    const daysRemaining = calculateDaysRemaining(
      p.days_already_used,
      p.total_shelf_life_days,
      p.listed_date
    );
    return daysRemaining <= 3;
  }).length;

  // Most popular product types (by count)
  const productTypeCounts = activeProducts.reduce((acc, p) => {
    const typeName = p.name;
    acc[typeName] = (acc[typeName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topProductTypes = Object.entries(productTypeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Freshness status
  const getFreshnessStatus = () => {
    if (avgFreshness >= 70) return "Excellent";
    if (avgFreshness >= 50) return "Good";
    if (avgFreshness >= 30) return "Fair";
    return "Critical";
  };

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Listings"
          value={totalProducts}
          icon={Package}
          color="bg-blue-50 text-blue-600"
        />

        <MetricCard
          title="Average Freshness"
          value={`${avgFreshness.toFixed(1)}%`}
          icon={TrendingUp}
          trend={getFreshnessStatus()}
          color={
            avgFreshness >= 70
              ? "bg-green-50 text-green-600"
              : avgFreshness >= 30
              ? "bg-yellow-50 text-yellow-600"
              : "bg-red-50 text-red-600"
          }
        />

        <MetricCard
          title="Expiring Soon"
          value={expiringSoon}
          icon={AlertTriangle}
          trend="Within 3 days"
          color={
            expiringSoon === 0
              ? "bg-green-50 text-green-600"
              : "bg-orange-50 text-orange-600"
          }
        />

        <MetricCard
          title="Product Types"
          value={Object.keys(productTypeCounts).length}
          icon={Star}
          trend="Unique types"
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Top Product Types */}
      {topProductTypes.length > 0 && (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-semibold text-[var(--fresh-text-primary)]">
            Top Product Types
          </h3>
          <div className="mt-4 space-y-2">
            {topProductTypes.map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm">{type}</span>
                <span className="rounded-full bg-[var(--fresh-surface)] px-3 py-1 text-xs font-medium">
                  {count} {count === 1 ? "listing" : "listings"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Freshness Distribution */}
      {totalProducts > 0 && (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-semibold text-[var(--fresh-text-primary)]">
            Freshness Distribution
          </h3>
          <div className="mt-4 space-y-2">
            {[
              { label: "Fresh (≥70%)", color: "bg-green-500", range: [70, 100] },
              { label: "Good (50-70%)", color: "bg-yellow-500", range: [50, 70] },
              { label: "Warning (30-50%)", color: "bg-orange-500", range: [30, 50] },
              { label: "Critical (<30%)", color: "bg-red-500", range: [0, 30] },
            ].map(({ label, color, range }) => {
              const count = activeProducts.filter((p) => {
                const freshness = calculateFreshness(
                  p.days_already_used,
                  p.total_shelf_life_days,
                  p.listed_date
                );
                return freshness >= range[0] && freshness < range[1];
              }).length;

              const percentage = totalProducts > 0 ? (count / totalProducts) * 100 : 0;

              return (
                <div key={label}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{label}</span>
                    <span className="font-medium">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-gray-100">
                    <div
                      className={`h-2 rounded-full ${color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalProducts === 0 && (
        <div className="rounded-lg border bg-white p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-[var(--fresh-text-muted)]" />
          <p className="mt-4 font-medium">No analytics available</p>
          <p className="mt-1 text-sm text-[var(--fresh-text-muted)]">
            Add products to see analytics
          </p>
        </div>
      )}
    </div>
  );
}
