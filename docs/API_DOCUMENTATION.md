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
- **Owner**: Role + ownership verification (e.g., seller can only modify own products)

### Authentication Headers
```javascript
// Session cookie is set automatically after login
// Include cookies in requests for authenticated endpoints
```

---

## API Endpoints

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