# Chenda Project: Algorithm → Full-Stack Web Application

---

## �️ Setup & Installation

**New to the project?** Get started quickly:

- 📋 **Quick Setup**: [QUICK_SETUP.md](QUICK_SETUP.md) - 5-minute setup guide
- 📖 **Detailed Guide**: [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete documentation with troubleshooting

### Prerequisites
- **Node.js 20+** | **PostgreSQL 15** | **PostGIS Extension**

### Quick Start
```bash
# Windows (use Git Bash)
./setup-backend-windows.bat

# Linux
./setup-backend-linux.sh

# Then:
node migrations/migrate.js up    # Run migrations
node seeds/seed.js               # Seed database
cd server && npm run dev         # Start backend
cd chenda-frontend && npm run dev # Start frontend
```

---

## �🚀 API Quick Reference

**Status**: ✅ **Backend API Complete** (Task 1.8 - Analytics & Logging)  
**Base URL**: `http://localhost:3001`  
**Documentation**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)  
**Postman Collection**: [postman/Chenda_API.postman_collection.json](postman/Chenda_API.postman_collection.json)

### **Available Endpoints** (25+ endpoints)

| Category | Endpoints | Status | Authentication |
|----------|-----------|--------|----------------|
| **Health** | Health check | ✅ | Public |
| **Authentication** | Register, Login, Logout, Profile | ✅ | Public/Private |
| **Search (Algorithm)** | Main search, Personalized, Nearby | ✅ | Private/Public |
| **Products** | CRUD, Image upload | ✅ | Seller/Public |
| **Users** | Profile, Preferences, Geocoding | ✅ | Private |
| **Orders** | Create, Payment, Tracking | ✅ | Buyer/Seller |
| **Analytics** | Algorithm, Business, Performance | ✅ | Private/Public |

### **Key Features**
- 🎯 **Chenda Algorithm**: Proximity-freshness ranking for perishable goods
- 🔐 **Session Authentication**: PostgreSQL-based session management
- 📊 **Comprehensive Analytics**: 7 dashboard endpoints with role-based access
- 💳 **Mock Payments**: Complete order workflow simulation
- 🗺️ **Geolocation**: Nominatim API integration with caching
- 🏷️ **Role-Based Access**: Buyer/Seller/Admin permission system

### **Quick Start - API Testing**
```bash
# 1. Start the server
cd server && npm start

# 2. Test health check
curl http://localhost:3001/api/health

# 3. Register a test user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "password": "password123", "type": "buyer"}'

# 4. Import Postman Collection for complete testing
```

### **Documentation Links**
- **Complete API Reference**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Postman Collection**: [Chenda_API.postman_collection.json](postman/Chenda_API.postman_collection.json)
- **Environment Setup**: [Chenda_Environment.postman_environment.json](postman/Chenda_Environment.postman_environment.json)
- **Search Algorithm Performance**: 1-4ms execution, <50ms total response time

---

## 📋 Task Breakdown Overview

### **Total Phases: 3 Major Phases**
1. **Backend Integration** (Algorithm → Server)
2. **Frontend Development** (User Interface)
3. **Integration & Deployment** (Connect Everything)

---

# 🔧 PHASE 1: Backend Integration (Algorithm → Server)

## **Duration: 2-3 weeks**

### **Task 1.1: Database Setup** (3-4 days) ✅ **COMPLETE**
**Goal**: Set up PostgreSQL with PostGIS and create schema

#### Subtasks:
- [x] 1.1.1: Install PostgreSQL + PostGIS locally
- [x] 1.1.2: Create database schema (SQL files)
  - Users table (with POINT geometry)
  - Products table (with POINT geometry)
  - Product_Types table (USDA data)
  - Orders table (for mock payments)
  - Analytics_Events table (optional)
- [x] 1.1.3: Create spatial indexes (GIST on location columns)
- [x] 1.1.4: Write migration scripts
- [x] 1.1.5: Seed initial data (USDA product types)
- [x] 1.1.6: Test database connections

**Deliverables**:
- ✅ `migrations/001_create_tables.sql` (Users, Products, Product_Types, Orders, Analytics_Events)
- ✅ `migrations/002_create_indexes.sql` (GIST indexes, helper functions, materialized views)
- ✅ `migrations/migrate.js` (Migration runner with up/rollback/status commands)
- ✅ `migrations/test-connection.js` (Database connection and functionality tests)
- ✅ `seeds/product_types.sql` (180 USDA items)
- ✅ `seeds/mock_users.sql` (10 test users with locations)
- ✅ `seeds/mock_products.sql` (30 test products with locations)
- ✅ `seeds/generate-seeds.js` (JSON to SQL converter)
- ✅ `seeds/seed.js` (Database seeder with --force option)

**Tools**: PostgreSQL, PostGIS, node-postgres (pg)

---

### **Task 1.2: API Server Setup** (2-3 days) ✅ **COMPLETE**
**Goal**: Create Express.js server with basic structure

#### Subtasks:
- [x] 1.2.1: Initialize Node.js project
- [x] 1.2.2: Install dependencies (express, pg, bcrypt, passport, etc.)
- [x] 1.2.3: Create server structure
  ```
  server/
  ├── config/           # Database & environment config
  ├── routes/           # API endpoints
  ├── controllers/      # Business logic
  ├── models/           # Database models
  ├── middleware/       # Auth, validation, etc.
  └── app.js           # Main entry point
  ```
