'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Loader2, CheckCircle2, RotateCw, BadgeDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import OrderCard from '@/components/orders/OrderCard';
import dynamic from 'next/dynamic';

// Lazy load OrderDetail — the full detail modal is only opened on demand, so
// defer loading its code until the user actually clicks an order row.
const OrderDetail = dynamic(() => import('@/components/orders/OrderDetail'), {
  ssr: false,
});
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import type { Order, OrderStatus } from '@/lib/types/order';

interface RiderOption {
  id: number;
  name: string;
  email: string;
  is_available: boolean;
  active_deliveries: number;
}

interface DeliveryTrackingSnapshot {
  delivery: {
    id: number;
    status: string;
    fulfillment_type: string;
    assigned_rider_name?: string;
    eta_at?: string;
    third_party_provider?: string;
    third_party_tracking_ref?: string;
    delivered_at?: string;
    failed_at?: string;
    failure_reason?: string;
  };
  events: Array<{
    event_type: string;
    event_note?: string;
    created_at: string;
  }>;
}

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
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('requested_by_seller');
  const [isReconciling, setIsReconciling] = useState(false);
  const [riders, setRiders] = useState<RiderOption[]>([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [dispatchEta, setDispatchEta] = useState('');
  const [thirdPartyProvider, setThirdPartyProvider] = useState('');
  const [thirdPartyTrackingRef, setThirdPartyTrackingRef] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [deliveryTracking, setDeliveryTracking] = useState<DeliveryTrackingSnapshot | null>(null);
  const [deliveryTrackingLoading, setDeliveryTrackingLoading] = useState(false);

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

  useEffect(() => {
    if (!showDetailModal || !selectedOrder) {
      setDeliveryTracking(null);
      return;
    }

    fetchAvailableRiders();
    fetchDeliveryTracking(selectedOrder.id);
  }, [showDetailModal, selectedOrder?.id]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/orders', {
        params: {
          role: 'seller',
          limit: 100,
        },
      });

      if (response.data.success) {
        // Sort orders by created_at descending (newest first)
        const raw: Order[] = response.data.data ?? response.data.orders ?? [];
        const sortedOrders = [...raw].sort(
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
      const response = await api.get(`/orders/${orderId}`);
      if (response.data.success) {
        setSelectedOrder(response.data.order ?? response.data.data);
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
      const response = await api.put(`/orders/${orderId}/status`, {
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

  const handleCreateRefund = async (fullRefund: boolean) => {
    if (!selectedOrder) return;

    const parsedAmount = refundAmount.trim() ? Number(refundAmount) : undefined;
    if (!fullRefund && (!parsedAmount || !Number.isFinite(parsedAmount) || parsedAmount <= 0)) {
      toast({
        variant: 'destructive',
        title: 'Invalid refund amount',
        description: 'Enter a valid positive refund amount for partial refunds.',
      });
      return;
    }

    setIsRefunding(true);
    try {
      const payload: Record<string, unknown> = {
        reason: refundReason || 'requested_by_seller',
      };

      if (!fullRefund) {
        payload.amount = parsedAmount;
      }

      const response = await api.post(`/orders/${selectedOrder.id}/refunds`, payload);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Refund failed');
      }

      toast({
        title: 'Refund submitted',
        description: fullRefund
          ? 'Full refund has been recorded.'
          : 'Partial refund has been recorded.',
      });

      if (response.data.order) {
        setSelectedOrder(response.data.order);
      }

      setRefundAmount('');
      await fetchOrders();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Refund failed',
        description: error.response?.data?.message || error.message || 'Please try again.',
      });
    } finally {
      setIsRefunding(false);
    }
  };

  const handleRunReconciliation = async () => {
    setIsReconciling(true);
    try {
      const response = await api.post('/orders/reconciliation/run', { auto_fix: false });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Reconciliation failed');
      }

      const reconciliation = response.data.reconciliation;
      toast({
        title: 'Reconciliation complete',
        description: `Scanned ${reconciliation.scanned}, mismatches ${reconciliation.mismatchesFound}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Reconciliation failed',
        description: error.response?.data?.message || error.message || 'Please try again.',
      });
    } finally {
      setIsReconciling(false);
    }
  };

  const fetchAvailableRiders = async () => {
    setRidersLoading(true);
    try {
      const response = await api.get('/deliveries/dispatch/riders/available', {
        params: { limit: 100 },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch riders');
      }

      setRiders(response.data.riders || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Unable to load riders',
        description: error.response?.data?.message || error.message || 'Please try again.',
      });
    } finally {
      setRidersLoading(false);
    }
  };

  const toIsoFromLocal = (value: string) => {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  };

  const fetchDeliveryTracking = async (orderId: number) => {
    setDeliveryTrackingLoading(true);
    try {
      const response = await api.get(`/deliveries/orders/${orderId}/tracking`);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to load delivery tracking');
      }
      setDeliveryTracking(response.data.tracking || null);
    } catch {
      setDeliveryTracking(null);
    } finally {
      setDeliveryTrackingLoading(false);
    }
  };

  const handleAssignInHouse = async () => {
    if (!selectedOrder) return;
    if (!selectedRiderId) {
      toast({
        variant: 'destructive',
        title: 'Rider required',
        description: 'Please select an available rider.',
      });
      return;
    }

    setIsDispatching(true);
    try {
      const payload: Record<string, unknown> = {
        rider_id: Number(selectedRiderId),
      };
      const etaIso = toIsoFromLocal(dispatchEta);
      if (etaIso) payload.eta_at = etaIso;

      const response = await api.post(`/deliveries/orders/${selectedOrder.id}/assign-in-house`, payload);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to assign rider');
      }

      toast({
        title: 'Rider assigned',
        description: 'In-house rider assignment has been created.',
      });
      setSelectedRiderId('');
      await fetchAvailableRiders();
      await fetchDeliveryTracking(selectedOrder.id);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Assignment failed',
        description: error.response?.data?.message || error.message || 'Please try again.',
      });
    } finally {
      setIsDispatching(false);
    }
  };

  const handleDispatchThirdParty = async () => {
    if (!selectedOrder) return;
    if (!thirdPartyProvider.trim() || !thirdPartyTrackingRef.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing details',
        description: 'Courier provider and tracking reference are required.',
      });
      return;
    }

    setIsDispatching(true);
    try {
      const payload: Record<string, unknown> = {
        provider: thirdPartyProvider.trim(),
        tracking_reference: thirdPartyTrackingRef.trim(),
      };
      const etaIso = toIsoFromLocal(dispatchEta);
      if (etaIso) payload.eta_at = etaIso;

      const response = await api.post(`/deliveries/orders/${selectedOrder.id}/dispatch-third-party`, payload);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to dispatch third-party courier');
      }

      toast({
        title: 'Third-party dispatched',
        description: 'Third-party courier tracking has been recorded.',
      });
      setThirdPartyProvider('');
      setThirdPartyTrackingRef('');
      await fetchDeliveryTracking(selectedOrder.id);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Dispatch failed',
        description: error.response?.data?.message || error.message || 'Please try again.',
      });
    } finally {
      setIsDispatching(false);
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
          <h1 className="text-3xl font-bold text-fresh-text-primary">
            Customer Orders
          </h1>
          <p className="text-fresh-text-muted mt-2">
            Manage orders for your products
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={handleRunReconciliation}
            disabled={isReconciling}
          >
            {isReconciling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reconciling...
              </>
            ) : (
              <>
                <RotateCw className="mr-2 h-4 w-4" />
                Run Reconciliation
              </>
            )}
          </Button>
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
            <Loader2 className="h-8 w-8 animate-spin text-fresh-primary" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="h-16 w-16 text-fresh-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-fresh-text-primary mb-2">
              {statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter} orders`}
            </h3>
            <p className="text-fresh-text-muted mb-4">
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
              <OrderCard
                key={order.id}
                order={order}
                viewAs="seller"
                onClick={() => handleOrderClick(order.id)}
              />
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

              <Card className="mt-4 border-dashed">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-fresh-text-primary">Current Dispatch Status</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchDeliveryTracking(selectedOrder.id)}
                      disabled={deliveryTrackingLoading}
                    >
                      {deliveryTrackingLoading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </div>

                  {!deliveryTracking && !deliveryTrackingLoading && (
                    <p className="text-sm text-fresh-text-muted">No delivery record yet for this order.</p>
                  )}

                  {deliveryTrackingLoading && (
                    <p className="text-sm text-fresh-text-muted">Loading delivery status...</p>
                  )}

                  {deliveryTracking && (
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Status:</span> {deliveryTracking.delivery.status}</p>
                      <p><span className="font-medium">Fulfillment:</span> {deliveryTracking.delivery.fulfillment_type}</p>
                      {deliveryTracking.delivery.assigned_rider_name && (
                        <p><span className="font-medium">Assigned Rider:</span> {deliveryTracking.delivery.assigned_rider_name}</p>
                      )}
                      {deliveryTracking.delivery.eta_at && (
                        <p><span className="font-medium">ETA:</span> {new Date(deliveryTracking.delivery.eta_at).toLocaleString()}</p>
                      )}
                      {deliveryTracking.delivery.third_party_provider && (
                        <p><span className="font-medium">Courier:</span> {deliveryTracking.delivery.third_party_provider}</p>
                      )}
                      {deliveryTracking.delivery.third_party_tracking_ref && (
                        <p><span className="font-medium">Tracking Ref:</span> {deliveryTracking.delivery.third_party_tracking_ref}</p>
                      )}
                      {deliveryTracking.delivery.failure_reason && (
                        <p><span className="font-medium">Failure:</span> {deliveryTracking.delivery.failure_reason}</p>
                      )}
                      {deliveryTracking.events?.length ? (
                        <p className="text-xs text-fresh-text-muted pt-2">
                          Last update: {new Date(deliveryTracking.events[deliveryTracking.events.length - 1].created_at).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedOrder.status !== 'cancelled' && (
                <Card className="mt-4 border-dashed">
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="font-semibold text-fresh-text-primary">Dispatch Delivery</h3>

                    <div className="space-y-2">
                      <Label htmlFor="dispatch-eta">ETA (optional)</Label>
                      <Input
                        id="dispatch-eta"
                        type="datetime-local"
                        value={dispatchEta}
                        onChange={(e) => setDispatchEta(e.target.value)}
                        disabled={isDispatching}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rider-select">Assign In-House Rider</Label>
                      <select
                        id="rider-select"
                        value={selectedRiderId}
                        onChange={(e) => setSelectedRiderId(e.target.value)}
                        disabled={ridersLoading || isDispatching}
                        className="w-full rounded-md border border-fresh-border bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Select rider...</option>
                        {riders
                          .filter((rider) => rider.is_available)
                          .map((rider) => (
                            <option key={rider.id} value={String(rider.id)}>
                              {rider.name} ({rider.active_deliveries} active)
                            </option>
                          ))}
                      </select>
                      {ridersLoading && <p className="text-xs text-fresh-text-muted">Loading riders...</p>}
                      {!ridersLoading && riders.length === 0 && (
                        <p className="text-xs text-fresh-text-muted">No rider accounts found yet.</p>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleAssignInHouse}
                      disabled={isDispatching || ridersLoading}
                      className="w-full sm:w-auto"
                    >
                      {isDispatching ? 'Processing...' : 'Assign In-House Rider'}
                    </Button>

                    <div className="border-t pt-4 space-y-2">
                      <Label htmlFor="third-party-provider">Third-Party Provider</Label>
                      <Input
                        id="third-party-provider"
                        value={thirdPartyProvider}
                        onChange={(e) => setThirdPartyProvider(e.target.value)}
                        placeholder="Lalamove, GrabExpress, etc."
                        disabled={isDispatching}
                      />

                      <Label htmlFor="third-party-tracking">Tracking Reference</Label>
                      <Input
                        id="third-party-tracking"
                        value={thirdPartyTrackingRef}
                        onChange={(e) => setThirdPartyTrackingRef(e.target.value)}
                        placeholder="External tracking ID"
                        disabled={isDispatching}
                      />

                      <Button
                        onClick={handleDispatchThirdParty}
                        disabled={isDispatching}
                        className="w-full sm:w-auto"
                      >
                        {isDispatching ? 'Processing...' : 'Dispatch Third-Party Courier'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {['captured', 'paid'].includes(selectedOrder.payment_status) && selectedOrder.status !== 'cancelled' && (
                <Card className="mt-4 border-dashed">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <BadgeDollarSign className="h-5 w-5 text-fresh-primary" />
                      <h3 className="font-semibold text-fresh-text-primary">Issue Refund</h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="refund-amount">Partial Refund Amount (optional for full refund)</Label>
                      <Input
                        id="refund-amount"
                        placeholder="e.g. 120.50"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        disabled={isRefunding}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="refund-reason">Reason</Label>
                      <Textarea
                        id="refund-reason"
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        disabled={isRefunding}
                        rows={3}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleCreateRefund(false)}
                        disabled={isRefunding}
                        className="w-full sm:w-auto"
                      >
                        {isRefunding ? 'Submitting...' : 'Submit Partial Refund'}
                      </Button>
                      <Button
                        onClick={() => handleCreateRefund(true)}
                        disabled={isRefunding}
                        className="w-full sm:w-auto"
                      >
                        {isRefunding ? 'Submitting...' : 'Submit Full Refund'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedOrder && (
              <Button
                variant="secondary"
                onClick={() => router.push(`/seller/orders/${selectedOrder.id}/delivery`)}
                className="w-full sm:w-auto"
              >
                Track Delivery
              </Button>
            )}
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
