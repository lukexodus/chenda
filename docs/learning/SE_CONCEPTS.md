# Software Engineering Concepts in Chenda

This document explains every major software engineering concept, design pattern, and architectural principle used in this project — what each one is, why it was chosen, and where you can find it in the code.

---

## Table of Contents

1. [Architecture: Client-Server with 3-Tier Layers](#1-architecture-client-server-with-3-tier-layers)
2. [MVC / MVC-like Separation](#2-mvc--mvc-like-separation)
3. [Design Pattern: Repository / Active Record (Models)](#3-design-pattern-repository--active-record-models)
4. [Design Pattern: Strategy Pattern (Algorithm & Auth)](#4-design-pattern-strategy-pattern-algorithm--auth)
5. [Design Pattern: Middleware Chain](#5-design-pattern-middleware-chain)
6. [Design Pattern: Observer / Event Bus](#6-design-pattern-observer--event-bus)
7. [Design Pattern: Singleton (API Client, DB Pool)](#7-design-pattern-singleton-api-client-db-pool)
8. [Design Pattern: Factory (File Uploads, Query Builder)](#8-design-pattern-factory-file-uploads-query-builder)
9. [Design Pattern: Facade (Service Layer)](#9-design-pattern-facade-service-layer)
10. [RESTful API Design](#10-restful-api-design)
11. [Role-Based Access Control (RBAC)](#11-role-based-access-control-rbac)
12. [Authentication: Session-Based Auth with Passport.js](#12-authentication-session-based-auth-with-passportjs)
13. [Input Validation and Sanitization](#13-input-validation-and-sanitization)
14. [Error Handling: Centralized Error Middleware](#14-error-handling-centralized-error-middleware)
15. [Async/Await and Promise Error Wrapping](#15-asyncawait-and-promise-error-wrapping)
16. [Database: Connection Pooling](#16-database-connection-pooling)
17. [Database: Geospatial Queries with PostGIS](#17-database-geospatial-queries-with-postgis)
18. [Database: Migrations and Schema Design](#18-database-migrations-and-schema-design)
19. [Database: JSONB for Flexible Data](#19-database-jsonb-for-flexible-data)
20. [Algorithm Design: Weighted Scoring Pipeline](#20-algorithm-design-weighted-scoring-pipeline)
21. [State Management: Zustand Stores](#21-state-management-zustand-stores)
22. [Frontend: Component Architecture](#22-frontend-component-architecture)
23. [Frontend: Next.js App Router and Layouts](#23-frontend-nextjs-app-router-and-layouts)
24. [Security: Defense in Depth](#24-security-defense-in-depth)
25. [Analytics: Event-Driven Telemetry](#25-analytics-event-driven-telemetry)
26. [Containerization: Docker Compose](#26-containerization-docker-compose)
27. [TypeScript Type Safety](#27-typescript-type-safety)

---

## 1. Architecture: Client-Server with 3-Tier Layers

**What it is:**  
The system is divided into three distinct tiers that each have one job:

| Tier | Technology | Job |
|------|-----------|-----|
| **Presentation** | Next.js (React) on port 3000 | What the user sees and interacts with |
| **Application** | Node.js/Express on port 3001 | Business logic, validation, API |
| **Data** | PostgreSQL + PostGIS on port 5432 | Persistent storage of users, products, orders |

**Why it matters:**  
Each tier can be developed, tested, scaled, or replaced independently. If you wanted to swap the frontend for a mobile app, you only change the presentation tier. If you need more database power, you scale only the data tier.

**Where in this project:**  
`docker-compose.yml` — defines all three services. The frontend has no direct DB access; it always goes through the backend API.

---

## 2. MVC / MVC-like Separation

**What it is:**  
MVC stands for **Model–View–Controller**. It splits code into three responsibilities:

- **Model** — Knows how to read/write data (SQL queries, business rules tied to data)
- **View** — Renders the UI (in our case, React components in the frontend)
- **Controller** — Receives a request, calls the right model methods, sends back a response

This project follows a **modified MVC** where the server-side "View" is replaced by a JSON API, and the actual View lives in the separate Next.js app.

**Where in this project:**

```
server/
  models/       ← Model: Order.js, Product.js, User.js
  controllers/  ← Controller: orderController.js, authController.js
  routes/       ← Router: wires HTTP paths to controllers

chenda-frontend/
  src/components/  ← View: React UI components
```

**Example:**  
When you place an order:
1. The browser sends `POST /api/orders` to the Express **router** (`routes/orders.js`)
2. The router calls `createOrder()` in the **controller** (`controllers/orderController.js`)
3. The controller calls `Order.create()` on the **model** (`models/Order.js`)
4. The model runs SQL and returns data
5. The controller sends a JSON response back
6. The React **view** (`checkout/page.tsx`) shows the result

---

## 3. Design Pattern: Repository / Active Record (Models)

**What it is:**  
A **Repository** centralizes all database access for one entity into a single class or file. Instead of writing SQL all over your codebase, every query for `orders` lives in `Order.js`.

**Active Record** is a variant where the class both holds data *and* knows how to save/load itself from a database.

This project's models follow the **Repository pattern** — they are plain classes with static methods, not instances that hold row data.

**Why it matters:**  
- If you change the database schema, you only update one file
- Logic like "get orders with product/buyer/seller info joined" is reused by all callers
- Easy to test in isolation

**Where in this project:**

`server/models/Order.js`:
```javascript
class Order {
  static async create(orderData) { ... }
  static async getById(orderId) { ... }
  static async getByBuyer(buyerId, options) { ... }
  static async getBySeller(sellerId, options) { ... }
  static async updatePaymentStatus(orderId, status) { ... }
}
```

Every operation on an order in the entire backend goes through this one class.

---

## 4. Design Pattern: Strategy Pattern (Algorithm & Auth)

**What it is:**  
The **Strategy Pattern** defines a family of algorithms and makes them interchangeable. You can swap one algorithm for another without changing the code that uses it.

**In this project — two uses:**

**A. Ranking Algorithm Strategies**  
The search lets users pick different sorting/ranking strategies:

```
"balanced"           → weight proximity + freshness equally
"proximity-focused"  → prioritize distance
"freshness-focused"  → prioritize shelf life
```

The search controller passes a config object to the algorithm. The algorithm reads the config and applies the right weights. Adding a new strategy (e.g., "price-focused") requires no change to the controller.

**B. Passport.js Authentication Strategies**  
Passport uses the Strategy Pattern natively. Currently a `LocalStrategy` (email + password) is registered. Later you could add `GoogleStrategy` or `JWTStrategy` just by registering another strategy — no changes to the route handlers.

`server/app.js`:
```javascript
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  // verify credentials
}));
```

---

## 5. Design Pattern: Middleware Chain

**What it is:**  
In Express, a **middleware** is a function that sits in the request pipeline and can: inspect the request, modify it, call the next middleware, or end the request with a response.

The chain looks like this:
```
Request → [Helmet] → [CORS] → [Session] → [Passport] → [Sanitize] → [Route Handler] → Response
```

Each middleware has one job. This is the **Chain of Responsibility** design pattern applied to HTTP.

**Where in this project:**

Global middleware in `server/app.js`:
| Middleware | Job |
|-----------|-----|
| `helmet()` | Adds security HTTP headers |
| `cors()` | Allows frontend origin |
| `session()` | Reads/writes session cookie |
| `passport.initialize()` | Sets up auth |
| `sanitizeInput` | Strips XSS from all request bodies |

Route-level middleware:
```javascript
// routes/products.js
router.post('/', isAuthenticated, isSeller, uploadImage, validateProduct, createProduct);
```
Request must pass authentication → seller check → file upload → validation → *then* the controller runs.

---

## 6. Design Pattern: Observer / Event Bus

**What it is:**  
The **Observer Pattern** lets one part of a system publish an event, and other parts subscribe to it — without the publisher knowing who is listening. This decouples components.

**Where in this project:**

`chenda-frontend/src/lib/api.ts` — The Axios response interceptor emits an `auth-failure` event when the API returns 401 (session expired):

```typescript
// Publish (in api.ts)
window.dispatchEvent(new Event('auth-failure'));

// Subscribe (in AuthProvider component)
window.addEventListener('auth-failure', handleLogout);
```

**Why this was necessary:**  
The API client is a singleton module. It cannot directly import the auth store or router (that would create a circular dependency). Instead, it broadcasts an event. The `AuthProvider` component — which has access to the router and store — listens and handles the redirect to login.

This is a classic Observer/Pub-Sub pattern solving a real circular dependency problem.

---

## 7. Design Pattern: Singleton (API Client, DB Pool)

**What it is:**  
A **Singleton** ensures only one instance of something exists in the entire application. All code shares that one instance.

**Where in this project:**

**A. Axios API Client** — `chenda-frontend/src/lib/api.ts`  
One Axios instance is created and exported. Every component that does an API call imports it. All interceptors, base URLs, and headers are configured once.

```typescript
const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL + '/api' });
export default api;
```

**B. PostgreSQL Connection Pool** — `server/config/database.js`  
Node.js applications should not create a new database connection per request (expensive). One `Pool` is created when the server starts and reused for all queries.

```javascript
const pool = new Pool({ max: 20, idleTimeoutMillis: 30000 });
module.exports = { query: (text, params) => pool.query(text, params) };
```

---

## 8. Design Pattern: Factory (File Uploads, Query Builder)

**What it is:**  
A **Factory** creates objects without exposing the creation logic. You ask for an object and get one back — you don't need to know how it was built.

**Where in this project:**

**A. Multer diskStorage** — `server/middleware/uploadImage.js`  
Multer's `diskStorage()` is a factory that creates a storage engine. You provide configuration (where to save, what to name it), and it builds the storage handler.

```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/products/'),
  filename: (req, file, cb) => cb(null, `${name}-${Date.now()}-${random}${ext}`)
});
```

**B. Dynamic SQL Building** — `server/models/Order.js`  
The `getByBuyer()` method builds SQL dynamically based on optional filters:
```javascript
let sql = `SELECT ... FROM orders WHERE buyer_id = $1`;
if (status) {
  sql += ` AND order_status = $2`;
  params.push(status);
}
sql += ` ORDER BY ... LIMIT $... OFFSET $...`;
```
This is a lightweight **Query Builder** — a factory for SQL strings.

---

## 9. Design Pattern: Facade (Service Layer)

**What it is:**  
A **Facade** provides a simple interface to a complex subsystem. Instead of making 5 different calls to different parts of the system, you call one method on the facade and it handles the complexity.

**Where in this project:**

`server/services/paymentService.js` — hides mock payment processing behind one method:

```javascript
const result = await paymentService.processPayment({ orderId, amount, method, buyer });
```

The caller (`orderController.js`) doesn't need to know:
- How transaction IDs are generated
- What the simulated delays are per payment method
- How success/failure is determined
- What the response format looks like

If you ever replaced the mock with a real payment gateway (Stripe, PayMongo), only `paymentService.js` changes. The controller stays the same.

---

## 10. RESTful API Design

**What it is:**  
**REST** (Representational State Transfer) is a convention for designing APIs around resources (nouns) and HTTP methods (verbs):

| HTTP Method | Meaning | Example |
|-------------|---------|---------|
| `GET` | Read | `GET /api/orders/7` |
| `POST` | Create | `POST /api/orders` |
| `PUT` | Update/Replace | `PUT /api/orders/7/status` |
| `DELETE` | Delete | `DELETE /api/products/3` |

**Where in this project:**

```
POST   /api/orders              → Create order
GET    /api/orders              → List orders (current user's)
GET    /api/orders/:id          → Get one order
POST   /api/orders/:id/payment  → Sub-action on an order
PUT    /api/orders/:id/status   → Update order status

GET    /api/products            → List products
POST   /api/products            → Create product
GET    /api/products/:id        → Get one product

POST   /api/auth/login          → Login
POST   /api/auth/register       → Register
POST   /api/auth/logout         → Logout
GET    /api/auth/me             → Current user
```

**Nested resources** — `POST /api/orders/:id/payment` treats "payment" as an action on an order resource. This is a common REST extension for non-CRUD operations.

---

## 11. Role-Based Access Control (RBAC)

**What it is:**  
**RBAC** restricts which users can perform which actions based on their role. Instead of checking permissions inline everywhere, roles are checked through reusable middleware.

Roles in this system:
- `buyer` — can search, create orders, pay
- `seller` — can list products, update order status
- `both` — can do both

**Where in this project:**

`server/middleware/authenticate.js`:
```javascript
const isBuyer = (req, res, next) => {
  if (req.user.type !== 'buyer' && req.user.type !== 'both') {
    return res.status(403).json({ message: 'Buyer access required' });
  }
  next();
};
```

Applied on routes:
```javascript
router.post('/', isAuthenticated, isSeller, uploadImage, validateProduct, createProduct);
router.post('/orders', isAuthenticated, isBuyer, createOrder);
```

A buyer cannot create a product. A seller cannot create an order. These checks happen before any business logic runs.

---

## 12. Authentication: Session-Based Auth with Passport.js

**What it is:**  
**Session-based authentication** works like this:
1. User logs in → server creates a session in the database and sends back a **session cookie**
2. Browser stores the cookie automatically
3. Every subsequent request sends the cookie
4. Server looks up the session, finds the user, and populates `req.user`

**Passport.js** is a library that provides pluggable authentication strategies. It handles the session serialization/deserialization automatically.

**Where in this project:**

`server/app.js`:
```javascript
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
```

Sessions are stored in PostgreSQL (`connect-pg-simple`). This means if the server restarts, users stay logged in.

**Session vs. JWT:**  
This project uses sessions (not JWT tokens). Sessions are simpler for web apps and easier to invalidate (just delete the row). JWT tokens are stateless and better for mobile/distributed systems.

---

## 13. Input Validation and Sanitization

**What it is:**  
Never trust user input — always **validate** (check it's the right shape/type) and **sanitize** (strip dangerous content).

- **Validation** rejects bad data early ("quantity must be > 0")
- **Sanitization** strips malicious content that slips through ("remove `<script>` tags")

**Injection attack** — an attacker sends malicious input that gets executed as code (SQL injection, XSS). Proper validation and sanitization prevent this.

**Where in this project:**

**Sanitization** — `server/middleware/sanitize.js`:
```javascript
function stripHtml(value) {
  return value
    .replace(/<[^>]*>/g, '')       // Remove HTML tags
    .replace(/javascript:/gi, '')   // Remove JS protocol
    .replace(/on\w+\s*=/gi, '');   // Remove event handlers (onclick=, etc.)
}
```
This runs on **every request body** globally.

**Validation** — `server/middleware/validateProduct.js` using `express-validator`:
```javascript
body('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
body('price').isFloat({ min: 0 }).withMessage('Price must be non-negative'),
```

**Parameterized SQL** (prevents SQL injection) — all queries use `$1, $2` placeholders, never string concatenation:
```javascript
query('SELECT * FROM users WHERE email = $1', [email])  // ✓ Safe
query(`SELECT * FROM users WHERE email = '${email}'`)   // ✗ Vulnerable
```

---

## 14. Error Handling: Centralized Error Middleware

**What it is:**  
Instead of each route handler writing its own `try/catch` and sending error responses, a single **error handler middleware** at the end of the Express pipeline catches all errors and sends a consistent response.

**Where in this project:**

`server/middleware/errorHandler.js`:
```javascript
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

`server/app.js`:
```javascript
app.use(errorHandler); // Must be LAST
```

This gives every API error the same shape: `{ success: false, message: "..." }`.  
Stack traces are only included in development mode — never exposed in production.

---

## 15. Async/Await and Promise Error Wrapping

**What it is:**  
Express does not automatically catch errors thrown inside `async` route handlers. If an `await` rejects and you don't catch it, the server hangs without sending a response.

The **asyncHandler** wrapper solves this by wrapping every async route handler in a try/catch that passes errors to Express automatically.

**Where in this project:**

`server/middleware/asyncHandler.js`:
```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

`server/routes/orders.js`:
```javascript
router.post('/', isAuthenticated, isBuyer, asyncHandler(createOrder));
```

Now if `createOrder` throws an unhandled error, it gets passed to `errorHandler` automatically.

---

## 16. Database: Connection Pooling

**What it is:**  
Opening a database connection is expensive (TCP handshake, authentication). A **connection pool** maintains a set of open connections and reuses them for incoming queries instead of opening/closing one per request.

**Where in this project:**

`server/config/database.js`:
```javascript
const pool = new Pool({
  max: 20,              // At most 20 simultaneous connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000  // Fail fast if no connection available
});
```

The pool queue handles bursts: if 25 requests come in simultaneously, 20 run immediately, 5 wait for a connection to free up.

---

## 17. Database: Geospatial Queries with PostGIS

**What it is:**  
**PostGIS** is a PostgreSQL extension that adds geographic/geometric data types and functions. It lets the database itself calculate distances, filter by radius, and return coordinates — without moving data to the application layer.

**Key functions used:**

| Function | What it does |
|----------|-------------|
| `GEOMETRY(Point, 4326)` | Stores a lat/lng point; SRID 4326 = standard GPS coordinate system |
| `ST_MakePoint(lng, lat)` | Creates a POINT from coordinates |
| `ST_DWithin(a, b, radius)` | True if point `a` is within `radius` meters of point `b` |
| `ST_Distance(a, b)` | Distance in meters between two points |
| `ST_Y(point)` | Extract latitude from a POINT |
| `ST_X(point)` | Extract longitude from a POINT |

**Where in this project:**

`server/models/Product.js` — finding nearby products:
```sql
WHERE ST_DWithin(
  p.location::geography,
  ST_MakePoint($2, $1)::geography,
  $3 * 1000  -- km to meters
)
```

**Why it matters:**  
Doing this in SQL (with a GIST spatial index) is orders of magnitude faster than loading all products into memory and computing distances in JavaScript.

---

## 18. Database: Migrations and Schema Design

**What it is:**  
A **migration** is a versioned SQL script that creates or alters the database schema. Instead of manually running SQL on each environment, you run the migration scripts in order and every environment ends up with the same schema.

**Where in this project:**

```
migrations/
  001_create_tables.sql    ← Create all tables, indexes, triggers
  002_create_indexes.sql   ← Additional performance indexes
  003_create_session_table.sql  ← Session storage table
  migrate.js               ← Runs all migrations in order
```

**Schema design patterns used:**

- **Foreign keys with CASCADE**: `orders.buyer_id REFERENCES users(id) ON DELETE CASCADE` — if a user is deleted, their orders delete too
- **CHECK constraints**: `order_status IN ('pending', 'confirmed', 'completed', 'cancelled')` — database enforces valid values
- **TIMESTAMP with triggers**: An `update_updated_at_column()` trigger automatically sets `updated_at` whenever a row changes
- **Database views**: `products_active` and `products_enriched` pre-join frequently needed data

---

## 19. Database: JSONB for Flexible Data

**What it is:**  
**JSONB** is PostgreSQL's binary JSON type. It lets you store structured data without a fixed schema, while still supporting indexing and queries.

**Where in this project:**

`users.preferences JSONB` stores algorithm tuning settings per user:
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

Without JSONB, you'd need 6 extra columns or a separate `user_preferences` table. With JSONB, adding a new preference field requires no schema change.

`analytics_events.event_properties JSONB` stores different data per event type (a search event has different fields than a login event).

---

## 20. Algorithm Design: Weighted Scoring Pipeline

**What it is:**  
The core ranking uses a **weighted scoring pipeline** — a multi-step process where each product receives a numeric score based on configurable weights for different factors.

**The 4-step pipeline in `server/algorithm/chenda_algorithm.js`:**

```
Raw products from DB
       ↓
Step 1: ENRICH — Calculate distance and freshness metrics for each product
       ↓
Step 2: FILTER — Remove products outside max_radius or below min_freshness
       ↓
Step 3: SCORE — Assign a weighted score:
                score = (proximity_weight × proximity_score)
                      + (freshness_weight × freshness_score)
       ↓
Step 4: SORT — Order by score (or by price/distance if display_mode="filter")
       ↓
Ranked results
```

**Freshness score** — calculated from product shelf life data (USDA FoodKeeper):
- A product harvested today with 7 days shelf life scores 100%
- The same product 6 days later scores ~14%

**Distance score** — inverse of distance: closer = higher score:
```
proximity_score = 1 - (distance_km / max_radius_km)
```

**User-configurable weights** allow personalization:
- Proximity-focused buyer: `proximity_weight=80, freshness_weight=20`
- Health-conscious buyer: `proximity_weight=20, freshness_weight=80`

---

## 21. State Management: Zustand Stores

**What it is:**  
**State management** is how a frontend application shares data between components. Zustand is a minimal library for this — you define a store (a shared state object) and any component can read or update it.

**Where in this project:**

`chenda-frontend/src/lib/stores/cartStore.ts`:
```typescript
const useCartStore = create<CartState>()(persist(
  (set, get) => ({
    items: [],
    addToCart: (product, quantity) => set(state => ({ items: [...state.items, { product, quantity }] })),
    getTotalItems: () => get().items.reduce((n, item) => n + item.quantity, 0),
    clearCart: () => set({ items: [] }),
  }),
  { name: 'chenda-cart' }  // persists to localStorage
));
```

`authStore.ts` — holds the logged-in user and authentication state  
`searchStore.ts` — holds search results and the current filter/sort mode

**Persist middleware** — the cart survives page refreshes because Zustand's `persist` plugin saves it to `localStorage`. When the user reloads, the cart is rehydrated automatically.

---

## 22. Frontend: Component Architecture

**What it is:**  
React apps are built from **components** — reusable, self-contained UI pieces. Good component architecture means each component has one clear purpose and composes with others.

**Component types used in this project:**

| Type | Example | Purpose |
|------|---------|---------|
| **Page component** | `checkout/page.tsx` | Full screen, owns data fetching |
| **Feature component** | `OrderDetail.tsx` | Renders a complete feature unit |
| **UI component** | `Badge`, `Card`, `Button` | Pure visual, no business logic |
| **Layout component** | `TopHeader`, `BottomNav` | Structural chrome |
| **Provider component** | `AuthProvider` | Injects context for children |

**Props flow down, events bubble up** — a parent passes data to child via props; a child tells the parent something happened via callback props (e.g., `onAddToCart`).

---

## 23. Frontend: Next.js App Router and Layouts

**What it is:**  
Next.js App Router uses the **filesystem as a router** — the folder structure defines the URL structure. Special files like `page.tsx`, `layout.tsx`, and `loading.tsx` have reserved meanings.

**Where in this project:**

```
src/app/
  layout.tsx              ← Root layout (wraps all pages)
  page.tsx                ← Landing page "/"
  (buyer)/                ← Route group (no URL segment)
    layout.tsx            ← Buyer layout (ProtectedRoute wrapper)
    buyer/page.tsx        ← "/buyer" — Buyer dashboard
    checkout/page.tsx     ← "/checkout"
    orders/
      page.tsx            ← "/orders" — Redirect to /buyer/orders
      [id]/page.tsx       ← "/orders/7" — Dynamic route
```

**Route Groups** `(buyer)` — the parentheses mean this folder is not part of the URL. It's used purely to organize files and apply a shared `layout.tsx`.

**Dynamic routes** `[id]` — square brackets create a URL parameter. `/orders/7` maps to `page.tsx` with `params.id = "7"`.

**Layouts** — `layout.tsx` files wrap all pages in their directory. The buyer layout wraps every buyer page with a `ProtectedRoute` check (redirect to login if not authenticated).

---

## 24. Security: Defense in Depth

**What it is:**  
**Defense in depth** means using multiple security layers so that if one fails, others still protect the system. No single control is relied upon alone.

**Security layers in this project:**

| Layer | Mechanism | Protection |
|-------|-----------|-----------|
| **HTTP headers** | Helmet.js | XSS, clickjacking, MIME sniffing |
| **CORS** | Express cors | Cross-origin request restriction |
| **Input sanitization** | `sanitize.js` middleware | XSS via body content |
| **Input validation** | express-validator | Invalid/malicious input values |
| **Parameterized queries** | `$1, $2` in all SQL | SQL injection |
| **Session security** | httpOnly, secure cookies | Cookie theft |
| **RBAC** | `isBuyer()`, `isSeller()` | Unauthorized actions |
| **Ownership checks** | `order.buyer_id !== userId` | Accessing others' data |
| **File type whitelist** | Multer mimetype check | Malicious file uploads |
| **File size limit** | 5MB max | Denial of service via upload |
| **Rate limiting** | express-rate-limit on auth | Brute force login |
| **CSP headers** | Next.js headers config | Script injection in frontend |
| **Password hashing** | bcrypt (10 rounds) | Password database breach |

---

## 25. Analytics: Event-Driven Telemetry

**What it is:**  
**Telemetry** is the collection of data about how your system is being used. **Event-driven** means you track discrete events ("user searched", "order created") rather than continuously polling.

**Where in this project:**

`server/services/analyticsService.js` + `server/middleware/analyticsMiddleware.js`

Every significant action fires a tracking call:
```javascript
req.analytics.track('order_created', {
  order_id: order.id,
  product_id: order.product_id,
  total_amount: order.total_amount,
  payment_method: order.payment_method
});
```

This is **non-blocking** — analytics failure never breaks the main request. The data is stored in `analytics_events` with a JSONB `event_properties` column, so each event type can carry different data.

**Why track analytics?**  
Real-world data lets you answer: Which products are searched most? What search radius do users prefer? What's the average order value? This feeds back into product and algorithm improvements.

---

## 26. Containerization: Docker Compose

**What it is:**  
**Docker** packages an application and all its dependencies into an isolated container that runs the same way everywhere. **Docker Compose** manages multiple containers that work together.

**Where in this project:**

`docker-compose.yml` defines 3 services:

```yaml
services:
  db:       postgis/postgis:16-3.4-alpine   # Database with PostGIS
  backend:  ../server/Dockerfile            # Node.js API
  frontend: ../chenda-frontend/Dockerfile   # Next.js app
```

**Health checks** — the backend waits for `db` to be healthy before starting. The frontend waits for the backend. This prevents startup order bugs.

**Benefits:**
- A new developer runs `docker-compose up` and the full system starts — no manual PostgreSQL setup
- Each service is isolated; they communicate over a Docker network
- Production deployment mirrors the development environment exactly

---

## 27. TypeScript Type Safety

**What it is:**  
**TypeScript** adds static types to JavaScript. You declare what shape data has, and the compiler catches mismatches before the code runs.

**Where in this project:**

`chenda-frontend/src/lib/types/order.ts` defines:
```typescript
export interface Order {
  id: number;
  buyer_id: number;
  status: OrderStatus;          // can only be 'pending' | 'paid' | 'completed' | 'cancelled'
  payment_method?: PaymentMethod;  // optional field
  total_amount: number;
  delivery_address: string;
  // ...
}
```

If you access `order.prodcut_name` (typo), TypeScript catches it **at compile time** before a user ever sees a crash.

**Type-driven reliability patterns:**
- `OrderStatus` union type prevents typos in status strings
- Optional fields (`?`) document which data may be absent
- `Record<OrderStatus, string>` for `ORDER_STATUS_LABELS` ensures every status has a label
- The Axios `api.get<OrderResponse>('/orders/1')` types the response automatically

---

## Summary Table

| Concept | Category | Where |
|---------|----------|-------|
| 3-Tier Architecture | Architecture | `docker-compose.yml`, overall structure |
| MVC | Architecture | `models/`, `controllers/`, `routes/`, frontend `components/` |
| Repository Pattern | Design Pattern | `server/models/*.js` |
| Strategy Pattern | Design Pattern | `chenda_algorithm.js`, Passport strategies |
| Middleware Chain | Design Pattern | `server/app.js`, `server/middleware/` |
| Observer / Event Bus | Design Pattern | `chenda-frontend/src/lib/api.ts` |
| Singleton | Design Pattern | `api.ts`, `config/database.js` |
| Factory | Design Pattern | `uploadImage.js`, dynamic SQL building |
| Facade | Design Pattern | `services/paymentService.js` |
| RESTful API | API Design | `server/routes/` |
| RBAC | Security | `middleware/authenticate.js` |
| Session Authentication | Security | `app.js`, Passport.js |
| Input Validation & Sanitization | Security | `middleware/sanitize.js`, `validateProduct.js` |
| Defense in Depth | Security | Multiple layers (see Section 24) |
| Centralized Error Handling | Error Handling | `middleware/errorHandler.js` |
| Async Error Wrapping | Error Handling | `middleware/asyncHandler.js` |
| Connection Pooling | Performance | `config/database.js` |
| Geospatial Queries | Database | PostGIS, `models/Product.js` |
| DB Migrations | Database | `migrations/` |
| JSONB Flexible Schema | Database | `users.preferences`, `analytics_events` |
| Weighted Scoring Pipeline | Algorithm | `server/algorithm/` |
| State Management (Zustand) | Frontend | `lib/stores/` |
| Component Architecture | Frontend | `components/` |
| App Router & Layouts | Frontend | `src/app/` |
| Event-Driven Telemetry | Observability | `services/analyticsService.js` |
| Containerization | DevOps | `docker-compose.yml`, `Dockerfile` |
| TypeScript Type Safety | Code Quality | `lib/types/`, all `.ts`/`.tsx` files |
