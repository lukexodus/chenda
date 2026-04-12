# Backend Core Business Logic Use Cases

## Scope
This document catalogs implemented backend use cases from business-logic layers only:
- controllers
- models
- services
- route behaviors directly tied to business outcomes

Out of scope:
- infrastructure/setup scripts
- generic middleware plumbing
- low-level security headers/rate-limit tuning details
- test scaffolding

Primary source folders:
- server/controllers
- server/models
- server/services
- server/routes

## Actor Catalog
- Anonymous user: public discovery and platform overview access.
- Authenticated user: account/profile management and personalized behavior.
- Buyer: product discovery, ordering, payment, delivery tracking.
- Seller: product lifecycle, order status, fulfillment dispatch, refunds, payment reporting.
- Rider: in-house delivery execution and delivery tracking updates.
- Payment provider (Xendit webhook): asynchronous payment state updates.
- System operations: reconciliation and payment monitoring/alerting logic.

## Use Cases

### 1) Identity and Account

| ID | Use Case | Actor | Endpoint(s) | Core Outcome | Key Business Rules |
|---|---|---|---|---|---|
| UC-AUTH-01 | Register account | Anonymous | POST /api/auth/register | Create account and auto-login session | Email unique; password 8-128 with letter+number; type in buyer/seller/both/rider |
| UC-AUTH-02 | Login | Anonymous/Registered | POST /api/auth/login | Start authenticated session | Passport local auth; failed auth attempts rate-limited |
| UC-AUTH-03 | Logout | Authenticated user | POST /api/auth/logout | End session and clear cookie | Requires active auth session |
| UC-AUTH-04 | Get current user | Authenticated user | GET /api/auth/me | Return current profile, location, preferences | User must exist in DB |
| UC-AUTH-05 | Change password | Authenticated user | PUT /api/auth/password | Update password hash | Current password must match; new password complexity enforced |
| UC-USER-01 | Get profile | Authenticated user | GET /api/users/profile | Return full profile data | Requires auth |
| UC-USER-02 | Update profile | Authenticated user | PUT /api/users/profile | Update name/email/type | Email uniqueness checked; type limited to buyer/seller/both |
| UC-USER-03 | Update preferences | Authenticated user | PUT /api/users/preferences | Persist ranking/filter preferences | proximity_weight + freshness_weight must sum to 100; radius and freshness bounds validated |
| UC-USER-04 | Update location | Authenticated user | PUT /api/users/location | Store user geolocation/address | Accepts coordinates or address; validates coordinate ranges; can geocode/reverse-geocode |
| UC-USER-05 | Geocode address | Authenticated user | POST /api/users/geocode | Address to coordinates conversion | Address required |
| UC-USER-06 | Reverse geocode coordinates | Authenticated user | POST /api/users/reverse-geocode | Coordinates to human-readable address | lat/lng required |

### 2) Product Catalog and Product Types

| ID | Use Case | Actor | Endpoint(s) | Core Outcome | Key Business Rules |
|---|---|---|---|---|---|
| UC-PT-01 | List product types | Public | GET /api/product-types | Discover allowable product types for listings | Optional text search across name/subtitle/keywords |
| UC-PT-02 | Get product type detail | Public | GET /api/product-types/:id | Fetch specific type metadata | 404 if missing |
| UC-PROD-01 | Create product listing | Seller | POST /api/products | Create active product listing with geolocation | Requires product_type_id, price, quantity, location; days_already_used < default shelf life; storage condition validated |
| UC-PROD-02 | Get product detail | Public/Auth | GET /api/products/:id | Read full product + seller + product type info | 404 if missing |
| UC-PROD-03 | List own products | Seller | GET /api/products | View seller inventory with pagination/filter | Seller scope enforced by auth route |
| UC-PROD-04 | Update product | Seller owner | PUT /api/products/:id | Modify listing fields and status | Ownership required; field-level validation incl. coordinates, quantity, status set |
| UC-PROD-05 | Remove product (soft) | Seller owner | DELETE /api/products/:id | Set product status to removed | Ownership required |
| UC-PROD-06 | Upload product image | Seller | POST /api/products/upload-image | Store file and return URL for listing usage | Multipart file required |

### 3) Search and Ranking

| ID | Use Case | Actor | Endpoint(s) | Core Outcome | Key Business Rules |
|---|---|---|---|---|---|
| UC-SRCH-01 | Personalized search | Authenticated user (typically buyer) | POST /api/products/search, POST /api/products/search/personalized | Return ranked products from Chenda algorithm | Uses user preferences when present; validates location; fallback global search when radius returns none |
| UC-SRCH-02 | Nearby quick search | Public/Auth | GET /api/products/nearby | Return proximity-focused nearby products | Lat/lng required from query or user location; radius/limit handling |
| UC-SRCH-03 | Public weighted search | Public | GET /api/search/public | Public algorithm search with query-configurable weights | Weight sum must equal 100%; supports ranking/filter mode and sort options |

### 4) Orders and Buyer/Seller Commerce

