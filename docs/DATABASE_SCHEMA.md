# Database Schema

**Database**: PostgreSQL 15 + PostGIS  
**SRID**: 4326 (WGS 84 — standard GPS coordinates)  
**Migrations**: `migrations/001` → `004`

---

## Entity Relationship Diagram

```
┌──────────────┐        ┌──────────────────┐        ┌───────────────────┐
│    users     │        │     products      │        │   product_types   │
│─────────────-│        │──────────────────│        │───────────────────│
│ id (PK)      │◄───┐   │ id (PK)          │───────►│ id (PK)           │
│ name         │    │   │ seller_id (FK)   │        │ name              │
│ email        │    │   │ product_type_id  │        │ name_subtitle     │
│ password_hash│    │   │ days_already_used│        │ category_id       │
│ type         │    │   │ listed_date      │        │ keywords          │
│ location     │    │   │ price            │        │ default_shelf_life │
│ address      │    │   │ quantity         │        │ default_storage   │
│ preferences  │    │   │ unit             │        │ shelf_life_source │
│ created_at   │    │   │ location         │        │ created_at        │
│ updated_at   │    │   │ address          │        │ updated_at        │
│ last_login   │    │   │ storage_condition│        └───────────────────┘
└──────────────┘    │   │ description      │
       ▲            │   │ image_url        │
       │            │   │ status           │
       │            │   │ created_at       │
       │            │   │ updated_at       │
       │            │   └──────────────────┘
       │                        ▲
       │   ┌────────────────────┘
       │   │
┌──────┴───┴──────┐        ┌──────────────────────┐
│     orders      │        │   analytics_events   │
│─────────────────│        │──────────────────────│
│ id (PK)         │        │ id (PK)              │
│ buyer_id (FK)   │        │ user_id (FK)         │
│ seller_id (FK)  │        │ event_name           │
│ product_id (FK) │        │ event_properties     │
│ quantity        │        │ session_id           │
│ unit_price      │        │ timestamp            │
│ total_amount    │        │ user_agent           │
│ payment_method  │        │ ip_address           │
│ payment_status  │        └──────────────────────┘
│ transaction_id  │
│ order_status    │        ┌──────────────────────┐
│ created_at      │        │       session        │
│ updated_at      │        │──────────────────────│
│ completed_at    │        │ sid (PK)             │
└─────────────────┘        │ sess                 │
                           │ expire               │
                           └──────────────────────┘
```

---

## Tables

### `users`

Stores buyer, seller, and dual-role accounts. Location is stored as a PostGIS point for geospatial queries.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `SERIAL` | PK | Auto-increment user ID |
| `name` | `VARCHAR(255)` | NOT NULL | Display name |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | Login email |
| `password_hash` | `VARCHAR(255)` | NOT NULL | bcrypt hash |
| `type` | `VARCHAR(20)` | NOT NULL, CHECK | `'buyer'`, `'seller'`, or `'both'` |
| `location` | `GEOMETRY(Point, 4326)` | nullable | GPS coordinates (PostGIS) |
| `address` | `TEXT` | nullable | Human-readable address |
| `preferences` | `JSONB` | DEFAULT (see below) | Search/display preferences |
| `email_verified` | `BOOLEAN` | DEFAULT false | Email verification flag |
| `verification_token` | `VARCHAR(255)` | nullable | Email verification token |
| `verification_token_expires` | `TIMESTAMP` | nullable | Token expiry |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | Record creation time |
| `updated_at` | `TIMESTAMP` | DEFAULT NOW(), auto-updated | Last modification time |
| `last_login` | `TIMESTAMP` | nullable | Last login timestamp |

**`preferences` JSONB default structure:**
```json
{
  "proximity_weight": 50,
  "shelf_life_weight": 50,
  "max_radius_km": 50,
  "min_freshness_percent": 0,
  "display_mode": "ranking",
  "storage_condition": "refrigerated"
}
```

> `proximity_weight` and `shelf_life_weight` are sent to the ranking algorithm as 0–1 floats (divided by 100 before the API call).

---

### `product_types`

