# Chenda Project — Learning Guide

**Goal:** After reading this guide, you will understand how every module is organized, how they integrate with each other, and how data flows across every layer — enough to confidently modify any part of the system.

**How to use this guide:** Read the chapters in order. Each chapter builds on the previous one. File links are clickable — open them side-by-side as you read.

**Cross-references:** For deeper dives into specific topics, see the companion docs listed at the end of each chapter.

---

## Table of Contents

1. [Chapter 1 — The Big Picture](#chapter-1--the-big-picture)
2. [Chapter 2 — The Data Layer (PostgreSQL + PostGIS)](#chapter-2--the-data-layer-postgresql--postgis)
3. [Chapter 3 — The Algorithm (chenda-algo → server/algorithm)](#chapter-3--the-algorithm-chenda-algo--serveralgorithm)
4. [Chapter 4 — The Backend Server (Express.js)](#chapter-4--the-backend-server-expressjs)
5. [Chapter 5 — The Frontend (Next.js + React)](#chapter-5--the-frontend-nextjs--react)
6. [Chapter 6 — How Everything Connects: End-to-End Data Flows](#chapter-6--how-everything-connects-end-to-end-data-flows)
7. [Chapter 7 — Cross-Cutting Concerns](#chapter-7--cross-cutting-concerns)
8. [Chapter 8 — Development & Deployment Infrastructure](#chapter-8--development--deployment-infrastructure)
9. [Chapter 9 — Decision Map for Modifications](#chapter-9--decision-map-for-modifications)

---

## Chapter 1 — The Big Picture

### 1.1 What Is Chenda?

Chenda is a **marketplace for perishable goods** (fruits, vegetables, dairy, meat) in the Philippines. Its core differentiator is a **proximity-freshness ranking algorithm** — when a buyer searches, products are scored by a weighted combination of *how close the seller is* and *how fresh the product still is*, based on USDA shelf-life data.

### 1.2 The Three Tiers

The system is a classic **3-tier client-server** architecture. Every request flows through these three layers:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION TIER                            │
│  Next.js 16 + React 19 + Zustand + shadcn/ui + Leaflet             │
│  Port 3000                                                          │
│  Renders UI, manages client state, sends API calls                  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTP (JSON + session cookies)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION TIER                              │
│  Express.js 5 + Passport.js + Chenda Algorithm                      │
│  Port 3001                                                          │
│  Routes → Middleware → Controllers → Models → Services              │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ SQL (pg Pool, parameterized queries)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           DATA TIER                                 │
│  PostgreSQL 15 + PostGIS extension                                  │
│  Port 5432                                                          │
│  Users, Products, Product Types, Orders, Sessions, Analytics        │
└─────────────────────────────────────────────────────────────────────┘
```

**Key rule:** The frontend *never* talks to the database directly. Every data operation goes through the backend API.

### 1.3 The Module Map

Here is a bird's-eye view of every directory and what it is responsible for:

```
chenda/                              ← Project root (monorepo)
│
├── server/                          ← APPLICATION TIER: Express.js API
│   ├── app.js                       ← Entry point: wires middleware + routes
│   ├── config/                      ← Database pool, Passport setup, env loading
│   ├── routes/                      ← HTTP verb + path → controller mapping
│   ├── middleware/                   ← Auth guards, validation, uploads, analytics
│   ├── controllers/                 ← Request handlers (business orchestration)
│   ├── models/                      ← Database access (SQL queries)
│   ├── services/                    ← Complex/external operations (payment, geocoding)
│   ├── algorithm/                   ← Chenda ranking algorithm (integrated copy)
│   └── __tests__/                   ← Jest + Supertest backend tests
│
├── chenda-frontend/                 ← PRESENTATION TIER: Next.js app
│   └── src/
│       ├── app/                     ← File-system router (pages + layouts)
│       ├── components/              ← React components organized by domain
│       ├── lib/                     ← API client, Zustand stores, types, utils
│       ├── hooks/                   ← Custom React hooks
│       └── __tests__/               ← React Testing Library tests
│
├── chenda-algo/                     ← STANDALONE algorithm (original, for testing)
│   └── src/                         ← Algorithm source + test runner
│
├── migrations/                      ← DATA TIER: SQL schema definitions
│   ├── 001_create_tables.sql        ← Core tables
│   ├── 002_create_indexes.sql       ← Spatial + B-tree indexes
│   ├── ...
│   └── migrate.js                   ← Migration runner
│
├── seeds/                           ← Test data (180 USDA product types, mock users)
├── e2e/                             ← Playwright end-to-end tests
├── docker-compose.yml               ← Container orchestration (all 3 tiers)
└── docs/                            ← Documentation (you are here)
```

### 1.4 The Actors

| Actor | Role in system | User type value |
|-------|---------------|-----------------|
| **Buyer** | Searches products, places orders, tracks deliveries | `buyer` |
| **Seller** | Lists products, manages inventory, fulfills orders | `seller` |
| **Both** | Can act as buyer AND seller | `both` |
| **Rider** | Accepts delivery assignments, updates status/GPS | `rider` |

> **📖 Deeper reading:** [ARCHITECTURE.md](ARCHITECTURE.md) for the tech stack, [SE_CONCEPTS.md](learn/SE_CONCEPTS.md) §1 for the architecture pattern explained.

---

## Chapter 2 — The Data Layer (PostgreSQL + PostGIS)

**Read this chapter first.** Everything else in the system is built around this data model. If you understand the tables and their relationships, the rest falls into place.

### 2.1 The Core Entity Relationships

```
                    ┌──────────────┐
                    │  product_types│ (180 rows, USDA FoodKeeper)
                    │  ────────────│
                    │  id (PK)     │ ← Seeded reference data
                    │  name        │   e.g. "Chicken, Fresh"
                    │  shelf_life  │   e.g. 3 days (refrigerated)
                    │  storage     │   e.g. "refrigerated"
                    └──────┬───────┘
                           │ product_type_id (FK)
                           │
┌──────────────┐    ┌──────┴───────────┐    ┌─────────────────┐
│    users     │◄───│    products       │    │     orders       │
│  ────────────│    │  ────────────────│    │  ───────────────│
│  id (PK)     │    │  id (PK)         │    │  id (PK)        │
│  name        │    │  seller_id (FK)──┼────│  buyer_id (FK)  │
│  email       │    │  price           │    │  seller_id (FK) │
│  type        │    │  quantity        │    │  product_id (FK)│
│  location ●  │    │  location ●      │    │  quantity       │
│  preferences │    │  days_used       │    │  total_amount   │
│  (JSONB)     │    │  status          │    │  order_status   │
└──────────────┘    └──────────────────┘    │  payment_status │
                                            └─────────────────┘
                    ● = PostGIS GEOMETRY(Point, 4326) — GPS coordinates
```

### 2.2 How the Tables Work Together

**The fundamental chain is:**

1. **product_types** — a read-only reference table seeded from USDA data. It tells the system "Chicken, Fresh" has a default shelf life of 3 days when refrigerated. *You never modify this at runtime.*

2. **users** — stores buyers, sellers, riders. Each user has a PostGIS `location` point (their GPS coordinates) and a JSONB `preferences` column that holds their algorithm tuning settings.

3. **products** — a seller creates a listing by picking a `product_type_id` (e.g. "Tomatoes"), setting `days_already_used` (how many days old it is at listing time), and providing a GPS location. The **freshness score is computed at query time**, not stored:
   ```
   freshness% = (shelf_life - days_used) / shelf_life × 100
   ```

4. **orders** — records a buyer purchasing from a seller. The `product_id` FK prevents deleting a product that has orders (`ON DELETE RESTRICT`).

5. **Supporting tables:** `analytics_events` (append-only telemetry), `session` (Passport.js sessions), `deliveries` + `delivery_events` + `delivery_locations` + `delivery_notifications` (logistics).

### 2.3 Why PostGIS Matters

PostGIS adds spatial data types and functions to PostgreSQL. Two critical operations depend on it:

| Operation | PostGIS function | Where used |
|-----------|-----------------|------------|
| "Find all products within 10km of the buyer" | `ST_DWithin(location, buyer_point, radius)` | `Product.getProductsWithMetrics()` |
| "Calculate exact distance from buyer to seller" | `ST_Distance(a, b) / 1000` → km | Same method, returned as `distance_km` |

The database does the spatial math — not JavaScript. GIST indexes on the `location` columns make radius queries fast even with thousands of products.

### 2.4 Migrations — How the Schema Evolves

Migrations live in `migrations/` and run sequentially:

| Migration | What it creates |
|-----------|----------------|
| `001_create_tables.sql` | All core tables, CHECK constraints, triggers, views |
| `002_create_indexes.sql` | Spatial (GIST) indexes, B-tree indexes, helper functions, materialized view |
| `003_create_session_table.sql` | Session storage for `connect-pg-simple` |
| `004_optimize_indexes.sql` | Composite indexes for common query patterns |
| `005–008` | Payment integration, refunds, delivery/fulfillment tables |

Run them with `node migrations/migrate.js up`. The runner tracks which have been applied and only runs new ones.

**To modify the schema:** Add a new file `009_your_change.sql` and run the migrator. Never edit existing migration files that have already been applied.

> **📖 Deeper reading:** [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for the complete column reference, index catalog, and function reference.

---

## Chapter 3 — The Algorithm (chenda-algo → server/algorithm)

### 3.1 History: Two Copies

The algorithm exists in two places:

| Location | Purpose |
|----------|---------|
| `chenda-algo/` | The **original standalone module**, developed and tested in isolation with its own test runner. This is where the algorithm was *built from scratch*. |
| `server/algorithm/` | The **integrated copy** used by the live server. Same logic, imported by the search controller. |

The standalone `chenda-algo` was developed first during the proof-of-concept phase. Once it was validated, the algorithm was copied into `server/algorithm/` and wired up to the backend. If you're modifying the algorithm, change `server/algorithm/` (the live copy).

### 3.2 The Algorithm Pipeline

The algorithm was built in 7 phases, and its final form is a 4-step pipeline inside `server/algorithm/chenda_algorithm.js`:

```
                    ┌──────────────────────────────┐
                    │  Raw products from database   │
                    │  (with distance_km pre-        │
                    │   computed by PostGIS)         │
                    └──────────────┬───────────────┘
                                   ▼
              STEP 1: ENRICH ─────────────────────
              For each product, calculate:
              • distance_km (Haversine formula)
              • freshness_percent (shelf life math)
              • expiration_date
              • is_expired flag
                                   ▼
              STEP 2: FILTER ─────────────────────
              Remove products that fail:
              • distance > max_radius
              • freshness < min_freshness_score
              • wrong storage condition
                                   ▼
              STEP 3: SCORE & RANK ───────────────
              If mode = "ranking":
                score = (proximity_weight × proximity_score)
                      + (freshness_weight × freshness_score)
                Sort by score descending
              If mode = "filter":
                Sort by user's chosen criterion
                (price / distance / freshness)
                                   ▼
              STEP 4: RETURN ─────────────────────
              { products: [...], metadata: { execution_time_ms, stats } }
```

### 3.3 Algorithm Module Breakdown

| File | Responsibility |
|------|---------------|
| `algorithm/chenda_algorithm.js` | **Orchestrator**: wires the pipeline, validates config, returns results |
| `algorithm/calculations/haversine.js` | Haversine formula: `(lat1, lng1, lat2, lng2) → distance in km` |
| `algorithm/calculations/shelf-life.js` | `(product) → { remaining_days, freshness_percent, expiration_date, is_expired }` |
| `algorithm/scoring/combined-score.js` | Weighted combination of proximity + freshness scores |
| `algorithm/scoring/score-normalizer.js` | Normalizes raw distance/freshness to 0–100 scale |
| `algorithm/ranking/product_ranker.js` | Scores all products and sorts by combined score; has weight presets |
| `algorithm/ranking/product_sorter.js` | Sorts products by a single criterion (price, distance, freshness) |
| `algorithm/product-display/product_filter.js` | Applies radius, freshness, storage filters |

### 3.4 How a Weight Change Flows

When the user moves the "Freshness" slider from 50 to 80 on the frontend:

1. **Frontend** (`searchStore.ts`): `proximityWeight = 20, freshnessWeight = 80`
2. **API call**: `POST /api/products/search` with `weights: { proximity_weight: 0.2, freshness_weight: 0.8 }`
3. **Search controller** passes these weights into `chendaAlgorithm(buyer, products, config)`
4. **Algorithm** uses these weights in `score = 0.2 × proximity + 0.8 × freshness`
5. Products are re-ranked accordingly

> **📖 Deeper reading:** [SE_CONCEPTS.md](learn/SE_CONCEPTS.md) §20 for the weighted scoring math, `chenda-algo/README.md` for the 7-phase development history.

---

## Chapter 4 — The Backend Server (Express.js)

### 4.1 The Server's Internal Architecture

The server follows a **modified MVC** pattern with a service layer:

```
                    HTTP Request
                         │
                         ▼
┌──────────────────────────────────────────────────┐
│                   app.js                          │
│  Global middleware chain:                         │
│  compression → helmet → cors → session →          │
│  passport → sanitize → logger → analytics         │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│                  routes/*.js                      │
│  Maps URL paths to controller functions           │
│  Applies route-level middleware:                   │
│  isAuthenticated → isSeller → uploadImage →        │
│  validateProduct → controller                     │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│              controllers/*.js                     │
│  Business orchestration:                          │
│  • Validates request data                         │
│  • Calls models for DB operations                 │
│  • Calls services for external/complex ops        │
│  • Calls algorithm for search                     │
│  • Sends JSON response                            │
└───────┬──────────────────────┬───────────────────┘
        │                      │
        ▼                      ▼
┌───────────────┐    ┌──────────────────┐
│  models/*.js  │    │  services/*.js   │
│  DB access    │    │  External ops    │
│  (SQL queries,│    │  (payments,      │
│   PostGIS)    │    │   geocoding,     │
│               │    │   analytics)     │
└───────┬───────┘    └──────────────────┘
        │
        ▼
    PostgreSQL
```

### 4.2 The Route → Controller → Model Chain

Let's trace a concrete example: **creating a product listing**.

**Step 1: Route** — `server/routes/products.js`
```javascript
router.post('/', isAuthenticated, isSeller, validateCreateProduct, checkValidation, asyncHandler(createProduct));
```
This says: to `POST /api/products`, the request must pass 4 middleware checks before reaching the controller.

**Step 2: Middleware chain** (executed left to right):
| Middleware | What it does | If it fails |
|-----------|-------------|-------------|
| `isAuthenticated` | Checks `req.user` exists (session cookie valid) | Returns 401 |
| `isSeller` | Checks `req.user.type` is `seller` or `both` | Returns 403 |
| `validateCreateProduct` | Validates body fields (price ≥ 0, valid lat/lng, etc.) | Returns 422 |
| `checkValidation` | Collects validation errors and returns them | Returns 422 |

**Step 3: Controller** — `server/controllers/productController.js`
```javascript
const createProduct = async (req, res) => {
  const productData = { seller_id: req.user.id, ...req.body };
  const product = await Product.create(productData);
  res.status(201).json({ success: true, product });
};
```
The controller extracts the seller ID from the session, passes the data to the model, and returns JSON.

**Step 4: Model** — `server/models/Product.js`
```javascript
Product.create = async (productData) => {
  const result = await query(`
    INSERT INTO products (seller_id, ..., location)
    VALUES ($1, ..., ST_SetSRID(ST_MakePoint($7, $8), 4326))
    RETURNING ...
  `, params);
  return result.rows[0];
};
```
The model runs a parameterized SQL query with PostGIS functions and returns the created row.

### 4.3 File-by-File Reference

#### Routes (URL mapping)

| File | Mounts at | Responsibility |
|------|----------|----------------|
| `routes/auth.js` | `/api/auth` | Login, register, logout, me, password |
| `routes/search.js` | `/api/products` + `/api/search` | Algorithm search, nearby, public search |
| `routes/products.js` | `/api/products` | CRUD for seller products |
| `routes/productTypes.js` | `/api/product-types` | Read USDA product types |
| `routes/users.js` | `/api/users` | Profile, preferences, location, geocoding |
| `routes/orders.js` | `/api/orders` | Create/list/pay/update orders + payment ops |
| `routes/deliveries.js` | `/api/deliveries` | Dispatch, rider, tracking, notifications |
| `routes/analytics.js` | `/api/analytics` | Dashboard analytics endpoints |
| `routes/xenditWebhooks.js` | `/api/webhooks/xendit` | Payment provider callbacks |
| `routes/health.js` | `/api/health` | Server + DB health check |

#### Controllers (business logic)

| File | Key functions |
|------|--------------|
| `authController.js` | register, login, logout, getCurrentUser, changePassword |
| `searchController.js` | searchProducts (runs algorithm), getNearbyProducts, publicSearch |
| `productController.js` | createProduct, getMyProducts, updateProduct, deleteProduct, uploadImage |
| `userController.js` | getProfile, updateProfile, updatePreferences, updateLocation, geocode |
| `orderController.js` | createOrder, getOrders, getOrderById, processPayment, updateStatus |
| `deliveryController.js` | assignRider, dispatchThirdParty, riderStatusUpdate, tracking, notifications |
| `analyticsController.js` | algorithmAnalytics, businessAnalytics, sellerDashboard, realtime |

#### Models (database access)

| File | Table(s) | Key methods |
|------|---------|-------------|
| `User.js` | `users` | findByEmail, findById, create, updateProfile, updatePreferences, updateLocation |
| `Product.js` | `products` + `product_types` + `users` | getProductsWithMetrics, findById, create, update, delete, findBySeller |
| `ProductType.js` | `product_types` | getAll, findById, search |
| `Order.js` | `orders` + `products` + `users` | create, getById, getByBuyer, getBySeller, updateStatus, updatePaymentStatus |
| `Delivery.js` | `deliveries` + `delivery_events` + `delivery_locations` + `delivery_notifications` | createOrUpdate, findByOrder, updateStatus, addLocation, addEvent |
| `PaymentAttempt.js` | `payment_attempts` | create, findByOrder, updateStatus |
| `Refund.js` | `refunds` | create, findByOrder |

#### Services (complex/external operations)

| File | What it does |
|------|-------------|
| `paymentService.js` | Mock payment processing (simulates Cash/GCash/Card transactions) |
| `geocodingService.js` | Calls Nominatim API for address ↔ coordinates, with 7-day caching |
| `analyticsService.js` | Reads `analytics_events` table for dashboard queries |
| `deliveryNotificationService.js` | Creates in-app notifications for delivery lifecycle events |
| `xenditService.js` | Xendit payment gateway integration |
| `paymentMonitoringService.js` | Webhook failure alerts, payment health monitoring |
| `paymentReconciliationService.js` | Order-vs-payment mismatch detection and auto-fix |
| `paymentReportingService.js` | Seller settlement history and payout overview |

#### Middleware (cross-cutting)

| File | What it does |
|------|-------------|
| `authenticate.js` | `isAuthenticated`, `isSeller`, `isBuyer`, `isRider` guards |
| `validateProduct.js` | express-validator rules for product create/update |
| `sanitize.js` | Strips HTML/XSS from all request bodies |
| `uploadImage.js` | Multer: product image upload (5MB max, jpeg/png/webp) |
| `uploadProofPhoto.js` | Multer: delivery proof photo upload (7MB max) |
| `errorHandler.js` | Centralized error response formatting |
| `asyncHandler.js` | Wraps async controllers for Express error forwarding |
| `analyticsMiddleware.js` | Auto-tracks response time, auth events, preference changes |
| `logger.js` | Request/response logging |

### 4.4 How Routes Mount in app.js

In `server/app.js`, routes are mounted in a specific order that matters:

```javascript
app.use('/api/products', searchRoutes);    // Search routes FIRST (more specific paths)
app.use('/api/products', productRoutes);   // CRUD routes SECOND (less specific paths)
```

The search routes handle `/api/products/search` and `/api/products/nearby`. The product CRUD routes handle `/api/products`, `/api/products/:id`. Order matters because Express matches routes top-to-bottom.

> **📖 Deeper reading:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for the full endpoint reference, [BACKEND_CORE_USE_CASES.md](BACKEND_CORE_USE_CASES.md) for the use case catalog.

---

## Chapter 5 — The Frontend (Next.js + React)

### 5.1 The Frontend's Internal Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js App Shell                          │
│  layout.tsx → AuthProvider → ErrorBoundary → Toaster            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼────────────────┐
            ▼               ▼                ▼
    ┌──────────────┐ ┌─────────────┐ ┌──────────────┐
    │  (auth)      │ │  (buyer)    │ │  seller      │
    │  /login      │ │  /buyer     │ │  /seller     │
    │  /register   │ │  /cart      │ │  /products   │
    │              │ │  /checkout  │ │  /orders     │
    │              │ │  /orders    │ │  /profile    │
    │              │ │  /profile   │ │  /dashboard  │
    └──────────────┘ └─────────────┘ └──────────────┘
                            │
            ┌───────────────┼────────────────┐
            ▼               ▼                ▼
    ┌──────────────┐ ┌─────────────┐ ┌──────────────┐
    │  Components  │ │  Stores     │ │  API Client  │
    │  (by domain) │ │  (Zustand)  │ │  (Axios)     │
    └──────────────┘ └─────────────┘ └──────────────┘
```

### 5.2 Routing: File System = URL Structure

Next.js uses its **App Router** — the folder structure under `src/app/` directly maps to URLs:

```
src/app/
├── layout.tsx                 ← Root layout: wraps EVERYTHING
├── page.tsx                   ← "/" — Landing page (redirects by role)
│
├── (auth)/                    ← Route group (no URL prefix)
│   ├── login/page.tsx         ← "/login"
│   └── register/page.tsx      ← "/register"
│
├── (buyer)/                   ← Route group with ProtectedRoute layout
│   ├── layout.tsx             ← Wraps all buyer pages with auth check
│   ├── buyer/
│   │   ├── page.tsx           ← "/buyer" — Search dashboard
│   │   ├── orders/page.tsx    ← "/buyer/orders"
│   │   └── profile/page.tsx   ← "/buyer/profile"
│   ├── cart/page.tsx          ← "/cart"
│   ├── checkout/page.tsx      ← "/checkout"
│   └── orders/
│       └── [id]/page.tsx      ← "/orders/42" — Dynamic route
│
├── seller/
│   ├── layout.tsx             ← Wraps all seller pages with auth check
│   ├── dashboard/page.tsx     ← "/seller/dashboard"
│   ├── products/
│   │   ├── page.tsx           ← "/seller/products"
│   │   ├── add/page.tsx       ← "/seller/products/add"
│   │   └── [id]/edit/page.tsx ← "/seller/products/42/edit"
│   ├── orders/page.tsx        ← "/seller/orders"
│   └── profile/page.tsx       ← "/seller/profile"
│
├── rider/                     ← Rider pages
└── notifications/             ← Notification pages
```

**Parentheses `(buyer)`** = route group. The folder name is NOT in the URL. It exists purely for organization and to share a `layout.tsx`.

**Square brackets `[id]`** = dynamic route parameter. `/orders/42` maps to `page.tsx` with `params.id = "42"`.

### 5.3 State Management: Three Zustand Stores

The frontend uses **Zustand** for state management — no Redux, no Context API hairball. Three stores handle all shared state:

| Store | File | What it holds | Persisted? |
|-------|------|--------------|------------|
| **Auth Store** | `lib/store.ts` | Current user, login/logout actions, profile updates | No (re-fetched from server) |
| **Search Store** | `lib/stores/searchStore.ts` | Search filters, results, history | Yes (localStorage) |
| **Cart Store** | `lib/stores/cartStore.ts` | Cart items, quantities, totals | Yes (localStorage) |

**How stores connect to components:**

```
Component                    Store                    API
─────────                    ─────                    ───
SearchForm          ──►  useSearchStore.setFilters()
  "Search" button   ──►  useSearchStore.search()  ──►  searchApi.search()
                             │                              │
                             │  results update              │ POST /api/products/search
                             ▼                              ▼
ProductGrid         ◄──  useSearchStore.results     ◄──  JSON response
ProductCard         ──►  useCartStore.addToCart()
```

### 5.4 The API Client Layer

All backend communication goes through `lib/api.ts`, which exports domain-specific API objects:

| Export | Endpoints it calls |
|--------|-------------------|
| `authApi` | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me` |
| `searchApi` | `/products/search`, `/products/nearby`, `/search/public` |
| `productsApi` | `/products` CRUD + `/products/upload-image` |
| `usersApi` | `/users/profile`, `/users/preferences`, `/users/location`, `/users/geocode` |
| `ordersApi` | `/orders` CRUD + `/orders/:id/payment` + `/orders/payment-methods` |
| `analyticsApi` | `/analytics/*` |

The Axios instance is a **singleton** — one instance shared by all components, configured with:
- `baseURL: http://localhost:3001/api`
- `withCredentials: true` (sends session cookies)
- A 401 interceptor that broadcasts `auth-failure` events

### 5.5 Component Organization

Components live in `src/components/` organized by domain:

```
components/
├── auth/        → LoginForm, RegisterForm, ProtectedRoute
├── buyer/       → SearchForm
├── products/    → ProductCard, ProductDetail, ProductGrid, ProductMap, SortControls
├── orders/      → OrderCard, OrderDetail
├── cart/        → CartSummary
├── payment/     → PaymentModal
├── seller/      → ProductForm, ProductTable, ProductTypeCombobox, SellerAnalytics
├── profile/     → ProfileForm, AlgorithmPreferences, LocationSettings, PasswordChangeForm
├── maps/        → AddressAutocomplete, GeolocationButton, SearchResultsMap
├── layout/      → TopHeader, BottomNav, PageLoading, skeletons, empty states
├── providers/   → AuthProvider, ErrorBoundary
└── ui/          → shadcn/ui primitives (Button, Card, Dialog, etc.)
```

**The dependency rule:** Components are **domain-scoped**. A `products/` component never imports from `seller/`. Shared utilities (maps, layout, UI) are imported by any domain.

> **📖 Deeper reading:** [COMPONENT_CATALOG.md](COMPONENT_CATALOG.md) for every component's props, purpose, and dependency relationships. [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for visual tokens.

---

## Chapter 6 — How Everything Connects: End-to-End Data Flows

This is where the pieces come together. Each flow below traces data from user action to database and back.

### 6.1 Flow: Buyer Searches for Products

This is the **core flow** of the entire application — the Chenda algorithm in action:

```
  FRONTEND                           BACKEND                          DATABASE
  ────────                           ───────                          ────────

1. Buyer enters address
   AddressAutocomplete ──► Nominatim API (external) → lat/lng

2. Buyer adjusts sliders
   searchStore.setFilters({
     proximityWeight: 70,
     freshnessWeight: 30,
     maxRadius: 15
   })

3. Buyer clicks "Search"
   searchStore.search()
        │
        ▼
   searchApi.search({                POST /api/products/search
     location: { lat, lng },    ──►  searchController.searchProducts
     config: {                            │
       weights: { 0.7, 0.3 },            ▼
       max_radius: 15,              Product.getProductsWithMetrics()
       min_freshness_score: 20         │  SQL with PostGIS:
     }                                 │  ST_DWithin(..., 15km)
   })                                  │  ST_Distance(...) / 1000
                                       │        │
                                       │        ▼
                                       │  PostgreSQL returns rows
                                       │  with distance_km pre-computed
                                       │
                                       ▼
                                  chendaAlgorithm(buyer, products, config)
                                       │
                                       │  1. Enrich: calc freshness
                                       │  2. Filter: radius, min freshness
                                       │  3. Score: 0.7×prox + 0.3×fresh
                                       │  4. Sort: by combined score
                                       │
                                       ▼
                                  res.json({ results: rankedProducts })
        │
        ▼
   searchStore.results = rankedProducts
   ProductGrid re-renders with ranked cards
   Each ProductCard shows: name, price, freshness bar, distance, rank badge
```

### 6.2 Flow: Seller Creates a Product

```
  FRONTEND                           BACKEND                          DATABASE
  ────────                           ───────                          ────────

1. Seller fills ProductForm
   • Selects product type via ProductTypeCombobox
     (fetches from GET /api/product-types)
   • Sets price, quantity, days_already_used
   • Uploads image via productsApi.uploadImage()
     → POST /api/products/upload-image
     → Multer saves to /uploads/products/
     → Returns image_url

2. Seller clicks "Create"
   productsApi.create({              POST /api/products
     product_type_id: 45,       ──►  [isAuthenticated]
     price: 150,                     [isSeller]
     quantity: 25,                   [validateCreateProduct]
     days_already_used: 1,           [checkValidation]
     image_url: "/uploads/...",           │
     location: { lat, lng },              ▼
     storage_condition: "refrigerated"  createProduct controller
   })                                      │
                                           ▼
                                     Product.create(data)
                                           │
                                     INSERT INTO products (
                                       ..., location = ST_SetSRID(
                                         ST_MakePoint(lng, lat), 4326
                                       )
                                     )
                                           │
                                           ▼
                                     Returns product with id
```

### 6.3 Flow: Order + Payment

```
1. Buyer adds to cart (CartStore — local only, no API call)
2. Buyer goes to /checkout
   → CartSummary shows items
   → Buyer selects payment method (GET /api/orders/payment-methods)

3. For each cart item:
   ordersApi.create({                POST /api/orders
     product_id: 1,             ──►  [isAuthenticated, isBuyer]
     quantity: 3,                    createOrder controller
     payment_method: "gcash"              │
   })                                     ├── Validate: product active?
                                          ├── Validate: enough quantity?
                                          ├── Validate: not buying own product?
                                          ├── Calculate: total = price × qty
                                          ├── Order.create(data)
                                          └── Track analytics event

4. Process payment:
   ordersApi.processPayment(        POST /api/orders/:id/payment
     orderId, { method }        ──►  paymentService.processPayment()
   )                                     │
                                         ├── Simulates 2s delay
                                         ├── Success rate by method
                                         │   (cash: 98%, gcash: 95%, card: 90%)
                                         └── Updates order payment_status
```

### 6.4 Flow: Authentication Lifecycle

```
Register/Login:
  AuthProvider mounts → checkAuth() → GET /api/auth/me
  If 401 → user = null → redirect to /login
  If 200 → user = { id, name, type, preferences }

On every API call:
  Axios sends session cookie automatically (withCredentials: true)
  Server reads cookie → finds session in DB → populates req.user

Session expiry:
  API returns 401 → Axios interceptor fires notifyAuthFailure()
  AuthProvider listens → calls logout() → redirect to /login
```

> **📖 Deeper reading:** [BACKEND_CORE_USE_CASES.md](BACKEND_CORE_USE_CASES.md) for all 50+ use cases, [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for curl examples of every workflow.

---

## Chapter 7 — Cross-Cutting Concerns

These systems span multiple modules and affect every request.

### 7.1 Security Layers (Defense in Depth)

```
Request arrives
    │
    ├── Helmet.js: Sets 10+ security headers (CSP, X-Frame-Options, etc.)
    ├── CORS: Only allows requests from FRONTEND_URL origin
    ├── Rate limiting: 100 req/15min general, 20/15min on auth
    ├── Session: httpOnly, secure, sameSite=lax cookies
    ├── Sanitize middleware: Strips HTML/XSS from all req.body
    ├── express-validator: Field-level validation on write routes
    ├── RBAC middleware: isAuthenticated → isSeller/isBuyer/isRider
    ├── Ownership checks in controllers: seller can only edit own products
    ├── Parameterized SQL: All queries use $1, $2 placeholders (no injection)
    ├── File whitelist: Only jpeg/png/webp allowed, max 5MB
    └── bcrypt: Passwords hashed with 10 rounds
```

### 7.2 Analytics Pipeline

```
Every significant action generates an analytics event:

  middleware/analyticsMiddleware.js
    │
    ├── responseTimeTracker: Measures every endpoint's response time
    ├── authAnalyticsMiddleware: Tracks login/register/logout events
    ├── preferenceAnalyticsMiddleware: Tracks preference changes
    └── errorAnalyticsMiddleware: Tracks 4xx/5xx errors

  controllers call req.analytics.track('event_name', { ...properties })
    │
    └── INSERT INTO analytics_events (name, properties, timestamp, ...)

  Analytics endpoints read from analytics_events:
    GET /api/analytics/algorithm      → Weight distribution, search volume
    GET /api/analytics/business       → Revenue, order metrics
    GET /api/analytics/seller-dashboard → Per-seller product performance
    GET /api/analytics/realtime       → Last 5 minutes of activity
```

### 7.3 Error Handling Strategy

```
Backend:
  asyncHandler(fn) wraps every controller → catches Promise rejections
  → passes to errorHandler middleware
  → sends { success: false, message: "..." }
  → stack trace only in development mode

Frontend:
  ErrorBoundary component wraps the entire app tree
  → catches render-time React exceptions
  → shows fallback UI instead of blank screen

  API calls: each store/component catches Axios errors
  → sonner toast for user-visible errors
  → console.error for debugging
```

### 7.4 Environment Configuration

```
Backend:
  server/.env → loaded by server/config/env.js
  Required: DB_PASSWORD, SESSION_SECRET
  Optional: PORT (3001), DB_HOST (localhost), ...

Frontend:
  chenda-frontend/.env.local → loaded by Next.js
  NEXT_PUBLIC_API_URL = http://localhost:3001
  NEXT_PUBLIC_API_PREFIX = /api
  NEXT_PUBLIC_DEFAULT_PROXIMITY_WEIGHT = 40

Docker:
  .env at project root → read by docker-compose.yml
  Injects DB_PASSWORD, SESSION_SECRET into containers
```

> **📖 Deeper reading:** [ENVIRONMENT_CONFIG_GUIDE.md](ENVIRONMENT_CONFIG_GUIDE.md) for every env var, [SE_CONCEPTS.md](learn/SE_CONCEPTS.md) §24 for the full security layer breakdown.

---

## Chapter 8 — Development & Deployment Infrastructure

### 8.1 Local Development

```bash
# Terminal 1: Backend
cd server && npm run dev          # nodemon watches for changes, restarts on save

# Terminal 2: Frontend
cd chenda-frontend && npm run dev # Next.js hot-reload dev server

# Terminal 3 (optional): Database
# PostgreSQL + PostGIS must be running (installed locally or via Docker)
```

### 8.2 Database Setup

```bash
# 1. Run migrations (creates all tables, indexes, views)
node migrations/migrate.js up

# 2. Seed reference data (180 USDA product types)
node seeds/seed.js
# Also creates: 10 test users + 30 test products

# Test accounts after seeding:
# Buyer:  maria@test.com / password123
# Seller: pedro@test.com / password123
# Both:   ana@test.com   / password123
```

### 8.3 Docker Compose (All-in-One)

```bash
cp .env.docker .env              # Copy template
# Edit .env: set DB_PASSWORD and SESSION_SECRET
docker compose up --build        # Starts db + backend + frontend
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

The Docker stack:
```yaml
services:
  db:       postgis/postgis:16-3.4-alpine    # PostgreSQL + PostGIS
  backend:  ./server/Dockerfile               # Express API
  frontend: ./chenda-frontend/Dockerfile      # Next.js
```

Health check chain: `db` healthy → `backend` starts → `frontend` starts.

### 8.4 Testing

| Test type | Command | What it covers |
|-----------|---------|---------------|
| Backend unit/integration | `cd server && npm test` | 71 tests: models, controllers, algorithm, API endpoints |
| Frontend unit | `cd chenda-frontend && npm test` | Component rendering, store logic |
| E2E | `npm run test:e2e` | 18 Playwright tests: full user workflows (Chromium + Firefox) |

---

## Chapter 9 — Decision Map for Modifications

Use this table to find the right files to modify for any given change:

### "I want to change..."

| What | Where to look | Files to modify |
|------|--------------|-----------------|
| **Algorithm weights/formula** | `server/algorithm/` | `chenda_algorithm.js`, `scoring/combined-score.js`, `ranking/product_ranker.js` |
| **Algorithm pipeline step** | `server/algorithm/` | `chenda_algorithm.js` (orchestrator) |
| **A database table** | `migrations/` | Create a new `00N_your_change.sql` |
| **An API endpoint's behavior** | `server/controllers/` | The relevant controller file |
| **Who can access an endpoint** | `server/middleware/authenticate.js` + `server/routes/` | Add/remove middleware in route definition |
| **Validation rules** | `server/middleware/validateProduct.js` | express-validator rules |
| **A React component's UI** | `chenda-frontend/src/components/` | The relevant component file |
| **The search page layout** | `chenda-frontend/src/app/(buyer)/buyer/page.tsx` | Page file + imported components |
| **How search filters work** | `chenda-frontend/src/lib/stores/searchStore.ts` | Search store logic |
| **What data the cart persists** | `chenda-frontend/src/lib/stores/cartStore.ts` | Cart store config |
| **How auth redirects work** | `chenda-frontend/src/components/providers/auth-provider.tsx` | AuthProvider component |
| **A shadcn/ui component's style** | `chenda-frontend/src/components/ui/` | The UI primitive file |
| **Navigation items** | `chenda-frontend/src/components/layout/navigation.tsx` | TopHeader / BottomNav |
| **Environment variables** | `server/config/env.js` + `.env` files | Config loader + env file |
| **Docker setup** | `docker-compose.yml` + service Dockerfiles | Container config |
| **Add a new page** | `chenda-frontend/src/app/` | Create new folder + `page.tsx` |
| **Add a new API endpoint** | `server/routes/` + `server/controllers/` | New route + new controller function |
| **Add a new database model** | `server/models/` + `migrations/` | New model file + migration SQL |
| **Track a new analytics event** | Controller that triggers it + `analyticsService.js` | Add `req.analytics.track(...)` call |
| **Add a new user role** | `users.type` CHECK, `authenticate.js`, frontend `ProtectedRoute` | Multiple files across tiers |

### Module Dependency Rules

When modifying a module, be aware of what depends on it:

```
Database schema
  └── Models depend on schema
       └── Controllers depend on models
            └── Routes depend on controllers
                 └── Frontend API client matches route signatures
                      └── Frontend stores call API client
                           └── Frontend components read stores
```

**If you change a model's return shape**, trace forward: does the controller format it for the API response? Does the frontend type definition match? Does the React component display the right fields?

**If you change an API endpoint's contract**, update: (1) the controller, (2) `lib/api.ts` in the frontend, (3) any store that calls it, (4) any component that reads the response.

---

## Quick Reference: Companion Documents

| Document | What it tells you |
|----------|------------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Tech stack choices and POC setup |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Every endpoint with request/response examples |
| [COMPONENT_CATALOG.md](COMPONENT_CATALOG.md) | Every React component: props, purpose, dependencies |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Tables, columns, indexes, functions, triggers |
| [ENVIRONMENT_CONFIG_GUIDE.md](ENVIRONMENT_CONFIG_GUIDE.md) | Every env var explained |
| [BACKEND_CORE_USE_CASES.md](BACKEND_CORE_USE_CASES.md) | 50+ implemented use cases by actor |
| [SE_CONCEPTS.md](learn/SE_CONCEPTS.md) | 27 SE patterns/concepts with code examples |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Colors, typography, spacing tokens |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | Full setup walkthrough |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Local and cloud deployment |
