'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import {
  Package,
  Calendar,
  MapPin,
  User,
  CreditCard,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Order } from '@/lib/types/order';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_METHODS,
} from '@/lib/types/order';

interface OrderDetailProps {
  order: Order;
  viewAs?: 'buyer' | 'seller';
}

export default function OrderDetail({ order, viewAs = 'buyer' }: OrderDetailProps) {
  const paymentMethod = PAYMENT_METHODS.find((m) => m.id === order.payment_method);

  // Status timeline data
  const statusTimeline = [
    {
      status: 'pending',
      label: 'Order Placed',
      timestamp: order.created_at,
      icon: Clock,
      active: true,
    },
    {
      status: 'paid',
      label: 'Payment Completed',
      timestamp: order.paid_at,
      icon: CheckCircle2,
      active: order.status !== 'pending' && order.status !== 'cancelled',
    },
    {
      status: 'completed',
      label: 'Order Completed',
      timestamp: order.completed_at,
      icon: Package,
      active: order.status === 'completed',
    },
  ];

  // Add cancelled status if applicable
  if (order.status === 'cancelled' && order.cancelled_at) {
    statusTimeline.push({
      status: 'cancelled',
      label: 'Order Cancelled',
      timestamp: order.cancelled_at,
      icon: XCircle,
      active: true,
    });
  }

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Order #{order.id}</CardTitle>
              <p className="text-sm text-[var(--fresh-text-muted)] mt-1">
                Placed on {format(new Date(order.created_at), 'MMMM dd, yyyy')} at{' '}
                {format(new Date(order.created_at), 'h:mm a')}
              </p>
            </div>
            <Badge variant="outline" className={ORDER_STATUS_COLORS[order.status]}>
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statusTimeline
              .filter((item) => item.active)
              .map((item, index, array) => {
                const Icon = item.icon;
                const isLast = index === array.length - 1;

                return (
                  <div key={item.status} className="flex gap-4">
                    {/* Icon & Line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`rounded-full p-2 ${
                          item.status === 'cancelled'
                            ? 'bg-red-100'
                            : 'bg-[var(--fresh-primary)]/10'
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            item.status === 'cancelled'
                              ? 'text-[var(--fresh-danger)]'
                              : 'text-[var(--fresh-primary)]'
                          }`}
                        />
                      </div>
                      {!isLast && (
                        <div className="w-0.5 h-12 bg-[var(--fresh-border)] my-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <p className="font-medium text-[var(--fresh-text-primary)]">
                        {item.label}
                      </p>
                      {item.timestamp && (
                        <p className="text-sm text-[var(--fresh-text-muted)]">
                          {format(new Date(item.timestamp), 'MMM dd, yyyy · h:mm a')}
                        </p>
                      )}
                      {item.status === 'cancelled' && order.cancel_reason && (
                        <p className="text-sm text-[var(--fresh-danger)] mt-1">
                          Reason: {order.cancel_reason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Product Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {/* Product Image */}
            <div className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--fresh-surface)]">
              {order.product_image ? (
                <Image
                  src={order.product_image}
                  alt={order.product_name || 'Product'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Package className="h-10 w-10 text-[var(--fresh-text-muted)]" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-[var(--fresh-text-primary)]">
                {order.product_name}
              </h3>
              <div className="mt-2 space-y-1 text-sm text-[var(--fresh-text-muted)]">
                <p>Quantity: {order.quantity}</p>
                <p>Unit Price: ₱{order.unit_price.toFixed(2)}</p>
                <p className="text-base font-semibold text-[var(--fresh-text-primary)] mt-2">
                  Subtotal: ₱{order.total_amount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-[var(--fresh-text-muted)]">Delivery Address</p>
              <p className="font-medium text-[var(--fresh-text-primary)]">
                {order.delivery_address}
              </p>
            </div>
            {order.delivery_notes && (
              <div>
                <p className="text-sm text-[var(--fresh-text-muted)]">Delivery Notes</p>
                <p className="text-[var(--fresh-text-primary)]">{order.delivery_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-[var(--fresh-text-muted)]">Payment Method</p>
              <div className="flex items-center gap-2 mt-1">
                {paymentMethod && (
                  <>
                    <span className="text-xl">{paymentMethod.icon}</span>
                    <span className="font-medium text-[var(--fresh-text-primary)]">
                      {paymentMethod.name}
                    </span>
                  </>
                )}
              </div>
            </div>
            {order.transaction_id && (
              <div>
                <p className="text-sm text-[var(--fresh-text-muted)]">Transaction ID</p>
                <p className="font-mono text-sm text-[var(--fresh-text-primary)]">
                  {order.transaction_id}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-[var(--fresh-text-muted)]">Payment Status</p>
              <Badge
                variant={order.payment_status === 'completed' ? 'default' : 'secondary'}
                className="mt-1"
              >
                {order.payment_status.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            {viewAs === 'buyer' ? 'Seller' : 'Buyer'} Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-[var(--fresh-text-muted)]">Name</p>
              <p className="font-medium text-[var(--fresh-text-primary)]">
                {viewAs === 'buyer' ? order.seller_name : order.buyer_name}
              </p>
            </div>
            {viewAs === 'seller' && order.buyer_email && (
              <div>
                <p className="text-sm text-[var(--fresh-text-muted)]">Email</p>
                <p className="text-[var(--fresh-text-primary)]">{order.buyer_email}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-[var(--fresh-text-muted)]">Subtotal</span>
            <span className="text-[var(--fresh-text-primary)]">
              ₱{order.total_amount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--fresh-text-muted)]">Delivery Fee</span>
            <span className="text-[var(--fresh-primary)]">FREE</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-lg font-semibold text-[var(--fresh-text-primary)]">
              Total
            </span>
            <span className="text-2xl font-bold text-[var(--fresh-text-primary)]">
              ₱{order.total_amount.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