- [x] 1.2.4: Set up environment variables (.env)
- [x] 1.2.5: Create database connection pool
- [x] 1.2.6: Test server startup

**Deliverables**:
- ✅ `server/app.js` (Main Express application)
- ✅ `server/config/database.js` (PostgreSQL connection pool)
- ✅ `server/config/index.js` (Centralized configuration)
- ✅ `server/middleware/errorHandler.js` (Error handling)
- ✅ `server/middleware/logger.js` (Request logging)
- ✅ `server/routes/health.js` (Health check endpoint)
- ✅ Server running on `http://localhost:3001`
- ✅ Database connection verified

**Tools**: Express.js, dotenv, pg (node-postgres)

---

### **Task 1.3: Authentication System** (3-4 days) ✅ **COMPLETE**
**Goal**: Implement email/password authentication with optional verification

#### Subtasks:
- [x] 1.3.1: Create User model (CRUD operations)
- [x] 1.3.2: Implement Passport.js Local Strategy
- [x] 1.3.3: Create auth routes
  - POST `/api/auth/register` (with password hashing)
  - POST `/api/auth/login` (with session creation)
  - POST `/api/auth/logout`
  - GET `/api/auth/me` (get current user)
- [x] 1.3.4: Create auth middleware (protect routes)
- [x] 1.3.5: Implement session management (PostgreSQL storage)
- [ ] 1.3.6: **Optional**: Email verification system (skipped for MVP)
- [ ] 1.3.7: Add feature toggle for email verification (skipped for MVP)
- [x] 1.3.8: Test all auth flows (register, login, logout)

**Deliverables**:
- ✅ `server/models/User.js` (User model with CRUD operations)
- ✅ `server/config/passport.js` (Passport Local Strategy)
- ✅ `server/routes/auth.js` (Auth endpoints)
- ✅ `server/controllers/authController.js` (Auth business logic)
- ✅ `server/middleware/authenticate.js` (Auth middleware: isAuthenticated, isBuyer, isSeller, isOwner)
- ✅ `migrations/003_create_session_table.sql` (PostgreSQL session storage)
- ✅ Working auth endpoints (register, login, logout, /me, password update)

**Tools**: Passport.js, bcrypt, express-session, connect-pg-simple

---

### **Task 1.4: Algorithm Integration** (4-5 days) ✅ **COMPLETE**
**Goal**: Integrate existing Chenda algorithm with database queries

#### Subtasks:
- [x] 1.4.1: Copy algorithm modules to server
  ```
  server/algorithm/
  ├── chenda_algorithm.js
  ├── calculations/
  ├── scoring/
  └── ranking/
  ```
- [x] 1.4.2: Create Product model with algorithm integration
  - `getProductsWithMetrics(buyerLocation, config)`
  - Use PostGIS for distance: `ST_Distance(location::geography, $1::geography)`
- [x] 1.4.3: Create ProductType model (USDA data lookup)
- [x] 1.4.4: Create search endpoint
  - POST `/api/products/search`
  - Request: `{ buyer: {lat, lng}, config: {...} }`
  - Response: Ranked products from algorithm
- [x] 1.4.5: Optimize database queries
  - Combine distance + expiration filtering in SQL
  - Fetch product types in single query
  - Add query indexes
- [x] 1.4.6: Test algorithm integration
  - Compare JS algorithm output vs SQL+algorithm output
  - Verify performance (<100ms target)

**Deliverables**:
- ✅ `models/Product.js` (540+ lines with PostGIS integration)
- ✅ `models/ProductType.js` (230+ lines with USDA lookups)
- ✅ `controllers/searchController.js` (search + nearby endpoints)
- ✅ `routes/search.js` (3 routes: public, nearby, personalized)
- ✅ `middleware/asyncHandler.js` (error handling wrapper)
- ✅ Algorithm working with real database (30 products tested)
- ✅ Performance: 1-4ms algorithm execution, 17ms average total (target: <100ms)

**Tools**: Your existing algorithm + PostgreSQL queries

---

### **Task 1.5: Product Management API** (3 days) ✅ **COMPLETE**
**Goal**: CRUD operations for products (sellers only)

