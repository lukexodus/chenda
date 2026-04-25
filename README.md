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
- Order management with status updates and bulk order creation
- Payment monitoring with alerts and discrepancy detection
- Payment reconciliation to verify payment records match delivery status
- Refund management (full/partial refunds)
- Settlement history and payout tracking
- Analytics dashboard (active listings, freshness overview, revenue trends)

### Platform
- Role-based access: **buyer**, **seller**, **rider**, or **both**
- Session-based authentication using PostgreSQL-stored sessions
- 180 USDA product type taxonomy with searchable combobox
- Geocoding with 7-day result caching and rate limiting
- **66 REST API endpoints** with full request/response documentation and examples
- Delivery tracking and rider assignment (in-house and third-party)
- In-app delivery notifications with real-time status updates
- Analytics dashboard (algorithm, business, performance, seller, user activity, real-time)

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
- **(Optional) Docker & Docker Compose** for containerized setup

**Setup options:**
- **Docker** (recommended): See [docs/setup/DOCKER_SETUP.md](docs/setup/DOCKER_SETUP.md)
- **Local development**: See [docs/setup/QUICK_SETUP.md](docs/setup/QUICK_SETUP.md) or [docs/operations/DEVELOPER_GUIDE.md](docs/operations/DEVELOPER_GUIDE.md)

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
# Backend unit tests
cd server && npm test

# Backend with coverage report
cd server && npm run test:coverage

# Frontend unit tests
cd chenda-frontend && npm test

# E2E tests — requires both servers running on their default ports
npm run test:e2e

# E2E with HTML report (opens in browser after run)
npm run test:e2e:report

# Manual E2E testing (recommended for comprehensive feature validation)
# See: docs/operations/MANUAL_E2E_TESTING_GUIDE.md (7 test suites covering all major features)
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

Full endpoint documentation: [docs/architecture/API_DOCUMENTATION.md](docs/architecture/API_DOCUMENTATION.md)

**Base URL**: `http://localhost:3001`

| Category | Key Endpoints |
|----------|--------------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Search | `POST /api/products/search`, `GET /api/products/nearby` |
| Products | `GET/POST/PUT/DELETE /api/products`, `GET /api/product-types` |
| Users | `GET/PUT /api/users/profile`, `PUT /api/users/preferences` |
| Orders | `POST /api/orders`, `POST /api/orders/batch`, `POST /api/orders/:id/payment`, `POST /api/orders/:id/refunds` |
| Payments | `POST /api/orders/reconciliation/run`, `GET /api/orders/payment-monitoring/summary`, `GET /api/orders/seller/payments/settlements` |
| Deliveries | `POST /api/deliveries/orders/:orderId/assign-in-house`, `GET /api/deliveries/rider/dashboard`, `POST /api/deliveries/:id/proof-photo` |
| Analytics | `GET /api/analytics/seller-dashboard`, `GET /api/analytics/business`, `GET /api/analytics/realtime` |

**Total: 66 endpoints** across 10 API categories.

Import the Postman collection for ready-to-run requests: [`postman/Chenda_API.postman_collection.json`](postman/Chenda_API.postman_collection.json)

---

## Documentation

### Getting Started
| File | Contents |
|------|----------|
| [docs/setup/QUICK_SETUP.md](docs/setup/QUICK_SETUP.md) | Fast 5-minute setup for development |
| [docs/setup/DOCKER_SETUP.md](docs/setup/DOCKER_SETUP.md) | Docker Compose setup with dev/prod configs, bind mounts, troubleshooting |
| [docs/setup/USER_GUIDE.md](docs/setup/USER_GUIDE.md) | How to register, search, sell, and manage preferences |

### Development
| File | Contents |
|------|----------|
| [docs/operations/DEVELOPER_GUIDE.md](docs/operations/DEVELOPER_GUIDE.md) | Full dev setup, architecture, coding patterns, and contribution guide |
| [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) | System architecture, database design, and technology decisions |
| [docs/architecture/DATABASE_SCHEMA.md](docs/architecture/DATABASE_SCHEMA.md) | Complete PostgreSQL schema with tables, indexes, and relationships |
| [docs/architecture/FRONTEND_DESIGN.md](docs/architecture/FRONTEND_DESIGN.md) | Design system, colour tokens, component patterns, and UI guidelines |
| [docs/architecture/COMPONENT_CATALOG.md](docs/architecture/COMPONENT_CATALOG.md) | Interactive component library with usage examples |

### API & Testing
| File | Contents |
|------|----------|
| [docs/architecture/API_DOCUMENTATION.md](docs/architecture/API_DOCUMENTATION.md) | Complete REST API reference (66 endpoints) with request/response examples |
| [docs/operations/MANUAL_E2E_TESTING_GUIDE.md](docs/operations/MANUAL_E2E_TESTING_GUIDE.md) | Step-by-step manual E2E testing procedures for all features (7 test suites) |
| [docs/architecture/ALIGNMENT_AUDIT.md](docs/architecture/ALIGNMENT_AUDIT.md) | Audit of implementation vs. documentation vs. test coverage |

### Deployment & Operations
| File | Contents |
|------|----------|
| [docs/operations/DEPLOYMENT_GUIDE.md](docs/operations/DEPLOYMENT_GUIDE.md) | Local and cloud (VPS) deployment instructions |
| [docs/setup/ENVIRONMENT_CONFIG_GUIDE.md](docs/setup/ENVIRONMENT_CONFIG_GUIDE.md) | Environment variables, secrets, and configuration management |
| [docs/operations/BACKUP_RESTORE_RUNBOOK.md](docs/operations/BACKUP_RESTORE_RUNBOOK.md) | Database backup and restore procedures |
| [docs/operations/BROWSE_DB_GUIDE.md](docs/operations/BROWSE_DB_GUIDE.md) | How to browse and query the database |

### Reference & Learning
| File | Contents |
|------|----------|
| [docs/learning/PROCESS_FLOWS.md](docs/learning/PROCESS_FLOWS.md) | Visual and step-by-step guides for core business processes (Dispatch, Delivery, etc.) |
| [docs/learning/CHENDA_ALGORITHM_EXPLANATION.md](docs/learning/CHENDA_ALGORITHM_EXPLANATION.md) | Deep dive into the proximity-freshness scoring logic |
| [docs/learning/PROJECT_LEARNING_GUIDE.md](docs/learning/PROJECT_LEARNING_GUIDE.md) | Curated guide for mastering the codebase and architecture |
| [docs/architecture/BACKEND_CORE_USE_CASES.md](docs/architecture/BACKEND_CORE_USE_CASES.md) | Core backend business logic and workflows |
| [docs/architecture/DESIGN_SYSTEM.md](docs/architecture/DESIGN_SYSTEM.md) | Design tokens, typography, spacing, and visual guidelines |
| [docs/learning/TROUBLESHOOTING_GUIDE.md](docs/learning/TROUBLESHOOTING_GUIDE.md) | Common issues and how to resolve them |

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

