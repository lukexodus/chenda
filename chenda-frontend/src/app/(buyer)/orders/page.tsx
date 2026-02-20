'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrderCard from '@/components/orders/OrderCard';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { Order, OrderStatus } from '@/lib/types/order';

export default function BuyerOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

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
          role: 'buyer',
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
          error.response?.data?.message ||
          error.message ||
          'Please try again later.',
      });
    } finally {
      setIsLoading(false);
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
    <div className="container max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--fresh-text-primary)]">My Orders</h1>
        <p className="text-[var(--fresh-text-muted)] mt-2">
          View and track your order history
        </p>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all')}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="paid">
            Paid ({statusCounts.paid})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({statusCounts.completed})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({statusCounts.cancelled})
          </TabsTrigger>
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
            {statusFilter === 'all'
              ? 'No orders yet'
              : `No ${statusFilter} orders`}
          </h3>
          <p className="text-[var(--fresh-text-muted)] mb-4">
            {statusFilter === 'all'
              ? 'Start shopping for fresh products from nearby sellers'
              : `You don't have any ${statusFilter} orders`}
          </p>
          {statusFilter === 'all' && (
            <Button onClick={() => (window.location.href = '/')}>
              Start Shopping
            </Button>
          )}
        </div>
      )}

      {/* Orders List */}
      {!isLoading && filteredOrders.length > 0 && (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} viewAs="buyer" />
          ))}
        </div>
      )}
    </div>
  );
}