#### Subtasks:
- [x] 1.5.1: Create product routes
  - POST `/api/products` (create - sellers only)
  - GET `/api/products/:id` (view single)
  - GET `/api/products` (list user's products)
  - PUT `/api/products/:id` (update - owner only)
  - DELETE `/api/products/:id` (delete - owner only)
- [x] 1.5.2: Add authorization middleware
  - Check if user is seller/both
  - Check if user owns product (for update/delete)
- [x] 1.5.3: Implement image upload (multer)
  - POST `/api/products/upload-image`
  - Store in `/uploads/products/`
  - Return file URL
- [x] 1.5.4: Add validation middleware
  - Validate product fields
  - Validate days_already_used < total_shelf_life
  - Validate coordinates
- [x] 1.5.5: Test all CRUD operations

**Deliverables**:
- ✅ `controllers/productController.js` (660+ lines with full CRUD operations)
- ✅ `routes/products.js` (7 routes with authentication and validation)
- ✅ `middleware/uploadImage.js` (multer configuration for image uploads)
- ✅ `middleware/validateProduct.js` (express-validator rules for create/update)
- ✅ Image upload endpoint working (5MB max, jpeg/jpg/png/gif/webp)
- ✅ Static file serving for `/uploads` directory
- ✅ All 10 CRUD tests passed (create, read, update, delete, validation, authorization)

**Tools**: Express.js, Multer, express-validator

---

### **Task 1.6: User Management API** (2 days) ✅ **COMPLETE**
**Goal**: User profile and preferences

#### Subtasks:
- [x] 1.6.1: Create user routes
  - GET `/api/users/profile` (get own profile)
  - PUT `/api/users/profile` (update profile)
  - PUT `/api/users/preferences` (update search preferences)
  - PUT `/api/users/location` (update location)
- [x] 1.6.2: Implement geocoding integration
  - POST `/api/users/geocode` (address → lat/lng)
  - POST `/api/users/reverse-geocode` (lat/lng → address)
  - Use Nominatim API with rate limiting (1 req/second)
  - Cache results for 7 days
- [x] 1.6.3: Add validation for preferences
  - Ensure weights sum to 100%
  - Validate coordinate ranges (-90/90, -180/180)
  - Validate all preference fields
- [x] 1.6.4: Test user updates

**Deliverables**:
- ✅ `routes/users.js` (56 lines with 6 endpoints)
- ✅ `controllers/userController.js` (374 lines with full validation)
- ✅ `services/geocodingService.js` (229 lines with caching & rate limiting)
- ✅ Working user management (8/8 tests passed)
- ✅ Test scripts: `quick-test.sh`, `test-user-api.sh`

**Tools**: Axios (for Nominatim), node-cache, express-validator

---

### **Task 1.7: Mock Payment System** (1-2 days) ✅ **COMPLETE**
**Goal**: Placeholder payment endpoints

#### Subtasks:
- [x] 1.7.1: Create Orders table in database
- [x] 1.7.2: Create order routes
  - POST `/api/orders` (create order)
  - POST `/api/orders/:id/payment` (mock payment)
  - GET `/api/orders/:id` (view order)
  - GET `/api/orders` (list user's orders)
- [x] 1.7.3: Implement mock payment service
  - Simulate 2-second payment processing
  - Generate mock transaction IDs
  - Support: cash, gcash, card (all mock)
- [x] 1.7.4: Add order status tracking
  - pending → paid (mock) → completed
- [x] 1.7.5: Test order flow

**Deliverables**:
- ✅ `routes/orders.js` (95 lines with 6 endpoints and validation)
- ✅ `controllers/orderController.js` (345 lines with full order management)
- ✅ `services/paymentService.js` (230 lines with mock payment processing)
- ✅ Mock payment working (all 3 methods with different success rates)
- ✅ Complete order workflow (create → pay → track → complete)
- ✅ Test script: `test-order-api.sh`

**Tools**: Express.js, PostgreSQL

---

### **Task 1.8: Analytics & Logging** (1-2 days) ✅ **COMPLETE**
**Goal**: Track algorithm usage and performance

#### Subtasks:
- [x] 1.8.1: Create analytics table (if not using Plausible)
- [x] 1.8.2: Create analytics service
  - Track search events
  - Track preference changes
  - Track algorithm performance metrics
- [x] 1.8.3: Add analytics middleware
  - Log all search requests
  - Track weight distributions
  - Monitor response times
- [x] 1.8.4: Create simple analytics dashboard query
  - Most common weight presets
  - Average response time
  - Popular product types
- [ ] 1.8.5: **Optional**: Set up Plausible Analytics (self-hosted)

**Deliverables**:
- ✅ `services/analyticsService.js` (330+ lines)
- ✅ `middleware/analyticsMiddleware.js` (240+ lines)
- ✅ `controllers/analyticsController.js` (430+ lines)
- ✅ `routes/analytics.js` (analytics dashboard)
- ✅ Analytics tracking working

**Tools**: PostgreSQL

---

### **Task 1.9: API Testing** (2 days) ✅ **COMPLETE**
**Goal**: Comprehensive API endpoint testing

#### Subtasks:
- [x] 1.9.1: Set up test environment
  - Create test database
  - Configure test environment variables
- [x] 1.9.2: Write integration tests
  - Test auth flow (register, login, logout)
  - Test product CRUD
  - Test search algorithm endpoint
  - Test user preferences update
  - Test mock payment flow
- [x] 1.9.3: Test error handling
  - Invalid inputs
  - Unauthorized access
  - Database errors
- [x] 1.9.4: Performance testing
  - Search with 100 products
  - Concurrent request handling

**Deliverables**:
- ✅ `server/__tests__/auth.test.js` (18/18 passing)
- ✅ `server/__tests__/users.test.js` (22/22 passing)
- ✅ `server/__tests__/products.test.js` (19/19 passing)
- ✅ `server/__tests__/search.test.js` (12/12 passing)
- ✅ `server/__tests__/setup.js` + `helpers.js` (test infrastructure)
- ✅ 71/71 tests passing (100%) across 4 test suites

**Tools**: Jest, Supertest, pg (for test database)

---

### **Task 1.10: API Documentation** (1 day) ✅ **COMPLETE**
**Goal**: Document all API endpoints

#### Subtasks:
- [x] 1.10.1: Create comprehensive API documentation
  - List all 25+ endpoints with methods and URLs
  - Request/response schemas and examples
  - Authentication requirements per endpoint
  - Error codes and status messages
  - Common workflows and usage patterns
- [x] 1.10.2: Create Postman collection
  - Pre-configured requests for all endpoints
  - Environment variables for base URL and auth
  - Sample request bodies and test data
  - Automated test scripts for key workflows
- [x] 1.10.3: Update main README with API overview
  - Add API quick reference section
  - Link to detailed documentation
  - Developer setup instructions for API testing

**Deliverables**:
- ✅ `API_DOCUMENTATION.md` - Complete endpoint reference
- ✅ `postman/Chenda_API.postman_collection.json`
- ✅ `postman/Chenda_Environment.postman_environment.json`
- ✅ Updated main README with API overview section

---

## **Phase 1 Summary**
**Total Duration**: 2-3 weeks  
**Total Tasks**: 10 major tasks, 50+ subtasks  
**Deliverables**: Working REST API with algorithm integration

---

# 🎨 PHASE 2: Frontend Development (User Interface)

## **Duration: 3-4 weeks**

### **Task 2.1: Project Setup** (1 day)
**Goal**: Initialize frontend project with Next.js

#### Subtasks:
- [x] 2.1.1: Create Next.js app
  ```bash
  npx create-next-app@latest chenda-frontend
  ```
- [x] 2.1.2: Install dependencies
  - Tailwind CSS + shadcn/ui
  - Leaflet.js (maps)
  - Axios (API calls)
  - React Hook Form (forms)
  - Zustand or Context API (state management)
- [x] 2.1.3: Set up project structure
  ```
  app/
  ├── (auth)/          # Login, register pages
  ├── (buyer)/         # Buyer features
  ├── (seller)/        # Seller features
  ├── api/             # API proxy (optional)
  └── layout.js        # Root layout
  components/
  ├── ui/              # shadcn components
  ├── maps/            # Map components
  ├── products/        # Product components
  └── layout/          # Layout components
  lib/
  ├── api.js           # API client
  └── utils.js         # Utility functions
  ```
- [x] 2.1.4: Configure Tailwind CSS
- [x] 2.1.5: Set up environment variables (.env.local)

**Deliverables**:
- Working Next.js app on `http://localhost:3000`
- Project structure established
- Styling system configured

**Tools**: Next.js 14, Tailwind CSS, shadcn/ui

---

### **Task 2.2: Authentication UI** (2-3 days) ✅ **COMPLETE**
**Goal**: Login, registration, and session management

#### Subtasks:
- [x] 2.2.1: Create login page
  - Email + password form
  - Form validation (React Hook Form)
  - "Remember me" checkbox
  - Link to register
- [x] 2.2.2: Create registration page
  - Email, password, name, user type (buyer/seller/both)
  - Password confirmation
  - Terms & conditions checkbox
  - **Optional**: Email verification notice (skipped)
- [x] 2.2.3: Implement auth state management
  - Store user session (HTTP-only cookies + Zustand)
  - Create Zustand auth store
  - Protected route wrapper
- [x] 2.2.4: Create logout functionality (API integration ready)
- [x] 2.2.5: Add loading states and error handling
- [ ] 2.2.6: **Optional**: Email verification page (intentionally skipped)

**Deliverables**:
- ✅ `app/(auth)/login/page.tsx` - Login page with Chenda branding
- ✅ `app/(auth)/register/page.tsx` - Registration page with Chenda branding
- ✅ `components/auth/LoginForm.tsx` - Complete login form with Remember Me
- ✅ `components/auth/RegisterForm.tsx` - Registration form with radio buttons
- ✅ `components/auth/ProtectedRoute.tsx` - Auth guard wrapper with role checks
- ✅ `lib/validators/authSchemas.ts` - Zod validation schemas
- ✅ `components/ui/radio-group.tsx` - Radio button component
- ✅ `components/ui/checkbox.tsx` - Checkbox component
- ✅ Protected buyer and seller layouts
- ✅ Working authentication flow (session-based)
- ✅ **Guide**: `chenda-frontend/TASK_2.2_AUTH_GUIDE.md`

**Tools**: React Hook Form, Zod (validation), Axios, Zustand

---

### **Task 2.3: Buyer Dashboard** (3-4 days) ✅ **COMPLETE**
**Goal**: Main interface for buyers to search products

#### Subtasks:
- [x] 2.3.1: Create buyer layout
  - Navigation bar (home, search, orders, profile)
  - User dropdown menu
  - Responsive design
- [x] 2.3.2: Create search interface
  - Location input (address search with Nominatim)
  - Weight sliders (proximity vs freshness)
  - Max radius selector (10-100km)
  - Min freshness threshold (0-100%)
  - Search button
- [x] 2.3.3: Create product results display
  - Product cards with image, name, price, freshness, distance
  - Freshness indicator (progress bar or badge)
  - Distance indicator
  - Combined score display
  - Rank badge (#1, #2, etc.)
- [x] 2.3.4: Create product detail modal
  - Full product information
  - Seller information
  - Expiration date
  - Location on map (Leaflet.js)
  - "Add to Cart" button (mock)
- [x] 2.3.5: Add sorting options
  - Toggle between ranking/filter mode
  - Sort by: score, price, distance, freshness
- [x] 2.3.6: Add loading states and empty states

**Deliverables**:
- ✅ `app/(buyer)/page.tsx` (213 lines - Complete buyer dashboard)
- ✅ `components/buyer/SearchForm.tsx` (317 lines - Full search interface with geocoding)
- ✅ `components/products/ProductCard.tsx` (188 lines - Product cards with freshness indicators)
- ✅ `components/products/ProductGrid.tsx` (75 lines - Responsive product grid)
- ✅ `components/products/ProductDetail.tsx` (331 lines - Modal with Leaflet map integration)
- ✅ `components/products/ProductMap.tsx` (81 lines - Interactive Leaflet map component)
- ✅ `components/products/SortControls.tsx` (93 lines - 5 sorting options)
- ✅ `lib/stores/searchStore.ts` (169 lines - Zustand store with localStorage persistence)
- ✅ `lib/stores/cartStore.ts` (110 lines - Shopping cart state management)
- ✅ Working buyer search interface (1,577 lines total)
- ✅ Frontend builds successfully

**Tools**: React, Tailwind CSS, shadcn/ui components, Zustand, Leaflet.js

---

### **Task 2.4: Map Integration** (2-3 days) ✅ **COMPLETE**
**Goal**: Visual map display of products

#### Subtasks:
- [x] 2.4.1: Set up Leaflet.js
  - Install and configure
  - Create map component
  - Use OpenStreetMap tiles
- [x] 2.4.2: Create map view for search results
  - Show buyer location (blue marker)
  - Show product locations (custom markers)
  - Color-code by freshness (green=fresh, yellow=ok, red=expiring)
  - Draw radius circle (visual max_radius)
- [x] 2.4.3: Add map interactivity
  - Click marker to open product popup
  - Hover to highlight product card
  - Sync map with product list
- [x] 2.4.4: Create address autocomplete
  - Integrate Nominatim search
  - Dropdown suggestions
  - Click to set location
- [x] 2.4.5: Add geolocation button
  - "Use my current location"
  - Browser geolocation API
  - Update map center

**Deliverables**:
- ✅ `components/maps/SearchResultsMap.tsx` (245 lines - Multi-product map with color-coded markers)
- ✅ `components/maps/AddressAutocomplete.tsx` (195 lines - Address search with dropdown suggestions)
- ✅ `components/maps/GeolocationButton.tsx` (81 lines - Reusable geolocation button)
- ✅ `components/maps/ProductDetailMap.tsx` (Renamed from ProductMap.tsx - Single product map)
- ✅ `app/(buyer)/page.tsx` - Updated with List/Map view toggle (270 lines total)
- ✅ `components/buyer/SearchForm.tsx` - Refactored to use new map components (255 lines)
- ✅ Interactive map working with freshness color coding
- ✅ Frontend builds successfully

**Tools**: Leaflet.js, React-Leaflet, Nominatim API

---

### **Task 2.5: Seller Dashboard** (3-4 days) ✅ **COMPLETE**
**Goal**: Product management for sellers

#### Subtasks:
- [x] 2.5.1: Create seller layout
  - Navigation: products, add product, orders, analytics
  - Seller-specific menu items
- [x] 2.5.2: Create product list page
  - Table/grid of seller's products
  - Show: name, price, freshness, days left
  - Actions: edit, delete
  - Freshness warnings (expiring soon)
- [x] 2.5.3: Create "Add Product" form
  - Product type selector (180 USDA types with search)
  - Price input
  - Quantity + unit
  - Days already used
  - Image upload (with preview)
  - Location (auto-fill from seller profile)
  - Description textarea
  - Submit button
- [x] 2.5.4: Create "Edit Product" form
  - Pre-filled with existing data
  - Same fields as add form
  - Update functionality
- [x] 2.5.5: Add product deletion
  - Confirmation dialog
  - Delete API call
- [x] 2.5.6: Create seller analytics view
  - Average product freshness
  - Total active listings
  - Products expiring within 3 days
  - Most popular product types

**Deliverables**:
- ✅ `app/(seller)/products/page.tsx` (uses ProductTable component)
- ✅ `app/(seller)/products/add/page.tsx` (Add product form)
- ✅ `app/(seller)/products/[id]/edit/page.tsx` (Edit product form)
- ✅ `app/(seller)/dashboard/page.tsx` (Seller analytics dashboard)
- ✅ `components/seller/ProductForm.tsx` (455+ lines - Reusable form with validation & image upload)
- ✅ `components/seller/ProductTable.tsx` (370+ lines - Responsive table with freshness indicators)
- ✅ `components/seller/SellerAnalytics.tsx` (245+ lines - Dashboard metrics and charts)
- ✅ `components/seller/ProductTypeCombobox.tsx` (165+ lines - Searchable product type selector)
- ✅ `server/routes/productTypes.js` (Backend endpoint for USDA product types)
- ✅ `lib/types/seller.ts` (TypeScript types for seller components)
- ✅ `components/ui/table.tsx`, `components/ui/textarea.tsx` (New UI components)
- ✅ Working seller product management (1,235+ lines total)
- ✅ Frontend builds successfully

**Tools**: React Hook Form, shadcn/ui, TypeScript, Multer (backend)

---

### **Task 2.6: User Profile & Preferences** (2 days) ✅ **COMPLETE**
**Goal**: User settings and algorithm preferences

#### Subtasks:
- [x] 2.6.1: Create profile page
  - Name, email (read-only)
  - User type (buyer/seller/both)
  - Avatar with initials (no upload for MVP)
  - Save changes button
- [x] 2.6.2: Create location settings
  - Current address display
  - Address search (Nominatim)
  - Interactive map with draggable marker
  - Save location button
- [x] 2.6.3: Create algorithm preferences (buyers)
  - Weight preset selector (balanced, proximity, freshness)
  - Custom weight sliders
  - Default max radius
  - Default min freshness
  - Display mode preference (ranking/filter)
  - Save preferences button
- [x] 2.6.4: Add storage condition preference
  - Pantry, Refrigerated, Frozen
  - Multi-select checkboxes
- [x] 2.6.5: Create password change form
  - Current password
  - New password + confirmation
  - Password strength indicator
  - Update password

**Deliverables**:
- ✅ `app/(buyer)/profile/page.tsx` (Profile page for buyers)
- ✅ `app/(seller)/profile/page.tsx` (Profile page for sellers)
- ✅ `components/profile/ProfileForm.tsx` (243 lines - Tab layout with profile info)
- ✅ `components/profile/LocationSettings.tsx` (212 lines - Location tab with map)
- ✅ `components/profile/AlgorithmPreferences.tsx` (329 lines - Preferences tab with presets & sliders)
- ✅ `components/profile/StoragePreference.tsx` (56 lines - Storage condition multi-select)
- ✅ `components/profile/PasswordChangeForm.tsx` (288 lines - Security tab with password change)
- ✅ `lib/types/profile.ts` (76 lines - TypeScript types for profile features)
- ✅ Working profile management (1,204+ lines total)

**Tools**: React Hook Form, Leaflet.js (location picker), Zustand

---

### **Task 2.7: Mock Payment UI** (1-2 days) ✅ **COMPLETE**
**Goal**: Checkout flow with mock payment

#### Subtasks:
- [x] 2.7.1: Create shopping cart (simple)
  - Add products to cart (in-memory or localStorage)
  - Display cart items
  - Remove from cart
  - Calculate total
- [x] 2.7.2: Create checkout page
  - Cart summary
  - Delivery address confirmation
  - Payment method selector (Cash/GCash/Card - all mock)
  - Place order button
- [x] 2.7.3: Create payment modal
  - Show selected payment method
  - "Processing payment..." animation
  - Mock 2-second delay
  - Success/failure message
- [x] 2.7.4: Create order confirmation page
  - Order ID
  - Mock transaction ID
  - Order items
  - Total amount
  - Payment method
  - "Back to Dashboard" button
- [x] 2.7.5: Add prominent mock disclaimer
  - Banner: "⚠️ This is a mock payment system"
  - Explain no real transactions occur

**Deliverables**:
- ✅ `app/(buyer)/cart/page.tsx` (68 lines - Shopping cart with CartSummary component)
- ✅ `app/(buyer)/checkout/page.tsx` (330 lines - Checkout with payment method selection)
- ✅ `app/(buyer)/orders/[id]/page.tsx` (112 lines - Order confirmation with success banner)
- ✅ `components/payment/PaymentModal.tsx` (232 lines - Payment processing with 2s delay)
- ✅ `components/cart/CartSummary.tsx` (179 lines - Reusable cart summary with quantity controls)
- ✅ `lib/types/order.ts` (157 lines - Order, payment, and status TypeScript types)
- ✅ Mock payment flow working with backend integration
- ✅ Prominent mock disclaimers on checkout and payment screens

**Tools**: React, localStorage (cart state), date-fns

---

### **Task 2.8: Orders & History** (2 days) ✅ **COMPLETE**
**Goal**: View order history (buyers and sellers)

#### Subtasks:
- [x] 2.8.1: Create buyer orders page
  - List all orders (newest first)
  - Show: order date, items, total, status
  - Click to view details
- [x] 2.8.2: Create seller orders page
  - List orders for seller's products
  - Show: buyer info, items, total, status
  - Mark as "completed" (mock)
- [x] 2.8.3: Create order detail view
  - Full order information
  - Product details
  - Payment info (mock)
  - Status timeline
- [x] 2.8.4: Add order filters
  - Status: all, pending, paid, completed
  - Date range picker

**Deliverables**:
- ✅ `app/(buyer)/orders/page.tsx` (130 lines - Buyer orders list with status filtering)
- ✅ `app/(seller)/orders/page.tsx` (228 lines - Seller orders with status update functionality)
- ✅ `components/orders/OrderCard.tsx` (126 lines - Order card with role-based display)
- ✅ `components/orders/OrderDetail.tsx` (282 lines - Full order details with status timeline)
- ✅ Status filtering tabs (All, Pending, Paid, Completed, Cancelled)
- ✅ Seller can mark orders as completed
- ✅ Order detail modal for sellers
- ✅ Working order views with date-fns formatting

**Tools**: React, date-fns (date formatting), shadcn/ui Tabs

---

### **Task 2.9: Responsive Design & Polish** (2-3 days) ✅ **COMPLETE**
**Goal**: Ensure mobile-friendly UI and polish

#### Subtasks:
- [x] 2.9.1: Test on mobile devices
  - iPhone (Safari)
  - Android (Chrome)
  - Tablet sizes
- [x] 2.9.2: Fix responsive issues
  - Navigation menu (hamburger on mobile)
  - Product cards (stack on mobile)
  - Forms (full-width on mobile)
  - Map (adjust height on mobile)
- [x] 2.9.3: Add loading skeletons
  - Product cards skeleton
  - Form skeleton
  - Map skeleton
- [x] 2.9.4: Add empty states
  - No products found
  - No orders yet
  - Empty cart
- [x] 2.9.5: Add success/error toasts
  - Product added notification
  - Profile saved
  - Order placed
  - Error messages
- [x] 2.9.6: Accessibility improvements
  - Keyboard navigation
  - ARIA labels
  - Focus states
  - Color contrast

**Deliverables**:
- Fully responsive UI (mobile, tablet, desktop)
- Loading states throughout
- Empty states throughout
- Toast notifications
- Accessibility improvements

**Tools**: Tailwind CSS responsive utilities, React-Hot-Toast, ARIA attributes

---

### **Task 2.10: Frontend Testing** (2 days)
**Goal**: Component and integration testing

#### Subtasks:
- [x] 2.10.1: Set up testing environment
  - Jest + React Testing Library
  - Mock API responses
- [x] 2.10.2: Write component tests
  - Auth forms
  - Product cards
  - Search form
  - Profile forms
- [x] 2.10.3: Write integration tests
  - Login → Search → View Product flow
  - Register → Complete Profile flow
  - Seller: Add Product flow
- [x] 2.10.4: Test error states
  - API failures
  - Invalid form inputs
  - Network errors

**Deliverables**:
- `__tests__/` directory with test files
- Component tests passing
- Integration tests passing

**Tools**: Jest, React Testing Library, MSW (Mock Service Worker)

---

## **Phase 2 Summary**
**Total Duration**: 3-4 weeks  
**Total Tasks**: 10 major tasks, 60+ subtasks  
**Deliverables**: Complete user interface (buyer + seller)

---

# 🔗 PHASE 3: Integration & Deployment

## **Duration**: 1-2 weeks

### **Task 3.1: Frontend-Backend Integration** (2-3 days)
**Goal**: Connect frontend to backend API

#### Subtasks:
- [x] 3.1.1: Configure API client
  - Set backend URL in environment variables
  - Add authentication headers
  - Handle token refresh (if using JWT)
- [x] 3.1.2: Test all API endpoints from frontend
  - Auth flow
  - Product search
  - Product CRUD
  - User profile updates
  - Mock payments
- [x] 3.1.3: Fix CORS issues (if any)
- [x] 3.1.4: Add request/response interceptors
  - Error handling
  - Loading states
  - Token management
- [x] 3.1.5: Test error scenarios
  - Network failures
  - API errors (4xx, 5xx)
  - Validation errors

**Deliverables**:
- Frontend successfully communicating with backend
- All features working end-to-end

**Tools**: Axios interceptors, error boundaries

---

### **Task 3.2: End-to-End Testing** (2 days) ✅ **COMPLETE**
**Goal**: Test complete user journeys

#### Subtasks:
- [x] 3.2.1: Set up E2E testing framework (Playwright)
- [x] 3.2.2: Write E2E tests
  - **Buyer journey**: Register → Search → View Product → Checkout
  - **Seller journey**: Register → Add Product → View Orders
  - **Auth flow**: Login → Logout → Login again
- [x] 3.2.3: Test cross-browser
  - Chrome ✅
  - Firefox ✅
  - Safari (skipped - Chrome + Firefox coverage)
- [ ] 3.2.4: Fix bugs discovered during E2E testing (ongoing as tests run)

**Deliverables**:
- ✅ `playwright.config.ts` (Playwright configuration for Chrome + Firefox)
- ✅ `e2e/auth-flow.spec.ts` (6 authentication tests)
- ✅ `e2e/buyer-journey.spec.ts` (5 buyer flow tests)
- ✅ `e2e/seller-journey.spec.ts` (7 seller flow tests)
- ✅ `e2e/helpers/testHelpers.ts` (Reusable test utilities)
- ✅ `e2e/setup/database.ts` (Separate test database management)
- ✅ `e2e/scripts/` (Setup, teardown, and cleanup scripts)
- ✅ `e2e/README.md` (Comprehensive E2E testing guide)
- ✅ `package.json` (NPM scripts for E2E testing)
- ✅ **18 E2E tests total** covering critical user paths

**Tools**: Playwright, PostgreSQL (chenda_e2e_test database)

---

### **Task 3.3: Performance Optimization** (2 days)
**Goal**: Optimize for production

#### Subtasks:
- [x] 3.3.1: Frontend optimization ✅ COMPLETE
  - ~~Image optimization (next/image)~~ (skipped — placeholder images only)
  - Code splitting via Next.js route groups (automatic)
  - Lazy loading: `SellerAnalytics`, `OrderDetail`, `PaymentModal` via `next/dynamic + ssr: false`
  - Bundle: `reactStrictMode: true`, `compress: true`, `poweredByHeader: false`, modern image formats (avif/webp)
- [x] 3.3.2: Backend optimization ✅ COMPLETE
  - B-tree indexes added: `migrations/004_optimize_indexes.sql` (10 indexes on orders, products, analytics_events, users, session)
  - DB pool tuned: `min: 2`, `connectionTimeoutMillis: 10000`, `allowExitOnIdle: true`
  - Response compression (gzip): `compression` middleware (threshold 1024, level 6) in `server/app.js`
- [ ] 3.3.3: API response caching *(skipped)*
  - Cache product types (rarely change)
  - Cache geocoding results
  - Cache user preferences
- [ ] 3.3.4: Load testing *(skipped)*
  - Test with 100 concurrent users
  - Measure response times
  - Identify bottlenecks

**Deliverables**:
- Optimized frontend (Lighthouse score >90)
- Optimized backend (API response <100ms)
- Load test results documented

**Tools**: Lighthouse, Artillery (load testing), node-cache

---

### **Task 3.4: Security Hardening** (1 day)
**Goal**: Secure the application

#### Subtasks:
- [x] 3.4.1: Backend security
  - Rate limiting (express-rate-limit)
  - Helmet.js (security headers)
  - Input sanitization
  - SQL injection prevention (parameterized queries)
  - XSS prevention
- [x] 3.4.2: Frontend security
  - Sanitize user inputs
  - HTTPS enforcement (if deploying)
  - Secure cookie settings
- [x] 3.4.3: Authentication security
  - Password complexity requirements
  - Session timeout
  - CSRF protection (if needed)

**Deliverables**:
- Security measures implemented
- No critical vulnerabilities

**Tools**: Helmet.js, express-rate-limit, validator.js

---

### **Task 3.5: Documentation** (1-2 days) ✅ **COMPLETE
**Goal**: Complete project documentation

#### Subtasks:
- [x] 3.5.1: Create user documentation
  - How to register/login
  - How to search for products (buyer)
  - How to list products (seller)
  - How to adjust preferences
- [x] 3.5.2: Create developer documentation
  - Project setup instructions
  - Environment variables guide
  - Database setup guide
  - Running tests
- [x] 3.5.3: Create deployment guide
  - Local deployment steps
  - Environment configuration
  - Database migrations
- [x] 3.5.4: Update README
  - Project overview
  - Tech stack
  - Setup instructions
  - Screenshots/demo

**Deliverables**:
- `USER_GUIDE.md`
- `DEVELOPER_GUIDE.md`
- `DEPLOYMENT_GUIDE.md`
- Updated `README.md`

---

### **Task 3.6: Final Testing & Bug Fixes** (2-3 days)
**Goal**: Comprehensive testing and polish

#### Subtasks:
- [ ] 3.6.1: Manual testing checklist
  - Test all user flows
  - Test on different screen sizes
  - Test with different data scenarios
- [ ] 3.6.2: Fix discovered bugs
- [ ] 3.6.3: Cross-browser testing
- [ ] 3.6.4: Accessibility audit
- [ ] 3.6.5: Performance check
- [ ] 3.6.6: Final code review

**Deliverables**:
- Bug-free application
- All tests passing
- Ready for demo/deployment

---

### **Task 3.7: Local Deployment Setup** (1 day)
**Goal**: Create deployment scripts for single machine

#### Subtasks:
- [ ] 3.7.1: Create startup scripts
  - Start PostgreSQL
  - Start backend server
  - Start frontend server
  - All-in-one startup script
- [ ] 3.7.2: Create environment setup script
  - Check dependencies
  - Create .env files
  - Run migrations
  - Seed data
- [ ] 3.7.3: Test fresh installation
  - Clone repo
  - Run setup script
  - Verify everything works

**Deliverables**:
- `scripts/start.sh` (all services)
- `scripts/setup.sh` (first-time setup)
- `scripts/reset-db.sh` (reset database)
- Working single-machine deployment

---

## **Phase 3 Summary**
**Total Duration**: 1-2 weeks  
**Total Tasks**: 7 major tasks, 35+ subtasks  
**Deliverables**: Production-ready application on single machine

---

# 📊 Complete Project Timeline

| Phase | Duration | Major Tasks | Subtasks |
|-------|----------|-------------|----------|
| **Phase 1: Backend** | 2-3 weeks | 10 | 50+ |
| **Phase 2: Frontend** | 3-4 weeks | 10 | 60+ |
| **Phase 3: Integration** | 1-2 weeks | 7 | 35+ |
| **TOTAL** | **6-9 weeks** | **27** | **145+** |

---

# 🎯 Milestone Checklist

## **Week 1-2: Backend Foundation**
- [x] Database setup complete
- [x] API server running
- [x] Authentication working
- [x] Algorithm integrated

## **Week 3: Backend Completion**
- [x] Product CRUD complete
- [x] User management complete
- [ ] Mock payments implemented
- [ ] API tests passing

## **Week 4-5: Frontend Foundation**
- [ ] Project setup complete
- [ ] Auth UI working
- [ ] Buyer dashboard functional
- [ ] Map integration working

## **Week 6-7: Frontend Completion**
- [ ] Seller dashboard complete
- [ ] Profile & preferences working
- [ ] Mock payment UI complete
- [ ] Responsive design done

## **Week 8-9: Integration & Polish**
- [ ] Frontend-backend connected
- [ ] E2E tests passing
- [ ] Performance optimized
- [ ] Documentation complete
- [ ] Ready for demo

---

# 🚀 Quick Start Paths

## **Path A: Full Feature Set** (9 weeks)
All tasks above, including optional features (email verification, analytics dashboard, etc.)

## **Path B: MVP** (6 weeks)
Skip optional features:
- ❌ Email verification
- ❌ Analytics dashboard
- ❌ Advanced seller analytics
- ❌ Profile pictures
- ✅ Core search algorithm
- ✅ Product management
- ✅ Mock payments
- ✅ Basic UI

## **Path C: Demo-Only** (4 weeks)
Bare minimum for demonstration:
- ✅ Algorithm integration (backend)
- ✅ Search interface (frontend)
- ✅ Product display
- ✅ Map visualization
- ❌ Authentication (hardcoded test users)
- ❌ Product CRUD (use seed data)
- ❌ Payments
- ❌ User profiles

