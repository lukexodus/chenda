'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import CartSummary from '@/components/cart/CartSummary';
import dynamic from 'next/dynamic';

// Lazy load PaymentModal — it is only rendered when the user submits the order,
// so there is no benefit in including it in the initial checkout bundle.
const PaymentModal = dynamic(() => import('@/components/payment/PaymentModal'), {
  ssr: false,
});
import { useCartStore } from '@/lib/stores/cartStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { api } from '@/lib/api';
import {
  PAYMENT_METHODS,
  type PaymentMethod,
  type PaymentMethodOption
} from '@/lib/types/order';

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { items, clearCart, getTotalPrice } = useCartStore();
  const { user } = useAuthStore();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrderIds, setCurrentOrderIds] = useState<number[]>([]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items, router]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user || items.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-fresh-primary" />
        </div>
      </div>
    );
  }

  const selectedMethodOption = PAYMENT_METHODS.find(
    (m) => m.id === selectedPaymentMethod
  )!;

  const handlePaymentMethodChange = (value: string) => {
    const method = PAYMENT_METHODS.find((m) => m.id === value);
    if (!method || method.disabled) {
      return;
    }
    setSelectedPaymentMethod(value as PaymentMethod);
  };

  const handlePlaceOrder = async () => {
    // Validate delivery address — only the text address is required;
    // the backend derives the address from the buyer's profile row directly
    // and does not use lat/lng from the request body.
    if (!user.address) {
      toast({
        variant: 'destructive',
        title: 'Delivery address required',
        description: 'Please update your profile with a delivery address',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/orders/batch', {
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        payment_method: selectedPaymentMethod,
        delivery_address: user.address,
        delivery_lat: user.location?.lat,
        delivery_lng: user.location?.lng,
        delivery_notes: deliveryNotes.trim() || undefined,
      });

      if (response.data.success) {
        const orderIds = (response.data.orders as { id: number }[]).map((o) => o.id);
        setCurrentOrderIds(orderIds);
        setShowPaymentModal(true);
      } else {
        throw new Error(response.data.message || 'Failed to create orders');
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      toast({
        variant: 'destructive',
        title: 'Order failed',
        description:
          error.response?.data?.message ||
          error.message ||
          'Failed to create order. Please try again.',
      });
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = (orderId: number) => {
    clearCart();
    setShowPaymentModal(false);
    setIsSubmitting(false);

    toast({
      title: currentOrderIds.length > 1 ? 'Orders placed successfully!' : 'Order placed successfully!',
      description: 'Redirecting to your orders...',
    });

    setTimeout(() => {
      if (currentOrderIds.length > 1) {
        router.push('/buyer/orders');
      } else {
        router.push(`/orders/${orderId}`);
      }
    }, 1000);
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    setIsSubmitting(false);
  };

  return (
    <>
      <div className="container max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/cart')}
            className="gap-2"
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Button>
        </div>

        <div className="space-y-6">
          {/* Page Title */}
          <div>
            <h1 className="text-3xl font-bold text-fresh-text-primary">Checkout</h1>
            <p className="text-fresh-text-muted mt-2">
              Review your order and complete payment
            </p>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-sm text-blue-800">
              Cash on Delivery is currently the only available payment option. GCash is temporarily unavailable.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Delivery & Payment */}
            <div className="space-y-6">
              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border bg-fresh-surface p-4">
                    <p className="text-sm text-fresh-text-muted">
                      {user.address || 'No address set — please update your profile'}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="delivery-notes">Delivery Notes (Optional)</Label>
                    <Textarea
                      id="delivery-notes"
                      placeholder="Add any special instructions for delivery..."
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      rows={3}
                      className="mt-2"
                      disabled={isSubmitting}
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/buyer/profile')}
                    disabled={isSubmitting}
                  >
                    Change Address
                  </Button>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={selectedPaymentMethod}
                    onValueChange={handlePaymentMethodChange}
                    disabled={isSubmitting}
                  >
                    <div className="space-y-3">
                      {PAYMENT_METHODS.map((method) => {
                        const isDisabled = isSubmitting || Boolean(method.disabled);

                        return (
                        <div
                          key={method.id}
                          className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
                            isDisabled
                              ? 'opacity-45 cursor-not-allowed pointer-events-none'
                              : 'hover:bg-fresh-surface cursor-pointer'
                          }`}
                        >
                          <RadioGroupItem value={method.id} id={method.id} disabled={isDisabled} />
                          <Label
                            htmlFor={method.id}
                            className={`flex-1 flex items-start gap-3 ${
                              isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          >
                            <span className="text-2xl">{method.icon}</span>
                            <div className="flex-1">
                              <p className="font-medium text-fresh-text-primary flex items-center gap-2">
                                {method.name}
                                {method.disabled && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-fresh-text-muted text-fresh-text-muted uppercase tracking-wide">
                                    Disabled
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-fresh-text-muted">
                                {method.description}
                              </p>
                              {method.disabledReason && (
                                <p className="text-xs text-fresh-text-muted mt-1">
                                  {method.disabledReason}
                                </p>
                              )}
                              <div className="flex gap-4 mt-1">
                                <p className="text-xs text-fresh-text-muted">
                                  Fee: {method.fee}
                                </p>
                                <p className="text-xs text-fresh-text-muted">
                                  Time: {method.processing_time}
                                </p>
                              </div>
                            </div>
                          </Label>
                        </div>
                        );
                      })}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Order Summary */}
            <div className="space-y-6">
              <CartSummary
                showActions={false}
                showCheckoutButton={false}
              />

              {/* Place Order Button */}
              <Button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Place Order (₱${getTotalPrice().toFixed(2)})`
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && currentOrderIds.length > 0 && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentClose}
          orderIds={currentOrderIds}
          paymentMethod={selectedMethodOption}
          totalAmount={getTotalPrice()}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
