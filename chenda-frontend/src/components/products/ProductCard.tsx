"use client";

import Image from "next/image";
import { MapPin, Clock, Star, ShoppingCart, Check, Package } from "lucide-react";
import { toast } from "sonner";

import type { Product } from "@/lib/stores/searchStore";
import { useCartStore } from "@/lib/stores/cartStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
}

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const { addToCart, isInCart } = useCartStore();
  const inCart = isInCart(product.id);

  // Determine freshness color
  const getFreshnessColor = (score: number | undefined) => {
    if (!score) return "bg-gray-400";
    if (score >= 75) return "bg-[var(--fresh-primary)]";
    if (score >= 50) return "bg-[var(--fresh-warning)]";
    return "bg-[var(--fresh-danger)]";
  };

  // Handle add to cart
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    addToCart(product);
    toast.success(`${product.name} added to cart`, {
      description: `₱${product.price.toFixed(2)} × 1`,
    });
  };

  // Format distance
  const formatDistance = (km: number | undefined) => {
    if (!km) return "N/A";
    if (km < 1) return `${(km * 1000).toFixed(0)}m`;
    return `${km.toFixed(1)}km`;
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--fresh-border)] bg-white shadow-[var(--shadow-small)] transition-all hover:shadow-[var(--shadow-medium)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fresh-primary)]",
        inCart && "ring-2 ring-[var(--fresh-primary)]"
      )}
      onClick={() => onViewDetails?.(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewDetails?.(product); } }}
      aria-label={`View details for ${product.name}`}
    >
      {/* Rank Badge - Top Left */}
      {product.rank && product.rank <= 10 && (
        <div className="absolute left-2 top-2 z-10">
          <Badge
            className={cn(
              "rounded-full px-2 py-1 text-xs font-bold text-white shadow-md",
              product.rank === 1 && "bg-yellow-500",
              product.rank === 2 && "bg-gray-400",
              product.rank === 3 && "bg-orange-600",
              product.rank > 3 && "bg-blue-500"
            )}
          >
            #{product.rank}
          </Badge>
        </div>
      )}

      {/* In Cart Indicator - Top Right */}
      {inCart && (
        <div className="absolute right-2 top-2 z-10">
          <Badge className="rounded-full bg-[var(--fresh-primary)] px-2 py-1 text-white shadow-md">
            <Check className="h-3 w-3" />
          </Badge>
        </div>
      )}

      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <Package className="h-16 w-16" />
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3 space-y-2">
        {/* Product Type Badge */}
        {product.product_type_name && (
          <Badge variant="outline" className="text-xs">
            {product.product_type_name}
          </Badge>
        )}

        {/* Product Name */}
        <h3 className="font-medium text-[var(--fresh-text-primary)] line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Price */}
        <p className="text-lg font-semibold text-[var(--fresh-primary)]">
          ₱{product.price.toFixed(2)}
          <span className="text-xs text-[var(--fresh-text-muted)] font-normal ml-1">
            / {product.unit}
          </span>
        </p>

        {/* Freshness Indicator */}
        {product.freshness_score !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--fresh-text-muted)]">Freshness</span>
              <span className="font-medium">
                {Math.round(product.freshness_score)}%
              </span>
            </div>
            <Progress
              value={product.freshness_score}
              className={cn("h-2", getFreshnessColor(product.freshness_score))}
            />
            {product.days_remaining !== undefined && (
              <p className="text-xs text-[var(--fresh-text-muted)]">
                <Clock className="inline h-3 w-3 mr-1" />
                {product.days_remaining > 0
                  ? `${product.days_remaining} days left`
                  : "Expires soon"}
              </p>
            )}
          </div>
        )}

        {/* Distance & Score */}
        <div className="flex items-center justify-between text-xs text-[var(--fresh-text-muted)]">
          {product.distance_km !== undefined && (
            <span className="flex items-center">
              <MapPin className="mr-1 h-3 w-3" />
              {formatDistance(product.distance_km)}
            </span>
          )}
          {product.combined_score !== undefined && (
            <span className="flex items-center font-medium">
              <Star className="mr-1 h-3 w-3 fill-[var(--fresh-accent)] text-[var(--fresh-accent)]" />
              {Math.round(product.combined_score)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          className={cn(
            "w-full mt-2",
            inCart
              ? "bg-[var(--fresh-primary)] hover:bg-[var(--fresh-primary)]/90"
              : "bg-[var(--fresh-accent)] hover:bg-[var(--fresh-accent)]/90 text-black"
          )}
          size="sm"
          aria-label={inCart ? `${product.name} is in cart` : `Add ${product.name} to cart`}
        >
          {inCart ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              In Cart
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
