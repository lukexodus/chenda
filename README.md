# Chenda

> A proximity-freshness marketplace for perishable goods in the Philippines.

Chenda is a full-stack web application that helps buyers discover nearby fresh produce and perishable goods, ranked by a proprietary algorithm that balances **proximity** and **freshness** — so you always get the closest, freshest option first.

---

## Screenshots

> _Replace placeholders below with actual screenshots. Recommended tool: browser fullscreen → Snipping Tool (Win+Shift+S)._

| Page | Description |
|------|-------------|
| ![Login page placeholder](docs/screenshots/login.png) | Login page with Chenda branding and role selection |
| ![Buyer search placeholder](docs/screenshots/buyer-search.png) | Buyer dashboard: location input, weight sliders, ranked product grid |
| ![Product detail placeholder](docs/screenshots/product-detail.png) | Product detail modal with freshness bar, distance, and Leaflet map |
| ![Seller products placeholder](docs/screenshots/seller-products.png) | Seller product table with freshness warnings and CRUD actions |
| ![Checkout placeholder](docs/screenshots/checkout.png) | Checkout page with mock payment methods and order summary |

> Screenshots directory: `docs/screenshots/`. Create the folder and drop `.png` files matching the names above.

---

## Features

### For Buyers
- Search products ranked by a combined proximity + freshness score
- Interactive map with freshness-colour-coded markers (green / yellow / red)
- Address autocomplete via Nominatim (OpenStreetMap)
- Shopping cart and mock checkout (Cash / GCash / Card)
- Order history and status tracking
- Customisable algorithm weight presets (Balanced / Proximity-First / Freshness-First)

### For Sellers
- Product listing management — create, edit, delete, image upload
- Freshness warnings for products expiring within 3 days
- Order management with status updates
- Analytics dashboard (active listings, freshness overview)

### Platform
- Role-based access: **buyer**, **seller**, or **both**
- Session-based authentication using PostgreSQL-stored sessions
- 180 USDA product type taxonomy with searchable combobox
- Geocoding with 7-day result caching and rate limiting
- 25+ REST API endpoints with full request/response documentation

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui |
| **State management** | Zustand (with localStorage persistence) |
| **Maps** | Leaflet.js + React-Leaflet + OpenStreetMap tiles |
| **Forms** | React Hook Form + Zod validation |
| **Backend** | Express.js 5, Node.js 20+ |
| **Database** | PostgreSQL 15+ + PostGIS (spatial queries) |
| **Authentication** | Passport.js Local Strategy + express-session |
| **Unit testing** | Jest + Supertest (backend), React Testing Library (frontend) |
| **E2E testing** | Playwright (Chromium + Firefox) |
| **File uploads** | Multer (local disk storage) |
| **Geocoding** | Nominatim API (OpenStreetMap) |

---

## Quick Start

### Prerequisites

- **Node.js 20+**
- **PostgreSQL 15+** with the **PostGIS** extension enabled
- **Git**

See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for a full setup walkthrough, including PostgreSQL + PostGIS installation.

### 1. Clone the repository

```bash
git clone <repository-url> chenda
cd chenda
```

### 2. Configure environment

```bash
# Backend
cp server/.env.example server/.env
# Open server/.env and set DB_PASSWORD and SESSION_SECRET

# Frontend
cp chenda-frontend/.env.example chenda-frontend/.env.local   # if the file exists
# or create chenda-frontend/.env.local with:
#   NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Install dependencies

```bash
# Root (E2E test runner)
npm install

# Backend
cd server && npm install && cd ..

# Frontend
cd chenda-frontend && npm install && cd ..
```

### 4. Set up the database

```bash
# Run all migrations (creates tables, indexes, session table)
node migrations/migrate.js up

# Seed initial data (180 USDA product types + 10 test users + 30 test products)
node seeds/seed.js
```

### 5. Start both servers

Open **two terminals**:

```bash
# Terminal 1 — Backend API
cd server && npm run dev

# Terminal 2 — Frontend
cd chenda-frontend && npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | <http://localhost:3000> |
| Backend API | <http://localhost:3001> |
| API health check | <http://localhost:3001/api/health> |

---

## Running Tests

```bash
# Backend unit tests (71 tests across 4 suites)
cd server && npm test

# Backend with coverage report
cd server && npm run test:coverage

# Frontend unit tests
cd chenda-frontend && npm test

# E2E tests — requires both servers running on their default ports
npm run test:e2e

# E2E with HTML report (opens in browser after run)
npm run test:e2e:report
```

---

## Project Structure

```
chenda/
├── server/                  # Express.js API server (port 3001)
│   ├── algorithm/           # Chenda proximity-freshness ranking algorithm
│   ├── config/              # DB pool, Passport config, server config
│   ├── controllers/         # Route handlers (auth, products, orders, analytics)
│   ├── middleware/          # Auth guards, validation, image upload, analytics
│   ├── models/              # Database models (User, Product, ProductType, Order)
│   ├── routes/              # Express routers
│   ├── services/            # Geocoding, payment (mock), analytics
│   └── __tests__/           # Jest + Supertest integration tests
│
├── chenda-frontend/         # Next.js 16 app (port 3000)
│   └── src/
│       ├── app/
│       │   ├── (auth)/      # /login, /register
│       │   ├── (buyer)/     # /buyer, /cart, /checkout, /orders
│       │   └── (seller)/    # /seller, /products, /orders
│       ├── components/      # buyer, seller, cart, orders, maps, profile, ui
│       ├── lib/
│       │   ├── api/         # Axios API client
│       │   ├── stores/      # Zustand stores (auth, cart, search)
│       │   └── types/       # TypeScript types
│       └── hooks/           # Custom React hooks
│
├── chenda-algo/             # Original standalone algorithm module
├── migrations/              # SQL migration files + node runner
├── seeds/                   # Seed scripts and SQL data files
├── e2e/                     # Playwright end-to-end tests (18 tests)
├── postman/                 # Postman collection + environment
├── uploads/                 # Uploaded product images (gitignored)
└── docs/                    # Documentation and task history
```

---

## API Reference

Full endpoint documentation: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

**Base URL**: `http://localhost:3001`

| Category | Key Endpoints |
|----------|--------------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Search | `POST /api/products/search`, `GET /api/products/nearby` |
| Products | `GET/POST/PUT/DELETE /api/products` |
| Users | `GET/PUT /api/users/profile`, `PUT /api/users/preferences` |
| Orders | `POST /api/orders`, `POST /api/orders/:id/payment` |
| Analytics | `GET /api/analytics/seller-dashboard`, `GET /api/analytics/overview` |

Import the Postman collection for ready-to-run requests: [`postman/Chenda_API.postman_collection.json`](postman/Chenda_API.postman_collection.json)

---

## Documentation

| File | Contents |
|------|----------|
| [USER_GUIDE.md](USER_GUIDE.md) | How to register, search, sell, and manage preferences |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | Full dev setup, architecture, and how to contribute |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Local and cloud (VPS) deployment instructions |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Complete REST API reference with examples |
| [docs/TASK_BREAKDOWN.md](docs/TASK_BREAKDOWN.md) | Phase-by-phase development task history |
| [docs/architecture.md](docs/architecture.md) | Architecture and technology decisions |
| [FRONTEND_DESIGN.md](FRONTEND_DESIGN.md) | Design system, colour tokens, component patterns |

---

## Test Accounts

After seeding (`node seeds/seed.js`), the following test accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Buyer | `maria@test.com` | `password123` |
| Seller | `pedro@test.com` | `password123` |
| Both | `ana@test.com` | `password123` |

---

## License

ISC © Chenda Development Team