Reference table seeded from USDA FoodKeeper data. Defines shelf life norms per food category. Not user-editable.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | PK | USDA FoodKeeper item ID |
| `name` | `VARCHAR(255)` | NOT NULL | Product type name (e.g., "Chicken, Fresh") |
| `name_subtitle` | `TEXT` | nullable | Subtype or variant |
| `category_id` | `INTEGER` | nullable | USDA category grouping |
| `keywords` | `TEXT` | nullable | Full-text search keywords |
| `default_shelf_life_days` | `INTEGER` | NOT NULL | Total shelf life in days |
| `default_storage_condition` | `VARCHAR(50)` | NOT NULL, CHECK | Storage condition key (see enum below) |
| `shelf_life_source` | `JSONB` | nullable | Raw USDA source data |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMP` | DEFAULT NOW(), auto-updated | |

**Storage condition enum** (shared by `product_types` and `products`):

| Value | Meaning |
|---|---|
| `pantry` | Unopened, room temperature |
| `pantry_opened` | Opened, room temperature |
| `refrigerated` | Unopened, refrigerated |
| `refrigerated_opened` | Opened, refrigerated |
| `frozen` | Unopened, frozen |
| `frozen_opened` | Opened, frozen |

---

### `products`

Listings created by sellers. Each product references a `product_type` for shelf life data and stores its own GPS location.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `SERIAL` | PK | Auto-increment product ID |
| `seller_id` | `INTEGER` | FK → `users.id` ON DELETE CASCADE, NOT NULL | Owning seller |
| `product_type_id` | `INTEGER` | FK → `product_types.id`, NOT NULL | Food type reference |
| `days_already_used` | `INTEGER` | NOT NULL, DEFAULT 0, CHECK ≥ 0 | Days the product has been stored before listing |
| `listed_date` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | Date the product was listed |
| `price` | `DECIMAL(10,2)` | NOT NULL, CHECK ≥ 0 | Price per unit |
| `quantity` | `DECIMAL(10,2)` | NOT NULL, CHECK > 0 | Available quantity |
| `unit` | `VARCHAR(50)` | NOT NULL, DEFAULT `'pieces'` | Unit of measurement |
| `location` | `GEOMETRY(Point, 4326)` | NOT NULL | Product pickup location (PostGIS) |
| `address` | `TEXT` | nullable | Human-readable address |
| `storage_condition` | `VARCHAR(50)` | NOT NULL, CHECK | Current storage condition (see enum above) |
| `description` | `TEXT` | nullable | Seller-provided description |
| `image_url` | `TEXT` | nullable | Path to uploaded image (served via `/uploads/`) |
| `status` | `VARCHAR(20)` | DEFAULT `'active'`, CHECK | `'active'`, `'sold'`, `'expired'`, `'removed'` |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMP` | DEFAULT NOW(), auto-updated | |

**Freshness calculation** (computed at query time, not stored):

$$\text{freshness\%} = \frac{\text{default\_shelf\_life\_days} - \text{days\_already\_used}}{\text{default\_shelf\_life\_days}} \times 100$$

**Expiration date:**

$$\text{expiration} = \text{listed\_date} + (\text{default\_shelf\_life\_days} - \text{days\_already\_used}) \text{ days}$$

---

### `orders`

