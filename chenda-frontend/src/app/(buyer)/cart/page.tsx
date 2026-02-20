'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CartSummary from '@/components/cart/CartSummary';
import { useCartStore } from '@/lib/stores/cartStore';

export default function CartPage() {
  const router = useRouter();
  const { items } = useCartStore();

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const handleContinueShopping = () => {
    router.push('/');
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleContinueShopping}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Button>
      </div>

      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-[var(--fresh-text-primary)]">Shopping Cart</h1>
          <p className="text-[var(--fresh-text-muted)] mt-2">
            Review your items before checkout
          </p>
        </div>

        {/* Cart Summary Component */}
        <CartSummary 
          showActions={true} 
          showCheckoutButton={true}
          onCheckout={handleCheckout}
        />

        {/* Additional Actions (if cart has items) */}
        {items.length > 0 && (
          <div className="flex justify-between items-center pt-4">
            <Button 
              variant="outline" 
              onClick={handleContinueShopping}
            >
              Add More Items
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
