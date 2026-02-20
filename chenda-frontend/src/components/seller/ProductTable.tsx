"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Calendar, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { SellerProduct } from "@/lib/types/seller";
import { cn } from "@/lib/utils";

interface ProductTableProps {
  products: SellerProduct[];
  onEdit: (product: SellerProduct) => void;
  onDelete: (product: SellerProduct) => void;
  isLoading?: boolean;
}

/**
 * Calculate freshness percentage from days used and total shelf life
 */
function calculateFreshness(daysUsed: number, totalDays: number): number {
  return Math.max(0, Math.min(100, ((totalDays - daysUsed) / totalDays) * 100));
}

/**
 * Calculate days remaining until expiration
 */
function calculateDaysRemaining(daysUsed: number, totalDays: number, listedDate: string): number {
  const daysPassedSinceListing = Math.floor(
    (Date.now() - new Date(listedDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalUsedDays = daysUsed + daysPassedSinceListing;
  return Math.max(0, totalDays - totalUsedDays);
}

/**
 * Get freshness color and label based on percentage
 */
function getFreshnessStatus(freshnessPercent: number) {
  if (freshnessPercent >= 70) {
    return {
      color: "text-green-600 bg-green-50 border-green-200",
      label: "Fresh",
    };
  } else if (freshnessPercent >= 30) {
    return {
      color: "text-yellow-600 bg-yellow-50 border-yellow-200",
      label: "Warning",
    };
  } else {
    return {
      color: "text-red-600 bg-red-50 border-red-200",
      label: "Critical",
    };
  }
}

export function ProductTable({ products, onEdit, onDelete, isLoading }: ProductTableProps) {
  const [sortBy, setSortBy] = useState<"name" | "freshness" | "price">("freshness");

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "freshness") {
      const aFreshness = calculateFreshness(a.days_already_used, a.total_shelf_life_days);
      const bFreshness = calculateFreshness(b.days_already_used, b.total_shelf_life_days);
      return aFreshness - bFreshness; // Ascending (critical first)
    } else {
      return a.price - b.price;
    }
  });

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center text-sm text-[var(--fresh-text-muted)]">
          Loading products...
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="flex flex-col items-center gap-2 p-8 text-center">
          <Package className="h-12 w-12 text-[var(--fresh-text-muted)]" />
          <p className="text-sm font-medium">No products listed</p>
          <p className="text-xs text-[var(--fresh-text-muted)]">
            Add your first product to start selling
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--fresh-text-muted)]">Sort by:</span>
        <Button
          variant={sortBy === "freshness" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortBy("freshness")}
        >
          Freshness
        </Button>
        <Button
          variant={sortBy === "name" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortBy("name")}
        >
          Name
        </Button>
        <Button
          variant={sortBy === "price" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortBy("price")}
        >
          Price
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Freshness</TableHead>
              <TableHead>Days Left</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.map((product) => {
              const freshnessPercent = calculateFreshness(
                product.days_already_used,
                product.total_shelf_life_days
              );
              const daysRemaining = calculateDaysRemaining(
                product.days_already_used,
                product.total_shelf_life_days,
                product.listed_date
              );
              const status = getFreshnessStatus(freshnessPercent);

              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      {product.name_subtitle && (
                        <div className="text-xs text-[var(--fresh-text-muted)]">
                          {product.name_subtitle}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>₱{product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    {product.quantity} {product.unit}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border", status.color)}>
                      {freshnessPercent.toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={cn(daysRemaining <= 3 && "text-red-600 font-medium")}>
                      {daysRemaining}d
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.status === "active" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(product)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(product)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-3 md:hidden">
        {sortedProducts.map((product) => {
          const freshnessPercent = calculateFreshness(
            product.days_already_used,
            product.total_shelf_life_days
          );
          const daysRemaining = calculateDaysRemaining(
            product.days_already_used,
            product.total_shelf_life_days,
            product.listed_date
          );
          const status = getFreshnessStatus(freshnessPercent);

          return (
            <div key={product.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium">{product.name}</h3>
                  {product.name_subtitle && (
                    <p className="text-xs text-[var(--fresh-text-muted)]">
                      {product.name_subtitle}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(product)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(product)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-[var(--fresh-text-muted)]">Price:</span>
                  <span className="ml-2 font-medium">₱{product.price.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[var(--fresh-text-muted)]">Stock:</span>
                  <span className="ml-2 font-medium">
                    {product.quantity} {product.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--fresh-text-muted)]">Freshness:</span>
                  <Badge className={cn("ml-2 border", status.color)}>
                    {freshnessPercent.toFixed(0)}%
                  </Badge>
                </div>
                <div>
                  <span className="text-[var(--fresh-text-muted)]">Days left:</span>
                  <span
                    className={cn(
                      "ml-2 font-medium",
                      daysRemaining <= 3 && "text-red-600"
                    )}
                  >
                    {daysRemaining}d
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <Badge
                  variant={product.status === "active" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {product.status}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