Records transactions between buyers and sellers. Uses a mock payment system.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `SERIAL` | PK | Auto-increment order ID |
| `buyer_id` | `INTEGER` | FK → `users.id` ON DELETE CASCADE, NOT NULL | Buyer |
| `seller_id` | `INTEGER` | FK → `users.id` ON DELETE CASCADE, NOT NULL | Seller |
| `product_id` | `INTEGER` | FK → `products.id` ON DELETE RESTRICT, NOT NULL | Ordered product |
| `quantity` | `DECIMAL(10,2)` | NOT NULL, CHECK > 0 | Quantity ordered |
| `unit_price` | `DECIMAL(10,2)` | NOT NULL, CHECK ≥ 0 | Price at time of order |
| `total_amount` | `DECIMAL(10,2)` | NOT NULL, CHECK ≥ 0 | `quantity × unit_price` |
| `payment_method` | `VARCHAR(50)` | CHECK | `'cash'`, `'gcash'`, `'card'` |
| `payment_status` | `VARCHAR(20)` | DEFAULT `'pending'`, CHECK | `'pending'`, `'paid'`, `'failed'`, `'refunded'` |
| `transaction_id` | `VARCHAR(255)` | nullable | Mock payment transaction reference |
| `order_status` | `VARCHAR(20)` | DEFAULT `'pending'`, CHECK | `'pending'`, `'confirmed'`, `'completed'`, `'cancelled'` |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMP` | DEFAULT NOW(), auto-updated | |
| `completed_at` | `TIMESTAMP` | nullable | Timestamp when order reached `'completed'` |

> `ON DELETE RESTRICT` on `product_id` prevents deleting a product that has associated orders.

---

### `analytics_events`

Append-only event log for algorithm analytics and business metrics.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `SERIAL` | PK | |
| `user_id` | `INTEGER` | FK → `users.id` ON DELETE SET NULL, nullable | Associated user (null for anonymous) |
| `event_name` | `VARCHAR(100)` | NOT NULL | Event identifier (e.g., `search_performed`) |
| `event_properties` | `JSONB` | nullable | Arbitrary event payload |
| `session_id` | `VARCHAR(255)` | nullable | Client session identifier |
| `timestamp` | `TIMESTAMP` | DEFAULT NOW() | Event time |
| `user_agent` | `TEXT` | nullable | Browser/client user agent |
| `ip_address` | `INET` | nullable | Client IP address |

---

### `session`

Managed by `connect-pg-simple`. Stores Express session data in the database.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `sid` | `VARCHAR` | PK | Session ID |
| `sess` | `JSON` | NOT NULL | Serialized session object |
| `expire` | `TIMESTAMP(6)` | NOT NULL | Expiry timestamp |

---

## Indexes

### B-tree Indexes

| Index | Table | Columns | Purpose |
|---|---|---|---|
| `idx_users_email` | `users` | `email` | Login lookup |
| `idx_users_email_lower` | `users` | `lower(email)` | Case-insensitive login lookup |
| `idx_users_type` | `users` | `type` | Filter by role |
| `idx_product_types_name` | `product_types` | `name` | Product type search |
| `idx_product_types_category` | `product_types` | `category_id` | Category filter |
| `idx_products_seller` | `products` | `seller_id` | Seller's product list |
| `idx_products_type` | `products` | `product_type_id` | Filter by food type |
| `idx_products_status` | `products` | `status` | Filter active/sold/expired |
| `idx_products_listed_date` | `products` | `listed_date` | Sort by recency |
| `idx_products_storage` | `products` | `storage_condition` | Storage filter |
| `idx_products_seller_status_listed` | `products` | `(seller_id, status, listed_date DESC)` | Seller product listing query |
| `idx_products_active_listed_date` | `products` | `listed_date DESC` WHERE `status='active'` | Active product expiration queries |
| `idx_orders_buyer` | `orders` | `buyer_id` | Buyer order history |
| `idx_orders_seller` | `orders` | `seller_id` | Seller order management |
| `idx_orders_product` | `orders` | `product_id` | Orders per product |
| `idx_orders_status` | `orders` | `order_status` | Filter by order status |
| `idx_orders_payment_status` | `orders` | `payment_status` | Filter by payment status |
| `idx_orders_created` | `orders` | `created_at DESC` | Sort by date |
| `idx_orders_buyer_status_created` | `orders` | `(buyer_id, order_status, created_at DESC)` | Buyer order history listing |
| `idx_orders_seller_status_created` | `orders` | `(seller_id, order_status, created_at DESC)` | Seller order listing |
| `idx_orders_created_desc` | `orders` | `created_at DESC` | Platform-wide recent orders |
| `idx_analytics_event_name` | `analytics_events` | `event_name` | Filter by event type |
| `idx_analytics_user` | `analytics_events` | `user_id` | Per-user activity |
| `idx_analytics_timestamp` | `analytics_events` | `timestamp DESC` | Time-range queries |
| `idx_analytics_session` | `analytics_events` | `session_id` | Session-level analytics |
| `idx_analytics_events_created_desc` | `analytics_events` | `timestamp DESC` | Dashboard time-range queries |
| `idx_analytics_events_type_created` | `analytics_events` | `(event_name, timestamp DESC)` | Event type + time range |
| `idx_analytics_events_user_created` | `analytics_events` | `(user_id, timestamp DESC)` | Per-user activity queries |
| `IDX_session_expire` | `session` | `expire` | Expired session cleanup |

### GiST Indexes (PostGIS Spatial)

| Index | Table | Column | Purpose |
|---|---|---|---|
| `idx_users_location` | `users` | `location` | Nearest seller queries |
| `idx_products_location` | `products` | `location` | Radius search (`ST_DWithin`) |
| `idx_products_active_location` | `products` | `location` WHERE `status='active'` | Partial spatial index for active listings |
| `idx_products_active_location_gist` | `products` | `location` WHERE `status='active'` | Additional partial GIST index |

### GIN Indexes (Full-text / JSONB)

| Index | Table | Expression | Purpose |
|---|---|---|---|
| `idx_product_types_keywords` | `product_types` | `to_tsvector('english', keywords)` | Full-text keyword search |
| `idx_analytics_properties` | `analytics_events` | `event_properties` | JSONB property filtering |

---

## Database Functions

| Function | Returns | Description |
|---|---|---|
| `calculate_distance_km(lat1, lng1, lat2, lng2)` | `DOUBLE PRECISION` | Great-circle distance in km using `ST_Distance` on `geography` type |
| `get_products_within_radius(lat, lng, radius_km)` | `TABLE(product_id, distance_km)` | Returns active products within radius using `ST_DWithin` |
| `calculate_shelf_life_percent(total, days_used)` | `DOUBLE PRECISION` | Freshness percentage (0–100) |
| `calculate_expiration_date(listed_date, total, days_used)` | `TIMESTAMP` | Projected expiration date |
| `is_product_expired(listed_date, total, days_used)` | `BOOLEAN` | True if expiration date has passed |
| `update_updated_at_column()` | `TRIGGER` | Sets `updated_at = NOW()` before every UPDATE |

---

## Triggers

| Trigger | Table | Event | Action |
|---|---|---|---|
| `update_users_updated_at` | `users` | BEFORE UPDATE | Calls `update_updated_at_column()` |
| `update_product_types_updated_at` | `product_types` | BEFORE UPDATE | Calls `update_updated_at_column()` |
| `update_products_updated_at` | `products` | BEFORE UPDATE | Calls `update_updated_at_column()` |
| `update_orders_updated_at` | `orders` | BEFORE UPDATE | Calls `update_updated_at_column()` |

---

## Views

| View | Description |
|---|---|
| `products_enriched` | `products` joined with `product_types` and `users`, plus `longitude`/`latitude` extracted from PostGIS point |
| `products_active` | Filtered subset of `products_enriched` where `status = 'active'` |

### Materialized View: `products_search_cache`

Pre-computes freshness metrics for all active products to speed up the ranking algorithm. Includes:
- All `products` columns
- Joined `product_types` fields (`product_name`, `default_shelf_life_days`, `keywords`, etc.)
- Joined `users` fields (`seller_name`, `seller_email`)
- Extracted `longitude` / `latitude` from PostGIS geometry
- **Pre-calculated**: `freshness_percent`, `expiration_date`, `remaining_days`, `is_expired`

> Must be refreshed with `REFRESH MATERIALIZED VIEW products_search_cache;` after bulk product updates.

---

## Foreign Key Summary

| FK Column | References | On Delete |
|---|---|---|
| `products.seller_id` | `users.id` | CASCADE |
| `products.product_type_id` | `product_types.id` | (default: RESTRICT) |
| `orders.buyer_id` | `users.id` | CASCADE |
| `orders.seller_id` | `users.id` | CASCADE |
| `orders.product_id` | `products.id` | RESTRICT |
| `analytics_events.user_id` | `users.id` | SET NULL |

---

## Migration Files

| File | Description |
|---|---|
| [001_create_tables.sql](../migrations/001_create_tables.sql) | Core tables, triggers, views |
| [002_create_indexes.sql](../migrations/002_create_indexes.sql) | Spatial indexes, helper functions, materialized view |
| [003_create_session_table.sql](../migrations/003_create_session_table.sql) | Session table for `connect-pg-simple` |
| [004_optimize_indexes.sql](../migrations/004_optimize_indexes.sql) | Composite B-tree indexes for high-frequency query patterns |

Run all migrations with:
```bash
node migrations/migrate.js up
```
