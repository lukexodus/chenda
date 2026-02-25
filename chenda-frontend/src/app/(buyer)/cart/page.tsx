'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CartSummary from '@/components/cart/CartSummary';
import { TopHeader, BottomNav } from '@/components/layout/navigation';
import { useCartStore } from '@/lib/stores/cartStore';

export default function CartPage() {
  const router = useRouter();
  const { items } = useCartStore();

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const handleContinueShopping = () => {
    router.push('/buyer');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--fresh-surface)]">
      <TopHeader />

      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
        <div className="container max-w-2xl mx-auto space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleContinueShopping}
            className="gap-2 -ml-2"
            aria-label="Continue shopping"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Continue Shopping
          </Button>

          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-bold text-[var(--fresh-text-primary)]">Shopping Cart</h1>
            <p className="text-[var(--fresh-text-muted)] mt-1">
              Review your items before checkout
            </p>
          </div>

          {/* Cart Summary Component */}
          <CartSummary
            showActions={true}
            showCheckoutButton={true}
            onCheckout={handleCheckout}
          />

          {/* Extra action if cart has items */}
          {items.length > 0 && (
            <div className="flex justify-start">
              <Button variant="outline" onClick={handleContinueShopping}>
                Add More Items
              </Button>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

