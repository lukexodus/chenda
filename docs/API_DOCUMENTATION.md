# Chenda API Documentation

**Version**: 1.0.0  
**Base URL**: `http://localhost:3001`  
**Date**: February 13, 2026  

## Overview

The Chenda API provides a comprehensive backend for a fresh marketplace platform featuring a proprietary proximity-freshness ranking algorithm for perishable goods. This REST API supports buyers, sellers, and analytics with role-based access control.

## Table of Contents

1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
3. [Error Handling](#error-handling)
4. [Response Format](#response-format)
5. [Request Examples](#request-examples)
6. [Common Workflows](#common-workflows)

---

## Authentication

### Session-Based Authentication
The API uses **session-based authentication** with PostgreSQL session storage powered by Passport.js.

### Authentication Types
- **Public**: No authentication required
- **Private**: Requires authentication (`isAuthenticated` middleware)
- **Seller**: Requires seller role (`isSeller` middleware)  
- **Buyer**: Requires buyer role (`isBuyer` middleware)
- **Rider**: Requires rider role (`isRider` middleware)
- **Owner**: Role + ownership verification (e.g., seller can only modify own products)

### Authentication Headers
```javascript
// Session cookie is set automatically after login
// Include cookies in requests for authenticated endpoints
```

---

## API Endpoints

**Quick Navigation:**
- [🏥 Health Check](#-health-check)
- [🔐 Authentication](#-authentication)
- [🔍 Product Search](#-product-search-chenda-algorithm)
- [📦 Product Management](#-product-management)
- [🏷️ Product Types](#-product-types-usda-classification)
- [👤 User Management](#-user-management)
- [🛒 Order Management](#-order-management) *(includes Payment, Refunds, Reconciliation, Monitoring, Settlements)*
- [🚚 Delivery, Rider, and Notifications](#-delivery-rider-and-notifications)
- [📊 Analytics](#-analytics)

---

### 🏥 Health Check

#### `GET /api/health`
**Access**: Public  
**Description**: Server and database health check

**Response**:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-02-13T10:30:00.000Z",
  "server": {
    "environment": "development",
    "uptime": 3600.5,
    "port": 3001
  },
  "database": {
    "connected": true,
    "time": "2026-02-13T10:30:00.000Z",
    "version": "PostgreSQL 13.0"
  }
}
```

---

### 🔐 Authentication

#### `POST /api/auth/register`
**Access**: Public  
**Description**: Register a new user

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "type": "buyer",
  "address": "Manila, Philippines",
  "location": {
    "lat": 14.5995,
    "lng": 120.9842
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "type": "buyer",
    "created_at": "2026-02-13T10:30:00.000Z"
  }
}
```

#### `POST /api/auth/login`
**Access**: Public  
**Description**: Login user and create session

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "type": "buyer"
  }
}
```

#### `POST /api/auth/logout`
**Access**: Private  
**Description**: Logout user and destroy session

**Request**: No body required

**Response**:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### `GET /api/auth/me`
**Access**: Private  
**Description**: Get current authenticated user

**Response**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "type": "buyer",
    "location": {"lat": 14.5995, "lng": 120.9842}
  }
}
```

#### `PUT /api/auth/password`
**Access**: Private  
**Description**: Update user password

**Request Body**:
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

### 🔍 Product Search (Chenda Algorithm)

#### `POST /api/products/search`
**Access**: Private  
**Description**: Main search with Chenda proximity-freshness algorithm

**Request Body**:
```json
{
  "buyer": {
    "lat": 14.5995,
    "lng": 120.9842
  },
  "config": {
    "max_radius": 10,
    "weights": {
      "proximity_weight": 40,
      "freshness_weight": 60
    },
    "min_freshness_score": 20,
    "mode": "ranking",
    "sort_order": "desc"
  }
}
```

**Response**:
```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "Fresh Tomatoes",
      "price": 150.00,
      "distance_km": 2.5,
      "freshness_score": 85,
      "combined_score": 78.5,
      "rank": 1,
      "seller": {
        "name": "Maria's Farm",
        "location": "Quezon City"
      },
      "expiration_date": "2026-02-20T00:00:00.000Z"
    }
  ],
  "metadata": {
    "results_count": 15,
    "execution_time_ms": 45,
    "algorithm_config": {
      "proximity_weight": 40,
      "freshness_weight": 60
    }
  }
}
```

#### `POST /api/products/search/personalized`
**Access**: Private  
**Description**: Personalized search using user's saved preferences

**Request Body**:
```json
{
  "buyer": {
    "lat": 14.5995,
    "lng": 120.9842
  }
}
```

**Response**: Same as main search, but uses user's stored preferences

#### `GET /api/products/nearby`
**Access**: Public  
**Description**: Simple nearby products without algorithm ranking

**Query Parameters**:
- `lat` (required): Latitude
- `lng` (required): Longitude  
- `radius` (optional): Search radius in km (default: 5)

**Example**: `/api/products/nearby?lat=14.5995&lng=120.9842&radius=10`

**Response**:
```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "Fresh Bananas",
      "price": 80.00,
      "distance_km": 1.2,
      "seller": "Farm Fresh Store"
    }
  ]
}
```

#### `GET /api/search/public`
**Access**: Public  
**Description**: Public search with algorithm (no auth required)

**Query Parameters**:
- `lat`, `lng`: Buyer location
- `proximity_weight`, `freshness_weight`: Algorithm weights (0-100)
- `max_radius`: Maximum distance in km
- `min_freshness_score`: Minimum freshness (0-100)

---

### 📦 Product Management

#### `POST /api/products/upload-image`
**Access**: Seller  
**Description**: Upload product image

**Request**: `FormData` with image file  
**File Requirements**: Max 5MB, formats: jpeg, jpg, png, gif, webp

**Response**:
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "imageUrl": "/uploads/products/1708770000000-tomatoes.jpg",
  "metadata": {
    "filename": "1708770000000-tomatoes.jpg",
    "size": 1024000,
    "mimetype": "image/jpeg"
  }
}
```

#### `POST /api/products`
**Access**: Seller  
**Description**: Create new product listing

**Request Body**:
```json
{
  "name": "Fresh Organic Tomatoes",
  "description": "Locally grown organic tomatoes",
  "price": 150.00,
  "quantity": 25,
  "unit": "kg", 
  "product_type_id": 45,
  "days_already_used": 1,
  "image_url": "/uploads/products/tomatoes.jpg",
  "location": {
    "lat": 14.6042,
    "lng": 121.0100
  },
  "storage_condition": "room_temp"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Product created successfully",
  "product": {
    "id": 1,
    "name": "Fresh Organic Tomatoes",
    "price": 150.00,
    "seller_id": 5,
    "freshness_score": 85,
    "created_at": "2026-02-13T10:30:00.000Z"
  }
}
```

#### `GET /api/products`
**Access**: Seller  
**Description**: Get all products for authenticated seller

**Query Parameters**:
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by status

**Response**:
```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "Fresh Tomatoes",
      "price": 150.00,
      "quantity": 25,
      "freshness_score": 85,
      "days_left": 6
    }
  ],
  "pagination": {
    "total": 12,
    "limit": 50,
    "offset": 0
  }
}
```

#### `GET /api/products/:id`
**Access**: Public  
**Description**: Get single product details

**Response**:
```json
{
  "success": true,
  "product": {
    "id": 1,
    "name": "Fresh Tomatoes",
    "description": "Locally grown organic tomatoes",
    "price": 150.00,
    "quantity": 25,
    "seller": {
      "id": 5,
      "name": "Maria's Farm",
      "email": "maria@farm.com"
    },
    "product_type": {
      "name": "Tomatoes",
      "shelf_life_days": 7
    },
    "location": {"lat": 14.6042, "lng": 121.0100},
    "freshness_score": 85
  }
}
```

#### `PUT /api/products/:id`
**Access**: Seller (Owner)  
**Description**: Update product (seller can only update own products)

**Request Body**: Same fields as create, all optional

#### `DELETE /api/products/:id`
**Access**: Seller (Owner)  
**Description**: Delete product

**Response**:
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

### 🏷️ Product Types (USDA Classification)

#### `GET /api/product-types`
**Access**: Public  
**Description**: Get all product types with optional search (used for product creation form)

**Query Parameters**:
- `search` (optional): Search by name, subtitle, or keywords (e.g., "tomato", "fresh")

**Response**:
```json
{
  "success": true,
  "product_types": [
    {
      "id": 1,
      "name": "Tomatoes",
      "name_subtitle": "Cherry tomatoes",
      "category_id": 5,
      "keywords": "tomato,cherry,vegetable",
      "default_shelf_life_days": 7,
      "default_storage_condition": "room_temp"
    },
    {
      "id": 2,
      "name": "Lettuce",
      "name_subtitle": "Romaine",
      "category_id": 3,
      "keywords": "lettuce,salad,green",
      "default_shelf_life_days": 5,
      "default_storage_condition": "refrigerated"
    }
  ],
  "total": 2
}
```

#### `GET /api/product-types/:id`
**Access**: Public  
**Description**: Get details for a specific product type

**Response**:
```json
{
  "success": true,
  "product_type": {
    "id": 1,
    "name": "Tomatoes",
    "name_subtitle": "Cherry tomatoes",
    "category_id": 5,
    "keywords": "tomato,cherry,vegetable",
    "default_shelf_life_days": 7,
    "default_storage_condition": "room_temp"
  }
}
```

**Error Response** (if not found):
```json
{
  "success": false,
  "message": "Product type not found"
}
```

---

### 👤 User Management

#### `GET /api/users/profile`
**Access**: Private  
**Description**: Get user profile

**Response**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "type": "buyer",
    "address": "Manila, Philippines",
    "location": {"lat": 14.5995, "lng": 120.9842},
    "preferences": {
      "proximity_weight": 40,
      "freshness_weight": 60,
      "max_radius": 10
    }
  }
}
```

#### `PUT /api/users/profile`
**Access**: Private  
**Description**: Update user profile

**Request Body**:
```json
{
  "name": "John Smith",
  "address": "New Address, Philippines"
}
```

#### `PUT /api/users/preferences`
**Access**: Private  
**Description**: Update algorithm preferences

**Request Body**:
```json
{
  "proximity_weight": 30,
  "freshness_weight": 70,
  "max_radius": 15,
  "min_freshness_score": 25,
  "storage_condition": "refrigerated"
}
```

#### `PUT /api/users/location`
**Access**: Private  
**Description**: Update user location

**Request Body**:
```json
{
  "lat": 14.5995,
  "lng": 120.9842,
  "address": "Manila, Philippines"
}
```

#### `POST /api/users/geocode`
**Access**: Private  
**Description**: Convert address to coordinates using Nominatim API

**Request Body**:
```json
{
  "address": "Makati City, Metro Manila, Philippines"
}
```

**Response**:
```json
{
  "success": true,
  "coordinates": {
    "lat": 14.5547,
    "lng": 121.0244
  },
  "display_name": "Makati, Metro Manila, Philippines"
}
```

#### `POST /api/users/reverse-geocode`
**Access**: Private  
**Description**: Convert coordinates to address

**Request Body**:
```json
{
  "lat": 14.5547,
  "lng": 121.0244
}
```

**Response**:
```json
{
  "success": true,
  "address": "Makati City, Metro Manila, Philippines"
}
```

---

### 🛒 Order Management

#### `GET /api/orders/payment-methods`
**Access**: Public  
**Description**: Get supported payment methods

**Response**:
```json
{
  "success": true,
  "payment_methods": [
    {
      "id": "cash",
      "name": "Cash on Delivery",
      "description": "Pay with cash upon delivery"
    },
    {
      "id": "gcash",
      "name": "GCash",
      "description": "Digital wallet payment"
    },
    {
      "id": "card",
      "name": "Credit/Debit Card",
      "description": "Pay with credit or debit card"
    }
  ]
}
```

#### `POST /api/orders`
**Access**: Buyer  
**Description**: Create new order

**Request Body**:
```json
{
  "product_id": 1,
  "quantity": 3,
  "payment_method": "gcash",
  "delivery_address": "Manila, Philippines",
  "delivery_notes": "Gate 2, Building A"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "id": 1,
    "product_id": 1,
    "quantity": 3,
    "total_amount": 450.00,
    "status": "pending",
    "payment_method": "gcash",
    "created_at": "2026-02-13T10:30:00.000Z"
  }
}
```

#### `POST /api/orders/:id/payment`
**Access**: Buyer  
**Description**: Process payment for order (mock payment system)

**Request Body**:
```json
{
  "payment_method": "gcash",
  "payment_details": {
    "phone": "+639123456789"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "payment": {
    "transaction_id": "TXN_1708770000_ABC123",
    "status": "completed",
    "amount": 450.00,
    "processing_time": 2.1
  }
}
```

#### `GET /api/orders/:id`
**Access**: Private (Buyer/Seller)  
**Description**: Get order details

**Response**:
```json
{
  "success": true,
  "order": {
    "id": 1,
    "product": {
      "name": "Fresh Tomatoes",
      "price": 150.00
    },
    "buyer": {
      "name": "John Doe"
    },
    "seller": {
      "name": "Maria's Farm"
    },
    "quantity": 3,
    "total_amount": 450.00,
    "status": "paid",
    "payment_method": "gcash",
    "created_at": "2026-02-13T10:30:00.000Z"
  }
}
```

#### `GET /api/orders`
**Access**: Private  
**Description**: List user's orders (buyer sees purchases, seller sees sales)

**Query Parameters**:
- `status`: Filter by order status (pending, paid, completed, cancelled)
- `role`: Specify role context (buyer, seller)
- `limit`: Results per page (default: 50)
- `offset`: Pagination offset

**Response**:
```json
{
  "success": true,
  "orders": [
    {
      "id": 1,
      "product_name": "Fresh Tomatoes",
      "quantity": 3,
      "total_amount": 450.00,
      "status": "paid",
      "created_at": "2026-02-13T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 50,
    "offset": 0
  }
}
```

#### `PUT /api/orders/:id/status`
**Access**: Seller  
**Description**: Update order status (seller only)

**Request Body**:
```json
{
  "status": "completed",
  "notes": "Order fulfilled and delivered"
}
```

#### `POST /api/orders/batch`
**Access**: Buyer  
**Description**: Create multiple orders in a single request for bulk purchasing

**Request Body**:
```json
{
  "orders": [
    {
      "product_id": 1,
      "quantity": 3,
      "payment_method": "gcash",
      "delivery_address": "Manila, Philippines"
    },
    {
      "product_id": 2,
      "quantity": 2,
      "payment_method": "gcash",
      "delivery_address": "Manila, Philippines"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Batch orders created successfully",
  "orders": [
    {
      "id": 10,
      "product_id": 1,
      "quantity": 3,
      "total_amount": 450.00,
      "status": "pending"
    },
    {
      "id": 11,
      "product_id": 2,
      "quantity": 2,
      "total_amount": 300.00,
      "status": "pending"
    }
  ],
  "batch_total": 750.00
}
```

#### `POST /api/orders/:id/refunds`
**Access**: Seller  
**Description**: Create full or partial refund for a completed order

**Request Body**:
```json
{
  "amount": 150.00,
  "reason": "Customer requested partial refund for damaged goods"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "refund": {
    "id": 5,
    "order_id": 1,
    "amount": 150.00,
    "reason": "Customer requested partial refund for damaged goods",
    "status": "processed",
    "processed_at": "2026-02-15T14:30:00.000Z"
  }
}
```

#### `POST /api/orders/reconciliation/run`
**Access**: Seller  
**Description**: Run payment reconciliation to verify payment records against delivery status

**Response**:
```json
{
  "success": true,
  "message": "Payment reconciliation completed",
  "reconciliation": {
    "total_orders_checked": 42,
    "matched_payments": 40,
    "unmatched_payments": 2,
    "discrepancies": [
      {
        "order_id": 15,
        "issue": "Payment recorded but delivery not marked complete",
        "recommendation": "Verify delivery status or contact buyer"
      }
    ],
    "run_at": "2026-02-15T14:35:00.000Z"
  }
}
```

#### `GET /api/orders/payment-monitoring/summary`
**Access**: Seller  
**Description**: Get payment monitoring dashboard and active payment alerts

**Query Parameters**:
- `include_acknowledged`: true|false (default: false) - Include acknowledged alerts

**Response**:
```json
{
  "success": true,
  "monitoring": {
    "total_active_alerts": 3,
    "alerts": [
      {
        "id": 1,
        "order_id": 22,
        "alert_type": "payment_timeout",
        "severity": "warning",
        "message": "Payment pending for 30+ minutes",
        "created_at": "2026-02-15T13:45:00.000Z",
        "acknowledged": false
      },
      {
        "id": 2,
        "order_id": 25,
        "alert_type": "payment_mismatch",
        "severity": "critical",
        "message": "Amount received differs from order total",
        "created_at": "2026-02-15T14:00:00.000Z",
        "acknowledged": false
      }
    ],
    "payment_stats": {
      "today_processed": 45,
      "today_pending": 3,
      "success_rate_percent": 93.75
    }
  }
}
```

#### `POST /api/orders/payment-monitoring/alerts/:alertId/ack`
**Access**: Seller  
**Description**: Acknowledge a payment alert (seller confirms review)

**Request Body**:
```json
{
  "action_taken": "Verified payment received and order shipped"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Alert acknowledged",
  "alert": {
    "id": 1,
    "acknowledged": true,
    "acknowledged_at": "2026-02-15T14:45:00.000Z",
    "action_taken": "Verified payment received and order shipped"
  }
}
```

#### `GET /api/orders/seller/payments/settlements`
**Access**: Seller  
**Description**: Get seller payment settlement history with detailed breakdown

**Query Parameters**:
- `status`: all|pending|completed|failed (default: all) - Filter by settlement status
- `period`: 7d|30d|90d (default: 30d) - Date range
- `limit`: 1..100 (default: 50)
- `offset`: Pagination offset

**Response**:
```json
{
  "success": true,
  "settlements": [
    {
      "id": 1,
      "period_start": "2026-02-01",
      "period_end": "2026-02-14",
      "total_revenue": 5000.00,
      "total_commissions": -500.00,
      "platform_fees": -100.00,
      "refunds": -200.00,
      "net_amount": 4200.00,
      "status": "completed",
      "payout_method": "bank_transfer",
      "payout_reference": "SETTLE-2026-02-1",
      "settled_at": "2026-02-15T09:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 8,
    "limit": 50,
    "offset": 0
  }
}
```

#### `GET /api/orders/seller/payments/overview`
**Access**: Seller  
**Description**: Get seller payment overview including total earnings, pending amounts, and payout trends

**Response**:
```json
{
  "success": true,
  "overview": {
    "lifetime_earnings": 125000.00,
    "pending_amount": 3500.00,
    "last_payout": {
      "amount": 4200.00,
      "date": "2026-02-15",
      "reference": "SETTLE-2026-02-1"
    },
    "monthly_trend": [
      {
        "month": "December 2025",
        "revenue": 8500.00,
        "payouts": 7850.00
      },
      {
        "month": "January 2026",
        "revenue": 9200.00,
        "payouts": 8500.00
      },
      {
        "month": "February 2026",
        "revenue": 5000.00,
        "payouts": 4200.00
      }
    ],
    "average_payout_days": 7,
    "next_payout_estimate": "2026-02-28"
  }
}
```

---

### 🚚 Delivery, Rider, and Notifications

#### Seller Dispatch APIs

#### `POST /api/deliveries/orders/:orderId/assign-in-house`
**Access**: Seller  
**Description**: Assign an in-house rider to a seller-owned order.

**Request Body**:
```json
{
  "rider_id": 14,
  "eta_at": "2026-03-30T11:30:00.000Z"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Rider assigned successfully",
  "delivery": {
    "id": 103,
    "order_id": 88,
    "fulfillment_type": "in_house",
    "status": "assigned",
    "assigned_rider_id": 14,
    "eta_at": "2026-03-30T11:30:00.000Z"
  }
}
```

#### `POST /api/deliveries/orders/:orderId/dispatch-third-party`
**Access**: Seller  
**Description**: Mark an order as dispatched with an external courier.

**Request Body**:
```json
{
  "provider": "Lalamove",
  "tracking_reference": "LLM-6F4A02",
  "eta_at": "2026-03-30T11:45:00.000Z"
}
```

#### `PUT /api/deliveries/:id/reassign`
**Access**: Seller  
**Description**: Reassign an existing in-house delivery to another rider.

#### `GET /api/deliveries/dispatch/active`
**Access**: Seller  
**Description**: List active deliveries for seller dispatch operations.

**Query Parameters**:
- `status`: Optional status filter
- `limit`: Max rows (default: 50)
- `offset`: Pagination offset

#### `GET /api/deliveries/dispatch/riders/available`
**Access**: Seller  
**Description**: List available rider profiles for assignment.

#### `GET /api/deliveries/dispatch/sla/metrics`
**Access**: Seller  
**Description**: Delivery SLA performance summary.

**Query Parameters**:
- `days`: 1..365 (default: 30)

**Response**:
```json
{
  "success": true,
  "metrics": {
    "days": 30,
    "graceMinutes": 10,
    "deliveredCount": 24,
    "onTimeCount": 21,
    "onTimeRatePercent": 87.5,
    "averageDeliveryMinutes": 39.4
  }
}
```

#### Rider APIs

#### `GET /api/deliveries/rider/dashboard`
**Access**: Rider  
**Description**: Rider profile + active deliveries + same-day stats.

#### `PUT /api/deliveries/rider/availability`
**Access**: Rider  
**Description**: Toggle rider availability for assignment queue.

**Request Body**:
```json
{
  "is_available": true
}
```

#### `GET /api/deliveries/rider/jobs/available`
**Access**: Rider  
**Description**: List open in-house jobs riders can accept.

#### `GET /api/deliveries/rider/history`
**Access**: Rider  
**Description**: List delivered jobs with computed rider earnings.

#### `GET /api/deliveries/rider/:id`
**Access**: Rider  
**Description**: Rider-only delivery detail with timeline snapshot.

#### `POST /api/deliveries/:id/accept`
**Access**: Rider  
**Description**: Accept assigned (or available) in-house delivery.

#### `POST /api/deliveries/:id/decline`
**Access**: Rider  
**Description**: Decline an assigned delivery.

#### `PUT /api/deliveries/:id/status`
**Access**: Rider  
**Description**: Update rider delivery status.

**Allowed Status Values**:
- `accepted`
- `picked_up`
- `in_transit`
- `failed`

`delivered` is intentionally blocked here; use proof-photo upload endpoint to complete delivery.

**Request Body**:
```json
{
  "status": "in_transit",
  "eta_at": "2026-03-30T11:42:00.000Z",
  "note": "Left warehouse",
  "failure_reason": null
}
```

#### `POST /api/deliveries/:id/location`
**Access**: Rider  
**Description**: Push rider GPS coordinate updates.

**Request Body**:
```json
{
  "lat": 14.5567,
  "lng": 121.0214,
  "source": "manual"
}
```

When distance to buyer falls below `DELIVERY_NEAR_DESTINATION_METERS` (minimum enforced: 50m), the system emits a one-time `delivery_near_destination` event and notifies buyer + seller.

#### `POST /api/deliveries/:id/proof-photo`
**Access**: Rider  
**Description**: Upload proof of delivery photo and mark delivery as delivered.

**Request Content Type**: `multipart/form-data`  
**Form Field**: `proof_photo` (single file)

**Upload Constraints**:
- Max file size: `7MB`
- Allowed formats: `jpeg`, `jpg`, `png`, `webp`

**Response**:
```json
{
  "success": true,
  "message": "Proof photo uploaded and delivery marked as delivered",
  "delivery": {
    "id": 103,
    "status": "delivered",
    "proof_photo_url": "/uploads/delivery-proofs/delivery-proof-1743323400000-335019302.jpg"
  }
}
```

#### Buyer/Seller Tracking APIs

#### `GET /api/deliveries/orders/:orderId/tracking`
**Access**: Private (buyer or seller who owns the order)
**Description**: Get full tracking payload for a single order.

**Response**:
```json
{
  "success": true,
  "tracking": {
    "delivery": {
      "id": 103,
      "order_id": 88,
      "status": "in_transit",
      "fulfillment_type": "in_house",
      "assigned_rider_id": 14
    },
    "events": [
      {
        "id": 991,
        "event_type": "delivery_picked_up",
        "event_note": "Order has been picked up by rider.",
        "payload": {},
        "created_at": "2026-03-30T10:49:12.000Z"
      }
    ],
    "locations": [
      {
        "id": 1440,
        "latitude": 14.5567,
        "longitude": 121.0214,
        "source": "manual",
        "created_at": "2026-03-30T11:01:45.000Z"
      }
    ]
  }
}
```

#### `POST /api/deliveries/orders/:orderId/issues`
**Access**: Private (buyer or seller who owns the order)
**Description**: Report a delivery issue and notify operational participants.

**Request Body**:
```json
{
  "message": "Rider has been waiting at wrong gate for 10 minutes"
}
```

#### In-App Delivery Notification APIs

#### `GET /api/deliveries/notifications/me`
**Access**: Private  
**Description**: List current user delivery notifications (latest first).

**Query Parameters**:
- `limit`: 1..200 (default: 50)

#### `GET /api/deliveries/notifications/me/unread-count`
**Access**: Private  
**Description**: Return unread delivery notification count only.

**Response**:
```json
{
  "success": true,
  "unread_count": 3
}
```

#### `POST /api/deliveries/notifications/:notificationId/read`
**Access**: Private  
**Description**: Mark one notification as read.

#### `POST /api/deliveries/notifications/me/read-all`
**Access**: Private  
**Description**: Mark all current user unread delivery notifications as read.

**Response**:
```json
{
  "success": true,
  "updated": 5
}
```

---

### 📊 Analytics

#### `GET /api/analytics/algorithm`
**Access**: Private  
**Description**: Algorithm usage analytics

**Query Parameters**:
- `period`: Time period ("1 day", "7 days", "30 days", "90 days")

**Response**:
```json
{
  "success": true,
  "data": {
    "period": "7 days", 
    "weight_presets": [
      {
        "proximity_weight": 60,
        "freshness_weight": 40,
        "usage_count": 25
      }
    ],
    "performance": {
      "avg_response_time": "45.2",
      "avg_results_count": "12.5",
      "total_searches": 156
    },
    "popular_product_types": [
      {
        "product_type": "Tomatoes", 
        "search_appearances": 45
      }
    ],
    "search_volume": [
      {
        "date": "2026-02-12",
        "searches": 23
      }
    ]
  }
}
```

#### `GET /api/analytics/business`
**Access**: Private  
**Description**: Business metrics (sellers see own data, admins see all)

**Response**:
```json
{
  "success": true,
  "data": {
    "period": "30 days",
    "revenue": {
      "total": 15750.00,
      "orders": 45,
      "avg_order_value": 350.00
    },
    "products": {
      "total_created": 12,
      "avg_price": 175.50
    },
    "popular_products": [
      {
        "product_type": "Tomatoes",
        "revenue": 4500.00,
        "orders": 18
      }
    ]
  }
}
```

#### `GET /api/analytics/performance`
**Access**: Private  
**Description**: System performance metrics

**Response**:
```json
{
  "success": true,
  "data": {
    "period": "24 hours",
    "performance": {
      "avg_response_time": "42.3",
      "avg_algorithm_time": "4.2",
      "avg_query_time": "12.1"
    },
    "error_rates": [
      {
        "hour": "2026-02-13T06:00:00Z",
        "error_rate_percent": "0.5"
      }
    ],
    "slow_endpoints": [
      {
        "endpoint": "/api/products/search",
        "avg_response_time": 89.2
      }
    ]
  }
}
```

#### `GET /api/analytics/seller-dashboard`
**Access**: Seller  
**Description**: Seller-specific dashboard metrics

**Response**:
```json
{
  "success": true,
  "data": {
    "products": {
      "total": 8,
      "expiring_soon": 2,
      "avg_freshness": 78.5
    },
    "orders": {
      "pending": 3,
      "this_week": 12,
      "total_revenue": 5400.00
    },
    "performance": [
      {
        "product_name": "Fresh Tomatoes",
        "views": 45,
        "orders": 8,
        "revenue": 1200.00
      }
    ]
  }
}
```

#### `GET /api/analytics/my-activity`
**Access**: Private  
**Description**: Personal user activity analytics

**Response**:
```json
{
  "success": true,
  "data": {
    "activity_summary": {
      "total_searches": "23",
      "products_viewed": "67", 
      "orders_placed": "5",
      "preference_changes": "3"
    },
    "search_patterns": [
      {
        "proximity_weight": 40,
        "freshness_weight": 60,
        "usage_count": 15
      }
    ],
    "recent_activity": [
      {
        "action": "search_request",
        "timestamp": "2026-02-13T10:15:00Z",
        "details": "Searched for tomatoes near Manila"
      }
    ]
  }
}
```

#### `GET /api/analytics/realtime`
**Access**: Private  
**Description**: Real-time activity summary

**Response**:
```json
{
  "success": true,
  "data": {
    "last_5_minutes": {
      "searches_5min": "3",
      "views_5min": "7",
      "orders_5min": "1", 
      "active_users_5min": "5"
    },
    "hourly_comparison": {
      "current_hour_events": "45",
      "previous_hour_events": "38"
    }
  }
}
```

#### `GET /api/analytics/overview`
**Access**: Public  
**Description**: Platform overview statistics

**Response**:
```json
{
  "success": true,
  "data": {
    "total_searches": "1,247",
    "total_products": "89", 
    "total_users": "156",
    "total_orders": "234"
  }
}
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error"
  }
}
```

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful requests |
| 201 | Created | Resource creation |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (duplicate email) |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limiting |
| 500 | Internal Server Error | Server errors |

### Common Error Examples

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request data",
  "details": {
    "email": "Valid email is required",
    "password": "Password must be at least 8 characters"
  }
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions - seller role required"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Product not found"
}
```

#### 409 Conflict  
```json
{
  "success": false,
  "message": "Email already registered"
}
```

#### 429 Rate Limited
```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

---

## Response Format

### Standard Success Response
```json
{
  "success": true,
  "message": "Operation description",
  "data": {
    // Response data
  },
  "metadata": {
    // Additional metadata (pagination, timing, etc.)
  }
}
```

### Pagination Format
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

---

## Request Examples

### Complete User Registration & Product Search Workflow

#### 1. Register a new buyer
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Buyer",
    "email": "john@example.com", 
    "password": "securepass123",
    "type": "buyer",
    "address": "Manila, Philippines"
  }'
```

#### 2. Login 
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

#### 3. Search for products using Chenda algorithm
```bash
curl -X POST http://localhost:3001/api/products/search \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "buyer": {
      "lat": 14.5995,
      "lng": 120.9842
    },
    "config": {
      "max_radius": 15,
      "weights": {
        "proximity_weight": 30,
        "freshness_weight": 70
      },
      "min_freshness_score": 25,
      "mode": "ranking"
    }
  }'
```

#### 4. Get product details
```bash
curl http://localhost:3001/api/products/1 \
  -b cookies.txt
```

#### 5. Create an order
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "product_id": 1,
    "quantity": 5,
    "payment_method": "gcash"
  }'
```

#### 6. Process payment
```bash
curl -X POST http://localhost:3001/api/orders/1/payment \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "payment_method": "gcash",
    "payment_details": {
      "phone": "+639123456789"
    }
  }'
```

### Seller Workflow Example

#### 1. Register as seller
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Seller",
    "email": "maria@farm.com",
    "password": "farmpass123", 
    "type": "seller"
  }'
```

#### 2. Create product listing
```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Fresh Organic Tomatoes",
    "description": "Locally grown organic tomatoes",
    "price": 150.00,
    "quantity": 25,
    "unit": "kg",
    "product_type_id": 45,
    "days_already_used": 1,
    "location": {
      "lat": 14.6042,
      "lng": 121.0100
    }
  }'
