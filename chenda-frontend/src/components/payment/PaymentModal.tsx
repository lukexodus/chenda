'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { PaymentMethodOption, PayOrderRequest } from '@/lib/types/order';
import { api } from '@/lib/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderIds: number[];
  paymentMethod: PaymentMethodOption;
  totalAmount: number;
  onSuccess?: (orderId: number) => void;
}

type PaymentState = 'idle' | 'processing' | 'action_required' | 'success' | 'error';

interface CheckoutAction {
  orderId: number;
  checkoutUrl: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  orderIds,
  paymentMethod,
  totalAmount,
  onSuccess,
}: PaymentModalProps) {
  const router = useRouter();
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [checkoutActions, setCheckoutActions] = useState<CheckoutAction[]>([]);

  // Auto-start payment when modal opens
  useEffect(() => {
    if (isOpen && paymentState === 'idle') {
      handlePayment();
    }
  }, [isOpen, paymentState]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setPaymentState('idle');
        setErrorMessage('');
        setTransactionId('');
        setCheckoutActions([]);
      }, 300); // Wait for modal close animation
    }
  }, [isOpen]);

  const buildIdempotencyKey = (orderId: number) => {
    const suffix = Math.random().toString(36).slice(2, 10);
    return `order-${orderId}-${Date.now()}-${suffix}`;
  };

  const buildRedirectUrls = (orderId: number) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    return {
      successRedirectUrl: `${origin}/orders/${orderId}`,
      failureRedirectUrl: `${origin}/buyer/orders?payment=failed&orderId=${orderId}`,
    };
  };

  const handlePayment = async () => {
    setPaymentState('processing');
    setErrorMessage('');

    try {
      const paymentData: PayOrderRequest = {
        payment_method: paymentMethod.id,
        payment_details: {},
      };

      // Process payment for each order sequentially
      let lastTransactionId = '';
      const nextCheckoutActions: CheckoutAction[] = [];

      for (const id of orderIds) {
        const { successRedirectUrl, failureRedirectUrl } = buildRedirectUrls(id);
        const response = await api.post(
          `/orders/${id}/payment`,
          {
            ...paymentData,
            success_redirect_url: successRedirectUrl,
            failure_redirect_url: failureRedirectUrl,
          },
          {
            headers: {
              'Idempotency-Key': buildIdempotencyKey(id),
            },
          }
        );

        if (!response.data.success) {
          throw new Error(response.data.message || 'Payment failed');
        }

        lastTransactionId =
          response.data.order?.transaction_id ??
          response.data.payment?.attempt?.payment_request_id ??
          response.data.payment?.attempt?.id ??
          '';

        const checkoutUrl = response.data.payment?.checkoutUrl;
        if (paymentMethod.id === 'gcash' && checkoutUrl) {
          nextCheckoutActions.push({
            orderId: id,
            checkoutUrl,
          });
        }
      }

      setTransactionId(lastTransactionId);

      if (paymentMethod.id === 'gcash') {
        if (nextCheckoutActions.length === 0) {
          throw new Error('No checkout URL returned for GCash payment.');
        }

        setCheckoutActions(nextCheckoutActions);
        setPaymentState('action_required');
        return;
      }

      setPaymentState('success');
      setTimeout(() => {
        onSuccess?.(orderIds[0]);
      }, 900);
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentState('error');
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          'Payment failed. Please try again.'
      );
    }
  };

  const handleRetry = () => {
    setCheckoutActions([]);
    setPaymentState('idle');
    handlePayment();
  };

  const handleContinueAfterCheckout = () => {
    onSuccess?.(orderIds[0]);
  };

  const handleViewOrder = () => {
    if (orderIds.length === 1) {
      router.push(`/orders/${orderIds[0]}`);
    } else {
      router.push('/buyer/orders');
    }
    onClose();
  };

  const handleClose = () => {
    if (paymentState === 'processing') return; // Prevent closing during processing
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {paymentState === 'processing' && 'Processing Payment'}
            {paymentState === 'action_required' && 'Complete Payment in GCash'}
            {paymentState === 'success' && 'Payment Successful!'}
            {paymentState === 'error' && 'Payment Failed'}
          </DialogTitle>
          <DialogDescription>
            {paymentState === 'processing' &&
              'Please wait while we process your payment...'}
            {paymentState === 'action_required' &&
              'Open the checkout page and complete payment to finalize your order.'}
            {paymentState === 'success' &&
              'Your order has been paid successfully.'}
            {paymentState === 'error' && 'There was an error processing your payment.'}
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-sm text-blue-800">
            Payments are now initiated through the backend production flow with idempotency protection.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          {/* Payment Method Display */}
          <div className="rounded-lg border bg-fresh-surface p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{paymentMethod.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-fresh-text-primary">
                  {paymentMethod.name}
                </p>
                <p className="text-sm text-fresh-text-muted">
                  {paymentMethod.description}
                </p>
              </div>
            </div>
          </div>

          {/* Amount Display */}
          <div className="flex items-center justify-between rounded-lg border bg-white p-4">
            <span className="text-fresh-text-muted">Total Amount:</span>
            <span className="text-2xl font-bold text-fresh-text-primary">
              ₱{totalAmount.toFixed(2)}
            </span>
          </div>

          {/* Payment State Display */}
          <div className="flex flex-col items-center justify-center py-6">
            {paymentState === 'processing' && (
              <div className="text-center">
                <Loader2 className="h-16 w-16 animate-spin text-fresh-primary mx-auto mb-4" />
                <p className="text-fresh-text-muted">
                  Processing payment via {paymentMethod.name}...
                </p>
                <p className="text-sm text-fresh-text-muted mt-2">
                  This may take a few moments.
                </p>
              </div>
            )}

            {paymentState === 'action_required' && (
              <div className="w-full space-y-3">
                {checkoutActions.map((action) => (
                  <Button
                    key={action.orderId}
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => window.open(action.checkoutUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <span>Open GCash Checkout for Order #{action.orderId}</span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                ))}
                <p className="text-xs text-fresh-text-muted text-center">
                  Complete payment in the opened tab, then return here.
                </p>
              </div>
            )}

            {paymentState === 'success' && (
              <div className="text-center">
                <CheckCircle2 className="h-16 w-16 text-fresh-primary mx-auto mb-4" />
                <p className="font-semibold text-fresh-text-primary mb-2">
                  Payment Completed!
                </p>
                {transactionId && (
                  <p className="text-sm text-fresh-text-muted">
                    Transaction ID: <span className="font-mono">{transactionId}</span>
                  </p>
                )}
              </div>
            )}

            {paymentState === 'error' && (
              <div className="text-center">
                <XCircle className="h-16 w-16 text-fresh-danger mx-auto mb-4" />
                <p className="font-semibold text-fresh-danger mb-2">
                  Payment Failed
                </p>
                {errorMessage && (
                  <p className="text-sm text-fresh-text-muted">{errorMessage}</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {paymentState === 'action_required' && (
              <>
                <Button onClick={handleContinueAfterCheckout} className="flex-1">
                  Continue to Orders
                </Button>
                <Button onClick={handleClose} variant="secondary" className="flex-1">
                  Close
                </Button>
              </>
            )}

            {paymentState === 'success' && (
              <>
                <Button onClick={handleViewOrder} className="flex-1">
                  {orderIds.length === 1 ? 'View Order' : 'View Orders'}
                </Button>
                <Button onClick={handleClose} variant="secondary" className="flex-1">
                  Close
                </Button>
              </>
            )}

            {paymentState === 'error' && (
              <>
                <Button onClick={handleRetry} className="flex-1">
                  Retry Payment
                </Button>
                <Button onClick={handleClose} variant="secondary" className="flex-1">
                  Cancel
                </Button>
              </>
            )}

            {paymentState === 'processing' && (
              <Button disabled className="w-full" variant="secondary">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
