'use client';

import Image from 'next/image';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/lib/stores/cartStore';

interface CartSummaryProps {
  showActions?: boolean;
  showCheckoutButton?: boolean;
  onCheckout?: () => void;
}

export default function CartSummary({
  showActions = true,
  showCheckoutButton = true,
  onCheckout,
}: CartSummaryProps) {
  const { items, updateQuantity, removeFromCart, getTotalPrice, getTotalItems } = useCartStore();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ShoppingBag className="h-16 w-16 text-[var(--fresh-text-muted)] mb-4" />
          <p className="text-lg font-medium text-[var(--fresh-text-primary)] mb-2">
            Your cart is empty
          </p>
          <p className="text-sm text-[var(--fresh-text-muted)] text-center">
            Add fresh products from nearby sellers to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Cart Summary</span>
          <Badge variant="secondary">{totalItems} {totalItems === 1 ? 'item' : 'items'}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.product.id} className="flex gap-4">
            {/* Product Image */}
            <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--fresh-surface)]">
              {item.product.image_url ? (
                <Image
                  src={item.product.image_url}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-[var(--fresh-text-muted)]" />
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-[var(--fresh-text-primary)] truncate">
                {item.product.name}
              </h4>
              <p className="text-sm text-[var(--fresh-text-muted)]">
                ₱{item.product.price.toFixed(2)} per {item.product.unit}
              </p>

              {/* Quantity Controls (if actions enabled) */}
              {showActions && (
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="h-7 w-7 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.quantity}
                    className="h-7 w-7 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Static quantity display (if no actions) */}
              {!showActions && (
                <p className="text-sm text-[var(--fresh-text-muted)] mt-1">
                  Quantity: {item.quantity} {item.product.unit}
                </p>
              )}
            </div>

            {/* Price & Remove Button */}
            <div className="flex flex-col items-end justify-between">
              <p className="font-semibold text-[var(--fresh-text-primary)]">
                ₱{(item.product.price * item.quantity).toFixed(2)}
              </p>
              {showActions && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-[var(--fresh-danger)] hover:text-[var(--fresh-danger)] hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>

      <Separator />

      <CardFooter className="flex flex-col gap-4 pt-6">
        {/* Subtotal */}
        <div className="flex items-center justify-between w-full">
          <span className="text-[var(--fresh-text-muted)]">Subtotal</span>
          <span className="font-medium text-[var(--fresh-text-primary)]">
            ₱{totalPrice.toFixed(2)}
          </span>
        </div>

        {/* Delivery Fee (Mock - Free) */}
        <div className="flex items-center justify-between w-full">
          <span className="text-[var(--fresh-text-muted)]">Delivery Fee</span>
          <span className="font-medium text-[var(--fresh-primary)]">FREE</span>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between w-full">
          <span className="text-lg font-semibold text-[var(--fresh-text-primary)]">Total</span>
          <span className="text-2xl font-bold text-[var(--fresh-text-primary)]">
            ₱{totalPrice.toFixed(2)}
          </span>
        </div>

        {/* Checkout Button */}
        {showCheckoutButton && onCheckout && (
          <Button onClick={onCheckout} className="w-full" size="lg">
            Proceed to Checkout
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
