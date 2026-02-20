'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import OrderCard from '@/components/orders/OrderCard';
import OrderDetail from '@/components/orders/OrderDetail';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { Order, OrderStatus } from '@/lib/types/order';

export default function SellerOrdersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    // Filter orders when status filter changes
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((order) => order.status === statusFilter));
    }
  }, [statusFilter, orders]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/orders', {
        params: {
          role: 'seller',
          limit: 100,
        },
      });

      if (response.data.success) {
        // Sort orders by created_at descending (newest first)
        const sortedOrders = response.data.data.sort(
          (a: Order, b: Order) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(sortedOrders);
        setFilteredOrders(sortedOrders);
      } else {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error: any) {
      console.error('Fetch orders error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load orders',
        description:
          error.response?.data?.message || error.message || 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderClick = async (orderId: number) => {
    // Fetch full order details
    try {
      const response = await api.get(`/api/orders/${orderId}`);
      if (response.data.success) {
        setSelectedOrder(response.data.data);
        setShowDetailModal(true);
      }
    } catch (error: any) {
      console.error('Fetch order error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load order details',
        description: error.response?.data?.message || error.message,
      });
    }
  };

  const handleMarkAsCompleted = async (orderId: number) => {
    setIsUpdating(true);
    try {
      const response = await api.put(`/api/orders/${orderId}/status`, {
        status: 'completed',
        notes: 'Order has been fulfilled and delivered',
      });

      if (response.data.success) {
        toast({
          title: 'Order completed',
          description: 'The order has been marked as completed',
        });

        // Refresh orders
        await fetchOrders();

        // Update selected order if it's shown
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(response.data.data);
        }

        setShowDetailModal(false);
      } else {
        throw new Error(response.data.message || 'Failed to update order');
      }
    } catch (error: any) {
      console.error('Update order error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update order',
        description:
          error.response?.data?.message || error.message || 'Please try again.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Count orders by status
  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    paid: orders.filter((o) => o.status === 'paid').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  return (
    <>
      <div className="container max-w-6xl mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[var(--fresh-text-primary)]">
            Customer Orders
          </h1>
          <p className="text-[var(--fresh-text-muted)] mt-2">
            Manage orders for your products
          </p>
        </div>

        {/* Status Filter Tabs */}
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all')}
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
            <TabsTrigger value="paid">Paid ({statusCounts.paid})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({statusCounts.completed})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({statusCounts.cancelled})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--fresh-primary)]" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="h-16 w-16 text-[var(--fresh-text-muted)] mb-4" />
            <h3 className="text-lg font-semibold text-[var(--fresh-text-primary)] mb-2">
              {statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter} orders`}
            </h3>
            <p className="text-[var(--fresh-text-muted)] mb-4">
              {statusFilter === 'all'
                ? 'Orders for your products will appear here'
                : `You don't have any ${statusFilter} orders`}
            </p>
          </div>
        )}

        {/* Orders List */}
        {!isLoading && filteredOrders.length > 0 && (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} onClick={() => handleOrderClick(order.id)}>
                <OrderCard order={order} viewAs="seller" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Review order information and update status
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="py-4">
              <OrderDetail order={selectedOrder} viewAs="seller" />
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedOrder && selectedOrder.status === 'paid' && (
              <Button
                onClick={() => handleMarkAsCompleted(selectedOrder.id)}
                disabled={isUpdating}
                className="w-full sm:w-auto"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowDetailModal(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
