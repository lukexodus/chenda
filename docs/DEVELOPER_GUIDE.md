# Chenda — Developer Guide

> Full setup, architecture overview, and contribution guide for the Chenda codebase.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Setup](#repository-setup)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Running Tests](#running-tests)
7. [Project Architecture](#project-architecture)
8. [Key Files Reference](#key-files-reference)
9. [Common Development Tasks](#common-development-tasks)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 20+ | Use [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows) |
| npm | 10+ | Bundled with Node.js 20 |
| PostgreSQL | 15+ | With **PostGIS** extension |
| Git | Any | |

### Installing PostgreSQL + PostGIS

**Windows**

1. Download the PostgreSQL installer from <https://www.postgresql.org/download/windows/>.
2. During installation, make sure to include **Stack Builder**.
3. After installation, open Stack Builder and install the **PostGIS** bundle for your PostgreSQL version.
4. Alternatively, run the included helper script:

```powershell
# From the repo root (PowerShell as Administrator)
.\install-postgis.ps1
```

**Linux (Ubuntu/Debian)**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib postgis postgresql-15-postgis-3
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS**

```bash
brew install postgresql@15 postgis
brew services start postgresql@15
```

---

## Repository Setup

```bash
# Clone
git clone <repository-url> chenda
cd chenda

# Install root-level dependencies (E2E runner)
npm install

# Install backend dependencies
cd server && npm install && cd ..

# Install frontend dependencies
cd chenda-frontend && npm install && cd ..
```

---

## Environment Variables

### Backend — `server/.env`

Copy the example file and edit it:

```bash
# Windows (Command Prompt)
copy server\.env.example server\.env

# Windows (Git Bash) / Linux / macOS
cp server/.env.example server/.env
```

Open `server/.env` and set at minimum `DB_PASSWORD` and `SESSION_SECRET`.

**Full reference:**

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `DB_HOST` | `localhost` | Yes | PostgreSQL host |
| `DB_PORT` | `5432` | Yes | PostgreSQL port |
| `DB_NAME` | `chenda_db` | Yes | Main database name |
| `DB_USER` | `postgres` | Yes | Database user |
| `DB_PASSWORD` | _(none)_ | **Yes** | Database password — must be set |
| `PORT` | `3001` | Yes | API server port |
| `NODE_ENV` | `development` | Yes | `development` / `production` / `test` |
| `SESSION_SECRET` | _(none)_ | **Yes** | Arbitrary secret string for session signing — change in production |
| `FRONTEND_URL` | `http://localhost:3000` | Yes | Allowed CORS origin |
| `UPLOAD_DIR` | `./uploads` | No | Directory for uploaded images |
| `MAX_FILE_SIZE` | `5242880` | No | Max upload size in bytes (default 5 MB) |

**Test environment — `server/.env.test`**

The test suite reads `server/.env.test`. It must point to a **separate** test database to avoid wiping your development data.

```env
DB_NAME=chenda_test
NODE_ENV=test
SESSION_SECRET=test-secret
DB_PASSWORD=your_password
```

### Frontend — `chenda-frontend/.env.local`

Create the file manually if it doesn't exist:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

This is the only frontend environment variable. It tells the Axios client where the API lives.

---

## Database Setup

### 1. Create the database and enable PostGIS

```bash
# Connect as the postgres superuser
psql -U postgres

# Inside psql:
CREATE DATABASE chenda_db;
\c chenda_db
CREATE EXTENSION postgis;
\q
```

Also create the test database:

```bash
psql -U postgres -c "CREATE DATABASE chenda_test;"
psql -U postgres -d chenda_test -c "CREATE EXTENSION postgis;"
```

### 2. Run migrations

The migration runner applies SQL files in `migrations/` in order.

```bash
# From the repo root
node migrations/migrate.js up       # Apply all pending migrations
node migrations/migrate.js status   # Show which migrations have run
node migrations/migrate.js rollback # Roll back the last migration
```

Migration files:

| File | Purpose |
|------|---------|
| `001_create_tables.sql` | Users, Products, Product_Types, Orders, Analytics_Events |
| `002_create_indexes.sql` | GIST spatial indexes, helper functions, materialized views |
| `003_create_session_table.sql` | PostgreSQL session storage for express-session |

### 3. Seed data

```bash
node seeds/seed.js           # Inserts USDA product types, 10 test users, 30 test products
node seeds/seed.js --force   # Truncates all tables and re-seeds from scratch
```

Seed files:

| File | Contents |
|------|---------|
| `seeds/product_types.sql` | 180 USDA product type entries |
| `seeds/mock_users.sql` | 10 test users with Philippine coordinates |
| `seeds/mock_products.sql` | 30 test products with varied freshness states |

---

## Running the Application

Open two terminals from the repo root.

**Terminal 1 — Backend API (port 3001)**

```bash
cd server
npm run dev        # nodemon — auto-restarts on file changes
# or
npm start          # plain node
```

**Terminal 2 — Frontend (port 3000)**

```bash
cd chenda-frontend
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | <http://localhost:3000> |
| Backend API | <http://localhost:3001> |
| API Health | <http://localhost:3001/api/health> |

---

## Running Tests

### Backend unit tests

Uses Jest + Supertest. Tests run against `chenda_test` (configured in `server/.env.test`). Migrations are applied and rolled back automatically by the test setup.

```bash
cd server

npm test                  # Run all tests once
npm run test:watch        # Watch mode
npm run test:coverage     # Generate coverage report in coverage/
```

Test suites:

| File | Tests | Scope |
|------|-------|-------|
| `__tests__/auth.test.js` | 18 | Register, login, logout, session, password update |
| `__tests__/users.test.js` | 22 | Profile CRUD, preferences, geocoding |
| `__tests__/products.test.js` | 19 | Product CRUD, image upload, validation |
| `__tests__/search.test.js` | 12 | Algorithm search, nearby, personalized |

**Total: 71 tests, 100% passing**

### Frontend unit tests

```bash
cd chenda-frontend
npm test               # Run all tests
npm run test:coverage  # With coverage
```

### E2E tests (Playwright)

Requires both servers running on their default ports before you start.

```bash
# From repo root
npm run test:e2e              # Headless (Chromium + Firefox)
npm run test:e2e:report       # Run + open HTML report
npx playwright test --ui      # Interactive UI mode
npx playwright show-report    # Re-open last report
```

E2E test suites:

| File | Tests | Scope |
|------|-------|-------|
| `e2e/auth-flow.spec.ts` | 6 | Register, login, logout, session, account types |
| `e2e/buyer-journey.spec.ts` | 5 | Search, product view, cart, navigation |
| `e2e/seller-journey.spec.ts` | 7 | Add product, edit, delete, orders, profile |

**Total: 18 E2E tests**

The E2E suite uses a separate database (`chenda_e2e_test`). See `e2e/README.md` for setup details.

---

## Project Architecture

### Backend (`server/`)

```
server/
├── app.js                    # Express app bootstrap, middleware registration, route mounting
├── config/
│   ├── database.js           # pg connection pool (max 20 clients)
│   ├── index.js              # Centralised config (reads .env)
│   └── passport.js           # Passport Local Strategy definition
├── algorithm/                # Chenda JS algorithm (copied from chenda-algo/)
├── controllers/
│   ├── authController.js     # register, login, logout, me, password update
│   ├── productController.js  # Full product CRUD + image upload
│   ├── searchController.js   # search, nearby, personalized search
│   ├── userController.js     # profile, preferences, location, geocoding
│   ├── orderController.js    # order create/pay/track/complete
│   └── analyticsController.js# 7 analytics dashboard endpoints
├── models/
│   ├── User.js               # User CRUD with bcrypt hashing
│   ├── Product.js            # Product CRUD + PostGIS distance queries
│   ├── ProductType.js        # USDA product type lookups
│   └── Order.js              # Order state machine
├── middleware/
│   ├── authenticate.js       # isAuthenticated, isBuyer, isSeller, isOwner
│   ├── validateProduct.js    # express-validator rules for products
│   ├── uploadImage.js        # multer configuration
│   ├── analyticsMiddleware.js# Logs search events to analytics_events
│   ├── asyncHandler.js       # Wraps async route handlers to forward errors
│   ├── errorHandler.js       # Global error middleware
│   └── logger.js             # Morgan HTTP logging
├── routes/
│   ├── auth.js               # /api/auth/*
│   ├── products.js           # /api/products/*
│   ├── search.js             # /api/search/*
│   ├── users.js              # /api/users/*
│   ├── orders.js             # /api/orders/*
│   ├── analytics.js          # /api/analytics/*
│   └── health.js             # /api/health
└── services/
    ├── geocodingService.js   # Nominatim API with 7-day cache + rate limiter
    ├── paymentService.js     # Mock payment processor
    └── analyticsService.js   # Event tracking and aggregation queries
```

**Request lifecycle:**

```
Request → Morgan logger → Helmet headers → CORS → Rate limiter
       → Session (connect-pg-simple) → Passport deserialize
       → Route handler → Controller → Model (SQL via pg pool)
       → Response
       → Error handler (if throw)
```

### Algorithm (`server/algorithm/`)

The Chenda algorithm is a pure JS module with no database dependency. It accepts:

- An array of product objects with `distance_km`, `days_remaining`, `total_shelf_life`, and `storage_condition`
- A config object with `proximity_weight`, `freshness_weight`, `max_radius`, `min_freshness_score`

It outputs a sorted, scored array. The database query (`models/Product.js → getProductsWithMetrics`) handles the spatial filtering with PostGIS before passing results to the algorithm.

### Frontend (`chenda-frontend/src/`)

```
src/
├── app/
│   ├── layout.tsx              # Root layout — providers, fonts
│   ├── page.tsx                # Redirect to /login or /buyer based on auth
│   ├── globals.css             # Tailwind directives + CSS token definitions
│   ├── (auth)/                 # Unauthenticated routes (no nav bars)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (buyer)/                # Buyer-protected routes
│   │   ├── layout.tsx          # Buyer layout with bottom nav
│   │   ├── buyer/page.tsx      # Search dashboard
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   └── orders/
│   └── (seller)/               # Seller-protected routes
│       ├── layout.tsx          # Seller layout with bottom nav
│       ├── seller/page.tsx     # Seller dashboard (analytics)
│       ├── products/           # Product list, add, edit pages
│       └── orders/page.tsx
├── components/
│   ├── auth/                   # LoginForm, RegisterForm, ProtectedRoute
│   ├── buyer/                  # SearchForm, result components
│   ├── seller/                 # ProductForm, ProductTable, SellerAnalytics
│   ├── products/               # ProductCard, ProductGrid, ProductDetail, ProductMap
│   ├── maps/                   # SearchResultsMap, AddressAutocomplete, GeolocationButton
│   ├── cart/                   # CartSummary
│   ├── orders/                 # OrderCard, OrderDetail
│   ├── payment/                # PaymentModal
│   ├── profile/                # ProfileForm, LocationSettings, AlgorithmPreferences
│   ├── layout/                 # TopAppHeader, BottomNav
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── api/                    # Axios client (baseURL from NEXT_PUBLIC_API_URL, withCredentials: true)
│   ├── stores/
│   │   ├── authStore.ts        # User session state (Zustand + localStorage)
│   │   ├── cartStore.ts        # Cart items (Zustand + localStorage)
│   │   └── searchStore.ts      # Search params + results (Zustand + localStorage)
│   ├── types/                  # Shared TypeScript interfaces
│   └── validators/             # Zod schemas for forms
└── hooks/                      # Custom React hooks
```

**State management:**

All Zustand stores persist to `localStorage`. The `authStore` is the source of truth for session state; the `ProtectedRoute` component reads it to guard routes.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `server/app.js` | Register all middleware and mount all routers |
| `server/config/database.js` | Shared `query()` and `getClient()` helpers used everywhere |
| `server/algorithm/chenda_algorithm.js` | Core ranking algorithm entry point |
| `migrations/migrate.js` | CLI migration runner |
| `seeds/seed.js` | One-shot database seeder |
| `chenda-frontend/src/lib/api/index.ts` | Axios instance — all API calls go through here |
| `chenda-frontend/src/app/globals.css` | CSS design tokens (`--fresh-primary`, etc.) |
| `playwright.config.ts` | Playwright configuration (browsers, timeouts, baseURL) |
| `e2e/helpers/testHelpers.ts` | Shared E2E utilities (register, login helpers) |

---

## Common Development Tasks

### Adding a new API endpoint

1. Create or update a controller in `server/controllers/`.
2. Add the route in the appropriate `server/routes/*.js` file.
3. Mount the router in `server/app.js` if it's a new file.
4. Add authentication middleware as needed (`isAuthenticated`, `isSeller`, etc.).
5. Add integration tests in `server/__tests__/`.

Example:

```js
// server/routes/example.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/asyncHandler');
const { isAuthenticated } = require('../middleware/authenticate');

router.get('/', isAuthenticated, asyncHandler(async (req, res) => {
  res.json({ success: true, data: [] });
}));

module.exports = router;

// Register in server/app.js:
// app.use('/api/example', require('./routes/example'));
```

### Adding a new database query

All queries use parameterised placeholders (`$1`, `$2`, ...) via the shared `query()` helper:

```js
const { query } = require('../config/database');

const result = await query(
  'SELECT * FROM products WHERE seller_id = $1 AND status = $2',
  [sellerId, 'active']
);
return result.rows;
```

Never interpolate user input directly into SQL strings.

### Adding a new frontend page

1. Create a folder under the appropriate route group (`(auth)`, `(buyer)`, `(seller)`).
2. Add a `page.tsx` file inside it.
3. If it needs auth protection, ensure the parent `layout.tsx` includes the `ProtectedRoute` wrapper.
4. Add a navigation link in the relevant `BottomNav` or `TopAppHeader` component if needed.

### Adding a new Zustand store

```ts
// src/lib/stores/exampleStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ExampleState {
  value: string;
  setValue: (v: string) => void;
}

export const useExampleStore = create<ExampleState>()(
  persist(
    (set) => ({
      value: '',
      setValue: (v) => set({ value: v }),
    }),
    { name: 'chenda-example' }
  )
);
```

---

## Troubleshooting

### `Error: connect ECONNREFUSED 127.0.0.1:5432`

PostgreSQL is not running.

```bash
# Windows (PowerShell) — start the service
Start-Service postgresql*

# Linux
sudo systemctl start postgresql

# macOS
brew services start postgresql@15
```

### `Error: role "postgres" does not exist`

Create the superuser role:

```bash
sudo -u postgres createuser --superuser postgres
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'yourpassword';"
```

### `extension "postgis" does not exist`

PostGIS is not installed, or needs to be enabled:

```sql
-- Run inside psql connected to chenda_db
CREATE EXTENSION IF NOT EXISTS postgis;
```

### `CORS error` in the browser console

Ensure the frontend is running on port `3000` and `FRONTEND_URL=http://localhost:3000` in `server/.env`. The backend only accepts requests from that origin.

### Port already in use

```bash
# Find what is using port 3001 (Windows)
netstat -ano | findstr :3001
# Then kill by PID:
taskkill /PID <pid> /F

# Linux / macOS
lsof -ti:3001 | xargs kill -9
```

### `MODULE_NOT_FOUND` after pulling latest changes

```bash
cd server && npm install
cd ../chenda-frontend && npm install
```

### Migrations already applied / schema out of sync

```bash
node migrations/migrate.js rollback   # roll back one step
node migrations/migrate.js up         # re-apply

# Full reset (destroys all data)
node seeds/seed.js --force
```
