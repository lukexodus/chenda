'use client';

import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { Package, Calendar, MapPin, ChevronRight, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Order } from '@/lib/types/order';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/types/order';

interface OrderCardProps {
  order: Order;
  viewAs?: 'buyer' | 'seller';
}

export default function OrderCard({ order, viewAs = 'buyer' }: OrderCardProps) {
  const orderDate = format(new Date(order.created_at), 'MMM dd, yyyy');
  const orderTime = format(new Date(order.created_at), 'h:mm a');

  return (
    <Link href={`/orders/${order.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Product Image */}
            <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--fresh-surface)]">
              {order.product_image ? (
                <Image
                  src={order.product_image}
                  alt={order.product_name || 'Product'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-[var(--fresh-text-muted)]" />
                </div>
              )}
            </div>

            {/* Order Details */}
            <div className="flex-1 min-w-0">
              {/* Header: Order ID & Status */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-[var(--fresh-text-primary)]">
                    {order.product_name}
                  </p>
                  <p className="text-sm text-[var(--fresh-text-muted)]">
                    Order #{order.id}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={ORDER_STATUS_COLORS[order.status]}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              </div>

              {/* Order Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {/* Date */}
                <div className="flex items-center gap-2 text-[var(--fresh-text-muted)]">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {orderDate} at {orderTime}
                  </span>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-2 text-[var(--fresh-text-muted)]">
                  <Package className="h-4 w-4" />
                  <span>Qty: {order.quantity}</span>
                </div>

                {/* Buyer/Seller Name (depends on viewAs) */}
                {viewAs === 'seller' && order.buyer_name && (
                  <div className="flex items-center gap-2 text-[var(--fresh-text-muted)]">
                    <User className="h-4 w-4" />
                    <span>Buyer: {order.buyer_name}</span>
                  </div>
                )}

                {viewAs === 'buyer' && order.seller_name && (
                  <div className="flex items-center gap-2 text-[var(--fresh-text-muted)]">
                    <User className="h-4 w-4" />
                    <span>Seller: {order.seller_name}</span>
                  </div>
                )}

                {/* Delivery Address (truncated) */}
                <div className="flex items-center gap-2 text-[var(--fresh-text-muted)] sm:col-span-2">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{order.delivery_address}</span>
                </div>
              </div>

              {/* Footer: Total & View Button */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div>
                  <p className="text-sm text-[var(--fresh-text-muted)]">Total Amount</p>
                  <p className="text-lg font-bold text-[var(--fresh-text-primary)]">
                    ₱{order.total_amount.toFixed(2)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="gap-2">
                  View Details
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
