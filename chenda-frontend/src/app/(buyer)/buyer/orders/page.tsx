'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopHeader, BottomNav } from '@/components/layout/navigation';
import { EmptyOrders } from '@/components/layout/states';
import OrderCard from '@/components/orders/OrderCard';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Order, OrderStatus } from '@/lib/types/order';

export default function BuyerOrdersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((order) => order.status === statusFilter));
    }
  }, [statusFilter, orders]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/orders', {
        params: { role: 'buyer', limit: 100 },
      });
      if (response.data.success) {
        const sortedOrders = (response.data.orders ?? []).sort(
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

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    paid: orders.filter((o) => o.status === 'paid').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--fresh-surface)]">
      <TopHeader />

      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
        <div className="container max-w-6xl mx-auto space-y-6">
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
            <EmptyOrders
              onShop={statusFilter === 'all' ? () => router.push('/buyer') : undefined}
            />
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
      </main>

      <BottomNav />
    </div>
  );
}