| ID | Use Case | Actor | Endpoint(s) | Core Outcome | Key Business Rules |
|---|---|---|---|---|---|
| UC-ORD-01 | Create order | Buyer | POST /api/orders | Create pending order from active product | Product must exist/active; quantity available; buyer cannot buy own product; payment method must be enabled |
| UC-ORD-02 | Create batch orders | Buyer | POST /api/orders/batch | Create multiple orders in one request | Same validations as single create applied per item |
| UC-ORD-03 | Get order detail | Buyer/Seller participant | GET /api/orders/:id | Return order with joined commerce details | Only buyer or seller of order can access |
| UC-ORD-04 | List orders | Buyer/Seller/Both-role user | GET /api/orders | Return paginated role-based order list | Supports status filter and role selector (buyer/seller) |
| UC-ORD-05 | Update order status | Seller of order | PUT /api/orders/:id/status | Move order to pending/confirmed/completed/cancelled | Seller-only update; status must be one of allowed set |
| UC-ORD-06 | Get payment methods | Public/Auth | GET /api/orders/payment-methods | Expose enabled payment methods for checkout UI | Feature-flag based methods (cash/gcash) |

### 5) Payments, Refunds, Reconciliation, Monitoring

| ID | Use Case | Actor | Endpoint(s) | Core Outcome | Key Business Rules |
|---|---|---|---|---|---|
| UC-PAY-01 | Initiate order payment | Buyer | POST /api/orders/:id/payment | Create/reuse payment attempt and return checkout/manual flow data | Idempotency-Key required; buyer-only; blocked for cancelled/already-paid orders |
| UC-PAY-02 | Handle webhook payment state | Payment provider | POST /api/webhooks/xendit/ewallet-payment-status, POST /api/webhooks/xendit/invoices, POST /api/webhooks/xendit/payment-requests-v3 | Map provider status to internal status and update payment attempt + order | x-callback-token required; timing-safe comparison; monitored and alerted on failures |
| UC-PAY-03 | Create seller refund | Seller | POST /api/orders/:id/refunds | Execute full/partial refund and update payment state | Allowed only for captured/paid orders; amount must not exceed remaining refundable balance |
| UC-PAY-04 | Run reconciliation | Seller/System | POST /api/orders/reconciliation/run | Detect (and optionally auto-fix) mismatches between orders and latest payment attempts | Treats paid/captured as equivalent; logs reconciliation run summary |
| UC-PAY-05 | Get payment monitoring summary | Seller | GET /api/orders/payment-monitoring/summary | View webhook/payment failure and alert summary | Time window clamped; includes open alerts |
| UC-PAY-06 | Acknowledge payment alert | Seller | POST /api/orders/payment-monitoring/alerts/:alertId/ack | Mark open payment alert acknowledged | Alert must be open and valid |
| UC-PAY-07 | Get seller settlement history | Seller | GET /api/orders/seller/payments/settlements | View settlement records with refund-aware net amounts | Settlement status derived from payment/refund state |
| UC-PAY-08 | Get seller payout overview | Seller | GET /api/orders/seller/payments/overview | Aggregate payout overview and trend | Includes gross/refunded/net metrics and time-bounded trend |

### 6) Delivery, Fulfillment, and Notifications