```

---

## Common Workflows

### 1. **Buyer Product Discovery Flow**
1. `POST /api/auth/login` - Authenticate
2. `POST /api/products/search` - Search with algorithm
3. `GET /api/products/:id` - View product details  
4. `POST /api/orders` - Create order
5. `POST /api/orders/:id/payment` - Process payment

### 2. **Seller Management Flow**
1. `POST /api/auth/register` (type: "seller")
2. `POST /api/products/upload-image` - Upload product image
3. `POST /api/products` - Create product listing
4. `GET /api/orders?role=seller` - Monitor incoming orders
5. `PUT /api/orders/:id/status` - Update order status

### 3. **Analytics Review Flow**
1. `GET /api/analytics/algorithm` - Algorithm performance
2. `GET /api/analytics/business` - Business metrics
3. `GET /api/analytics/my-activity` - Personal usage
4. `GET /api/analytics/realtime` - Live monitoring

### 4. **User Preference Management**
1. `GET /api/users/profile` - Get current preferences
2. `PUT /api/users/preferences` - Update algorithm weights
3. `POST /api/users/geocode` - Update location
4. `POST /api/products/search/personalized` - Test new preferences

---

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per 15 minutes per IP
- **Geocoding**: 1 request per second (cached for 7 days)

---

## Notes

### Mock Payment System
⚠️ **Important**: This API includes a **mock payment system** for demonstration purposes. No real financial transactions occur. All payment methods (cash, GCash, card) simulate processing with predefined success rates:

- **Cash**: 98% success rate
- **GCash**: 95% success rate  
- **Card**: 90% success rate

### Algorithm Performance
The Chenda ranking algorithm typically runs in **1-4ms** with total API response times averaging **<50ms** for search requests with up to 30 products.

### Session Management
Sessions are stored in PostgreSQL and expire after **24 hours** of inactivity. Session cookies are httpOnly and secure.

---

## Support

For API support or questions, refer to:
- **Repository**: [Chenda Project Repository]
- **Documentation**: This file and inline code comments
- **Test Scripts**: `server/quick-test.sh`, `server/test-*-api.sh`