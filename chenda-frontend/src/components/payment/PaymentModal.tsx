'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { PaymentMethod, PaymentMethodOption, PayOrderRequest } from '@/lib/types/order';
import { api } from '@/lib/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  paymentMethod: PaymentMethodOption;
  totalAmount: number;
  onSuccess?: (orderId: number) => void;
}

type PaymentState = 'idle' | 'processing' | 'success' | 'error';

export default function PaymentModal({
  isOpen,
  onClose,
  orderId,
  paymentMethod,
  totalAmount,
  onSuccess,
}: PaymentModalProps) {
  const router = useRouter();
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');

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
      }, 300); // Wait for modal close animation
    }
  }, [isOpen]);

  const handlePayment = async () => {
    setPaymentState('processing');
    setErrorMessage('');

    try {
      // Mock 2-second delay for payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Call backend API to process mock payment
      const paymentData: PayOrderRequest = {
        payment_method: paymentMethod.id,
        payment_details: {},
      };

      const response = await api.post(`/api/orders/${orderId}/payment`, paymentData);

      if (response.data.success) {
        setTransactionId(response.data.data.transaction_id);
        setPaymentState('success');

        // Call success callback after 1 second
        setTimeout(() => {
          onSuccess?.(orderId);
        }, 1000);
      } else {
        throw new Error(response.data.message || 'Payment failed');
      }
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
    setPaymentState('idle');
    handlePayment();
  };

  const handleViewOrder = () => {
    router.push(`/orders/${orderId}`);
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
            {paymentState === 'success' && 'Payment Successful!'}
            {paymentState === 'error' && 'Payment Failed'}
          </DialogTitle>
          <DialogDescription>
            {paymentState === 'processing' &&
              'Please wait while we process your payment...'}
            {paymentState === 'success' &&
              'Your order has been paid successfully.'}
            {paymentState === 'error' && 'There was an error processing your payment.'}
          </DialogDescription>
        </DialogHeader>

        {/* Mock Payment Warning Banner */}
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-sm text-orange-800">
            <strong>⚠️ This is a mock payment system.</strong> No real transactions
            occur. This is for demonstration purposes only.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          {/* Payment Method Display */}
          <div className="rounded-lg border bg-[var(--fresh-surface)] p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{paymentMethod.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-[var(--fresh-text-primary)]">
                  {paymentMethod.name}
                </p>
                <p className="text-sm text-[var(--fresh-text-muted)]">
                  {paymentMethod.description}
                </p>
              </div>
            </div>
          </div>

          {/* Amount Display */}
          <div className="flex items-center justify-between rounded-lg border bg-white p-4">
            <span className="text-[var(--fresh-text-muted)]">Total Amount:</span>
            <span className="text-2xl font-bold text-[var(--fresh-text-primary)]">
              ₱{totalAmount.toFixed(2)}
            </span>
          </div>

          {/* Payment State Display */}
          <div className="flex flex-col items-center justify-center py-6">
            {paymentState === 'processing' && (
              <div className="text-center">
                <Loader2 className="h-16 w-16 animate-spin text-[var(--fresh-primary)] mx-auto mb-4" />
                <p className="text-[var(--fresh-text-muted)]">
                  Processing payment via {paymentMethod.name}...
                </p>
                <p className="text-sm text-[var(--fresh-text-muted)] mt-2">
                  This may take a few moments
                </p>
              </div>
            )}

            {paymentState === 'success' && (
              <div className="text-center">
                <CheckCircle2 className="h-16 w-16 text-[var(--fresh-primary)] mx-auto mb-4" />
                <p className="font-semibold text-[var(--fresh-text-primary)] mb-2">
                  Payment Completed!
                </p>
                {transactionId && (
                  <p className="text-sm text-[var(--fresh-text-muted)]">
                    Transaction ID: <span className="font-mono">{transactionId}</span>
                  </p>
                )}
              </div>
            )}

            {paymentState === 'error' && (
              <div className="text-center">
                <XCircle className="h-16 w-16 text-[var(--fresh-danger)] mx-auto mb-4" />
                <p className="font-semibold text-[var(--fresh-danger)] mb-2">
                  Payment Failed
                </p>
                {errorMessage && (
                  <p className="text-sm text-[var(--fresh-text-muted)]">{errorMessage}</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {paymentState === 'success' && (
              <>
                <Button onClick={handleViewOrder} className="flex-1">
                  View Order
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
