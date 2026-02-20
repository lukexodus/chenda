/**
 * Order-related TypeScript types
 * Matching backend API schema from server/controllers/orderController.js
 */

export type OrderStatus = 'pending' | 'paid' | 'completed' | 'cancelled';

export type PaymentMethod = 'cash' | 'gcash' | 'card';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PaymentDetails {
  method: PaymentMethod;
  account_number?: string;
  account_name?: string;
  card_last4?: string;
  card_brand?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  // Product details (joined from product table)
  product_name?: string;
  product_image?: string;
  seller_name?: string;
  seller_id?: number;
}

export interface Order {
  id: number;
  buyer_id: number;
  product_id: number;
  seller_id: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  delivery_notes?: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  payment_details?: PaymentDetails;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  // Joined fields
  buyer_name?: string;
  buyer_email?: string;
  product_name?: string;
  product_image?: string;
  seller_name?: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface CreateOrderRequest {
  product_id: number;
  quantity: number;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  delivery_notes?: string;
}

export interface PayOrderRequest {
  payment_method: PaymentMethod;
  payment_details?: {
    account_number?: string;
    account_name?: string;
    card_last4?: string;
    card_brand?: string;
  };
}

export interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
  processing_time?: string;
  fee?: string;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'cash',
    name: 'Cash on Delivery',
    description: 'Pay with cash when you receive your order',
    icon: '💵',
    processing_time: 'Instant',
    fee: 'Free',
  },
  {
    id: 'gcash',
    name: 'GCash',
    description: 'Pay securely with GCash mobile wallet',
    icon: '📱',
    processing_time: '1-2 minutes',
    fee: 'Free',
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    description: 'Pay with Visa, Mastercard, or other cards',
    icon: '💳',
    processing_time: 'Instant',
    fee: 'Free',
  },
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending Payment',
  paid: 'Paid',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending',
  processing: 'Processing...',
  completed: 'Completed',
  failed: 'Failed',
};