| ID | Use Case | Actor | Endpoint(s) | Core Outcome | Key Business Rules |
|---|---|---|---|---|---|
| UC-DEL-01 | Assign in-house rider | Seller | POST /api/deliveries/orders/:orderId/assign-in-house | Create/update delivery assignment to rider | Seller must own order; rider must exist, be rider-type, and available |
| UC-DEL-02 | Dispatch third-party courier | Seller | POST /api/deliveries/orders/:orderId/dispatch-third-party | Register third-party fulfillment and tracking reference | Provider + tracking reference required; seller ownership required |
| UC-DEL-03 | Reassign rider | Seller | PUT /api/deliveries/:id/reassign | Change assigned rider for delivery | Seller ownership + valid available rider |
| UC-DEL-04 | List active dispatches | Seller | GET /api/deliveries/dispatch/active | View seller dispatch list | Optional status and paging controls |
| UC-DEL-05 | List available riders | Seller | GET /api/deliveries/dispatch/riders/available | View rider pool and active load | Rider profile availability included |
| UC-DEL-06 | Get delivery SLA metrics | Seller | GET /api/deliveries/dispatch/sla/metrics | Return on-time rate and average delivery time | Days/grace constrained in service logic |
| UC-DEL-07 | Rider dashboard | Rider | GET /api/deliveries/rider/dashboard | Get rider profile, active jobs, today stats | Rider role required |
| UC-DEL-08 | Set rider availability | Rider | PUT /api/deliveries/rider/availability | Toggle availability for assignment | Boolean is_available required |
| UC-DEL-09 | List available rider jobs | Rider | GET /api/deliveries/rider/jobs/available | Discover open in-house jobs | Returns unassigned available deliveries |
| UC-DEL-10 | Accept delivery | Rider | POST /api/deliveries/:id/accept | Claim or confirm assigned delivery | Restricts accepting completed/cancelled/failed deliveries |
| UC-DEL-11 | Decline delivery | Rider | POST /api/deliveries/:id/decline | Decline assignment and release availability | Delivery cannot be in terminal states |
| UC-DEL-12 | Update rider delivery status | Rider | PUT /api/deliveries/:id/status | Progress delivery lifecycle with event logging | Status in accepted/picked_up/in_transit/delivered/failed; ownership enforced |
| UC-DEL-13 | Post rider location update | Rider | POST /api/deliveries/:id/location | Store rider GPS trace and trigger near-destination event | Coordinates validated; near-destination notification emitted once |
| UC-DEL-14 | Upload proof photo (delivery completion) | Rider | POST /api/deliveries/:id/proof-photo | Attach proof and mark delivery delivered | Rider assignment required; file required |
| UC-DEL-15 | Get rider delivery detail | Rider | GET /api/deliveries/rider/:id | View a rider-owned delivery detail | Rider ownership enforced |
| UC-DEL-16 | Get rider history and earnings | Rider | GET /api/deliveries/rider/history | Return delivered job history and computed earnings | Uses rider base fee + percentage model |
| UC-DEL-17 | Get order tracking timeline | Buyer/Seller participant | GET /api/deliveries/orders/:orderId/tracking | Return delivery object + events + location trail | Access only for buyer or seller in order |
| UC-DEL-18 | Report delivery issue | Authenticated buyer/seller | POST /api/deliveries/orders/:orderId/issues | Persist issue report and notify related parties | Message minimum length enforced |
| UC-DEL-19 | List my notifications | Authenticated user | GET /api/deliveries/notifications/me | Return in-app notification feed | User-scoped retrieval |
| UC-DEL-20 | Get unread notification count | Authenticated user | GET /api/deliveries/notifications/me/unread-count | Return unread badge count | Count where read_at is null |
| UC-DEL-21 | Mark one notification read | Authenticated user | POST /api/deliveries/notifications/:notificationId/read | Mark a notification as read | Notification must belong to current user |
| UC-DEL-22 | Mark all notifications read | Authenticated user | POST /api/deliveries/notifications/me/read-all | Bulk-read all unread notifications | User-scoped bulk update |

### 7) Analytics and Operational Insights

| ID | Use Case | Actor | Endpoint(s) | Core Outcome | Key Business Rules |
|---|---|---|---|---|---|
| UC-AN-01 | Algorithm analytics | Authenticated user | GET /api/analytics/algorithm | Weight distribution, search volume, preference-change insights | Period normalized to allowed set |
| UC-AN-02 | Business analytics | Authenticated user (seller-focused scope) | GET /api/analytics/business | Revenue/order/product performance metrics | Scope generally seller-specific unless future admin model |
| UC-AN-03 | Performance analytics | Authenticated user | GET /api/analytics/performance | Error rates and slow endpoint trends | Period constrained to allowed set |
| UC-AN-04 | Seller dashboard analytics | Seller | GET /api/analytics/seller-dashboard | Product performance + recent activity + weekly summary | Seller/both type required |
| UC-AN-05 | My activity analytics | Authenticated user | GET /api/analytics/my-activity | Personal search/preference/order behavior summary | User-scoped analytics events |
| UC-AN-06 | Realtime analytics | Authenticated user | GET /api/analytics/realtime | Last 5-minute activity and hourly comparisons | Event-count based realtime rollups |
| UC-AN-07 | Public analytics overview | Public | GET /api/analytics/overview | Platform daily and all-time topline stats | No authentication required |

## Core Lifecycle States (Implemented)

### Order
- order_status allowed in write paths: pending, confirmed, completed, cancelled.
- payment_status used in flows: pending, authorized, captured, paid, refunded, failed.
- business coupling: successful payment capture/paid updates order_status to confirmed in model updatePaymentStatus.

### Delivery
- statuses used by delivery logic: available, assigned, accepted, picked_up, in_transit, delivered, declined, failed.
- completion paths:
  - status update endpoint can set delivered.
  - proof photo endpoint also sets delivered and delivered_at.

### Notifications
- unread/read represented by nullable read_at.
- unread count is derived by read_at IS NULL.

## Cross-Domain Business Flows

1. Search-to-order flow
- Ranked product discovery (search controller + algorithm).
- Buyer creates order from active inventory.
- Payment method selection gates next payment steps.

2. Payment-to-order state flow
- Buyer initiates payment with idempotency key.
- Payment attempt is recorded (manual or provider-backed).
- Webhook/provider status updates payment state; captured/paid confirms order.

3. Order-to-delivery flow
- Seller dispatches in-house or third-party fulfillment.
- Rider executes status/location/proof updates for in-house jobs.
- Buyer/seller consume tracking timeline and notifications.

4. Exception and financial controls
- Seller issues partial/full refunds.
- Reconciliation compares order payment_status against latest payment attempt and optionally auto-fixes.
- Monitoring emits and tracks payment alerts.

## Notes on Core Logic Boundaries
- This catalog intentionally excludes setup and infra concerns even when endpoints exist.
- All use cases above are derived from currently wired routes/controllers/services in the backend codebase.
