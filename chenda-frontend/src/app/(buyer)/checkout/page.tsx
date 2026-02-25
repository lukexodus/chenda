'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import CartSummary from '@/components/cart/CartSummary';
import PaymentModal from '@/components/payment/PaymentModal';
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
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);

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
          <Loader2 className="h-8 w-8 animate-spin text-[var(--fresh-primary)]" />
        </div>
      </div>
    );
  }

  const selectedMethodOption = PAYMENT_METHODS.find(
    (m) => m.id === selectedPaymentMethod
  )!;

  const handlePlaceOrder = async () => {
    // Validate delivery address
    if (!user.address || !user.lat || !user.lng) {
      toast({
        variant: 'destructive',
        title: 'Delivery address required',
        description: 'Please update your profile with a delivery address',
      });
      return;
    }

    // For MVP, we only support single product orders
    // Backend expects one product per order
    if (items.length > 1) {
      toast({
        variant: 'destructive',
        title: 'Multiple products not supported',
        description: 'Please order one product at a time in this demo version',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const item = items[0];

      // Create order
      const orderData = {
        product_id: item.product.id,
        quantity: item.quantity,
        delivery_address: user.address,
        delivery_lat: user.lat,
        delivery_lng: user.lng,
        delivery_notes: deliveryNotes.trim() || undefined,
      };

      const response = await api.post('/orders', orderData);

      if (response.data.success) {
        const orderId = response.data.data.id;
        setCurrentOrderId(orderId);

        // Show payment modal
        setShowPaymentModal(true);
      } else {
        throw new Error(response.data.message || 'Failed to create order');
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
    // Clear cart
    clearCart();

    // Close payment modal
    setShowPaymentModal(false);
    setIsSubmitting(false);

    // Show success toast
    toast({
      title: 'Order placed successfully!',
      description: 'Redirecting to order details...',
    });

    // Redirect to order confirmation page
    setTimeout(() => {
      router.push(`/orders/${orderId}`);
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
            <h1 className="text-3xl font-bold text-[var(--fresh-text-primary)]">Checkout</h1>
            <p className="text-[var(--fresh-text-muted)] mt-2">
              Review your order and complete payment
            </p>
          </div>

          {/* Mock Payment Warning */}
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-sm text-orange-800">
              <strong>⚠️ This is a mock payment system.</strong> No real transactions
              occur. This is for demonstration purposes only. All payments are simulated.
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
                  <div className="rounded-lg border bg-[var(--fresh-surface)] p-4">
                    <p className="font-medium text-[var(--fresh-text-primary)] mb-1">
                      {user.name}
                    </p>
                    <p className="text-sm text-[var(--fresh-text-muted)]">{user.address}</p>
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
                    onClick={() => router.push('/profile')}
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
                    onValueChange={(value) => setSelectedPaymentMethod(value as PaymentMethod)}
                    disabled={isSubmitting}
                  >
                    <div className="space-y-3">
                      {PAYMENT_METHODS.map((method) => (
                        <div
                          key={method.id}
                          className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-[var(--fresh-surface)] transition-colors cursor-pointer"
                        >
                          <RadioGroupItem value={method.id} id={method.id} />
                          <Label
                            htmlFor={method.id}
                            className="flex-1 cursor-pointer flex items-start gap-3"
                          >
                            <span className="text-2xl">{method.icon}</span>
                            <div className="flex-1">
                              <p className="font-medium text-[var(--fresh-text-primary)]">
                                {method.name}
                              </p>
                              <p className="text-sm text-[var(--fresh-text-muted)]">
                                {method.description}
                              </p>
                              <div className="flex gap-4 mt-1">
                                <p className="text-xs text-[var(--fresh-text-muted)]">
                                  Fee: {method.fee}
                                </p>
                                <p className="text-xs text-[var(--fresh-text-muted)]">
                                  Time: {method.processing_time}
                                </p>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
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
      {showPaymentModal && currentOrderId && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentClose}
          orderId={currentOrderId}
          paymentMethod={selectedMethodOption}
          totalAmount={getTotalPrice()}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
