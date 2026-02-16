"use client";

import { useState } from "react";
import Image from "next/image";
import {
  MapPin,
  Clock,
  Star,
  ShoppingCart,
  User,
  Phone,
  Mail,
  Package,
  X,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import type { Product } from "@/lib/stores/searchStore";
import { useCartStore } from "@/lib/stores/cartStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ProductMap } from "./ProductMap";
import { cn } from "@/lib/utils";

interface ProductDetailProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetail({
  product,
  open,
  onOpenChange,
}: ProductDetailProps) {
  const { addToCart, isInCart, getCartItem, updateQuantity } = useCartStore();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const inCart = isInCart(product.id);
  const cartItem = getCartItem(product.id);

  // Determine freshness color
  const getFreshnessColor = (score: number | undefined) => {
    if (!score) return "bg-gray-400";
    if (score >= 75) return "bg-[var(--fresh-primary)]";
    if (score >= 50) return "bg-[var(--fresh-warning)]";
    return "bg-[var(--fresh-danger)]";
  };

  // Format distance
  const formatDistance = (km: number | undefined) => {
    if (!km) return "N/A";
    if (km < 1) return `${(km * 1000).toFixed(0)}m away`;
    return `${km.toFixed(1)}km away`;
  };

  // Format expiration date
  const formatExpirationDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Handle add to cart
  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`${product.name} added to cart`, {
      description: `₱${product.price.toFixed(2)} × ${quantity}`,
    });
    setQuantity(1);
  };

  // Handle update quantity in cart
  const handleUpdateQuantity = (newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(product.id, newQuantity);
    toast.success("Cart updated", {
      description: `${product.name} quantity: ${newQuantity}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Product Details</span>
            {product.rank && product.rank <= 10 && (
              <Badge
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-bold text-white",
                  product.rank === 1 && "bg-yellow-500",
                  product.rank === 2 && "bg-gray-400",
                  product.rank === 3 && "bg-orange-600",
                  product.rank > 3 && "bg-blue-500"
                )}
              >
                Rank #{product.rank}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            View complete product information and add to cart
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Image & Map */}
          <div className="space-y-4">
            {/* Product Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--fresh-border)] bg-gray-100">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  <Package className="h-24 w-24" />
                </div>
              )}
            </div>

            {/* Map */}
            {product.latitude && product.longitude && (
              <div>
                <Label className="mb-2 block text-sm font-medium">
                  Product Location
                </Label>
                <ProductMap
                  latitude={product.latitude}
                  longitude={product.longitude}
                  productName={product.name}
                />
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-4">
            {/* Product Type */}
            {product.product_type_name && (
              <Badge variant="outline" className="text-sm">
                {product.product_type_name}
              </Badge>
            )}

            {/* Product Name */}
            <h2 className="text-2xl font-bold text-[var(--fresh-text-primary)]">
              {product.name}
            </h2>

            {/* Description */}
            {product.description && (
              <p className="text-[var(--fresh-text-secondary)]">
                {product.description}
              </p>
            )}

            <Separator />

            {/* Price & Availability */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold text-[var(--fresh-primary)]">
                  ₱{product.price.toFixed(2)}
                </span>
                <span className="text-[var(--fresh-text-muted)]">
                  per {product.unit}
                </span>
              </div>
              {product.quantity !== undefined && (
                <p className="text-sm text-[var(--fresh-text-muted)]">
                  Available: {product.quantity} {product.unit}
                  {product.quantity > 0 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Freshness Indicator */}
            {product.freshness_score !== undefined && (
              <div className="space-y-2 p-4 rounded-[var(--radius-card)] bg-[var(--fresh-surface)]">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Freshness Score
                  </Label>
                  <span className="text-xl font-bold">
                    {Math.round(product.freshness_score)}%
                  </span>
                </div>
                <Progress
                  value={product.freshness_score}
                  className={cn("h-3", getFreshnessColor(product.freshness_score))}
                />
                <div className="flex items-center justify-between text-sm text-[var(--fresh-text-muted)]">
                  <span className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    {product.days_remaining !== undefined &&
                      (product.days_remaining > 0
                        ? `${product.days_remaining} days remaining`
                        : "Expires soon")}
                  </span>
                  {product.expiration_date && (
                    <span>Expires: {formatExpirationDate(product.expiration_date)}</span>
                  )}
                </div>
              </div>
            )}

            {/* Algorithm Metrics */}
            <div className="grid grid-cols-2 gap-3">
              {product.distance_km !== undefined && (
                <div className="p-3 rounded-[var(--radius-card)] bg-[var(--fresh-surface)] flex items-center">
                  <MapPin className="h-5 w-5 text-[var(--fresh-primary)] mr-2" />
                  <div>
                    <p className="text-xs text-[var(--fresh-text-muted)]">Distance</p>
                    <p className="font-semibold">{formatDistance(product.distance_km)}</p>
                  </div>
                </div>
              )}
              {product.combined_score !== undefined && (
                <div className="p-3 rounded-[var(--radius-card)] bg-[var(--fresh-surface)] flex items-center">
                  <Star className="h-5 w-5 text-[var(--fresh-accent)] mr-2 fill-[var(--fresh-accent)]" />
                  <div>
                    <p className="text-xs text-[var(--fresh-text-muted)]">Score</p>
                    <p className="font-semibold">{Math.round(product.combined_score)}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Seller Information */}
            {product.seller_name && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Seller Information</Label>
                <div className="space-y-2 p-4 rounded-[var(--radius-card)] bg-[var(--fresh-surface)]">
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-[var(--fresh-text-muted)]" />
                    <span className="font-medium">{product.seller_name}</span>
                  </div>
                  {product.seller_phone && (
                    <div className="flex items-center text-sm text-[var(--fresh-text-secondary)]">
                      <Phone className="h-4 w-4 mr-2 text-[var(--fresh-text-muted)]" />
                      <span>{product.seller_phone}</span>
                    </div>
                  )}
                  {product.seller_email && (
                    <div className="flex items-center text-sm text-[var(--fresh-text-secondary)]">
                      <Mail className="h-4 w-4 mr-2 text-[var(--fresh-text-muted)]" />
                      <span>{product.seller_email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Add to Cart Controls */}
            <div className="space-y-3">
              {!inCart ? (
                <>
                  <div className="flex items-center space-x-3">
                    <Label htmlFor="quantity" className="text-sm font-medium whitespace-nowrap">
                      Quantity:
                    </Label>
                    <div className="flex items-center flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="mx-2 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleAddToCart}
                    className="w-full bg-[var(--fresh-accent)] hover:bg-[var(--fresh-accent)]/90 text-black"
                    size="lg"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to Cart - ₱{(product.price * quantity).toFixed(2)}
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-[var(--radius-card)] bg-[var(--fresh-primary)]/10 border border-[var(--fresh-primary)]">
                    <span className="text-sm font-medium text-[var(--fresh-primary)]">
                      Currently in cart: {cartItem?.quantity}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Label className="text-sm font-medium whitespace-nowrap">
                      Update:
                    </Label>
                    <div className="flex items-center flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleUpdateQuantity((cartItem?.quantity || 1) - 1)
                        }
                        disabled={(cartItem?.quantity || 1) <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={cartItem?.quantity || 1}
                        onChange={(e) =>
                          handleUpdateQuantity(parseInt(e.target.value) || 1)
                        }
                        className="mx-2 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleUpdateQuantity((cartItem?.quantity || 1) + 1)
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
