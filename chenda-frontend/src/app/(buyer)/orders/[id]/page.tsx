'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TopHeader, BottomNav } from '@/components/layout/navigation';
import OrderDetail from '@/components/orders/OrderDetail';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { Order } from '@/lib/types/order';

export default function OrderConfirmationPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/orders/${params.id}`);

      if (response.data.success) {
        setOrder(response.data.order ?? response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch order');
      }
    } catch (error: any) {
      console.error('Fetch order error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to load order details';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Failed to load order',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push('/buyer');
  };

  const handleViewOrders = () => {
    router.push('/buyer/orders');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--fresh-surface)]">
      <TopHeader />
      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
      <div className="container max-w-4xl mx-auto py-6 px-0 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewOrders}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--fresh-primary)]" />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="text-center py-12">
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchOrder}>Try Again</Button>
        </div>
      )}

      {/* Success State */}
      {!isLoading && !error && order && (
        <div className="space-y-6">
          {/* Success Banner (for paid orders) */}
          {order.status === 'paid' || order.status === 'completed' ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800 ml-2">
                <strong>Order Confirmed!</strong> Your payment has been received and your
                order is being processed.
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Order Details Component */}
          <OrderDetail order={order} viewAs="buyer" />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={handleBackToDashboard} className="flex-1">
              Back to Dashboard
            </Button>
            <Button onClick={handleViewOrders} variant="outline" className="flex-1">
              View All Orders
            </Button>
          </div>
        </div>
      )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
