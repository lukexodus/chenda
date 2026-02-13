# Chenda Project: Algorithm → Full-Stack Web Application

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

### **Task 1.9: API Testing** (2 days)
**Goal**: Comprehensive API endpoint testing

#### Subtasks:
- [ ] 1.9.1: Set up test environment
  - Create test database
  - Configure test environment variables
- [ ] 1.9.2: Write integration tests
  - Test auth flow (register, login, logout)
  - Test product CRUD
  - Test search algorithm endpoint
  - Test user preferences update
  - Test mock payment flow
- [ ] 1.9.3: Test error handling
  - Invalid inputs
  - Unauthorized access
  - Database errors
- [ ] 1.9.4: Performance testing
  - Search with 100 products
  - Concurrent request handling

**Deliverables**:
- `tests/api/` directory with test files
- All API tests passing
- Performance benchmarks documented

**Tools**: Jest, Supertest, pg (for test database)

---

### **Task 1.10: API Documentation** (1 day)
**Goal**: Document all API endpoints

#### Subtasks:
- [ ] 1.10.1: Create API documentation
  - List all endpoints
  - Request/response examples
  - Error codes
- [ ] 1.10.2: Add Postman collection (optional)
- [ ] 1.10.3: Create developer README

**Deliverables**:
- `API_DOCUMENTATION.md`
- Postman collection (optional)
- Clear usage examples

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
- [ ] 2.1.1: Create Next.js app
  ```bash
  npx create-next-app@latest chenda-frontend
  ```
- [ ] 2.1.2: Install dependencies
  - Tailwind CSS + shadcn/ui
  - Leaflet.js (maps)
  - Axios (API calls)
  - React Hook Form (forms)
  - Zustand or Context API (state management)
- [ ] 2.1.3: Set up project structure
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
- [ ] 2.1.4: Configure Tailwind CSS
- [ ] 2.1.5: Set up environment variables (.env.local)

**Deliverables**:
- Working Next.js app on `http://localhost:3000`
- Project structure established
- Styling system configured

**Tools**: Next.js 14, Tailwind CSS, shadcn/ui

---

### **Task 2.2: Authentication UI** (2-3 days)
**Goal**: Login, registration, and session management

#### Subtasks:
- [ ] 2.2.1: Create login page
  - Email + password form
  - Form validation (React Hook Form)
  - "Remember me" checkbox
  - Link to register
- [ ] 2.2.2: Create registration page
  - Email, password, name, user type (buyer/seller/both)
  - Password confirmation
  - Terms & conditions checkbox
  - **Optional**: Email verification notice
- [ ] 2.2.3: Implement auth state management
  - Store user session (JWT or session cookie)
  - Create auth context/store
  - Protected route wrapper
- [ ] 2.2.4: Create logout functionality
- [ ] 2.2.5: Add loading states and error handling
- [ ] 2.2.6: **Optional**: Email verification page
  - Token verification UI
  - Success/error messages

**Deliverables**:
- `app/(auth)/login/page.js`
- `app/(auth)/register/page.js`
- `components/auth/LoginForm.jsx`
- `components/auth/RegisterForm.jsx`
- `lib/authContext.js` (or Zustand store)
- Working authentication flow

**Tools**: React Hook Form, Zod (validation), Axios

---

### **Task 2.3: Buyer Dashboard** (3-4 days)
**Goal**: Main interface for buyers to search products

#### Subtasks:
- [ ] 2.3.1: Create buyer layout
  - Navigation bar (home, search, orders, profile)
  - User dropdown menu
  - Responsive design
- [ ] 2.3.2: Create search interface
  - Location input (address search with Nominatim)
  - Weight sliders (proximity vs freshness)
  - Max radius selector (10-100km)
  - Min freshness threshold (0-100%)
  - Search button
- [ ] 2.3.3: Create product results display
  - Product cards with image, name, price, freshness, distance
  - Freshness indicator (progress bar or badge)
  - Distance indicator
  - Combined score display
  - Rank badge (#1, #2, etc.)
- [ ] 2.3.4: Create product detail modal
  - Full product information
  - Seller information
  - Expiration date
  - Location on map (Leaflet.js)
  - "Add to Cart" button (mock)
- [ ] 2.3.5: Add sorting options
  - Toggle between ranking/filter mode
  - Sort by: score, price, distance, freshness
- [ ] 2.3.6: Add loading states and empty states

**Deliverables**:
- `app/(buyer)/dashboard/page.js`
- `components/buyer/SearchForm.jsx`
- `components/products/ProductCard.jsx`
- `components/products/ProductDetail.jsx`
- Working buyer search interface

**Tools**: React, Tailwind CSS, shadcn/ui components

---

### **Task 2.4: Map Integration** (2-3 days)
**Goal**: Visual map display of products

#### Subtasks:
- [ ] 2.4.1: Set up Leaflet.js
  - Install and configure
  - Create map component
  - Use OpenStreetMap tiles
- [ ] 2.4.2: Create map view for search results
  - Show buyer location (blue marker)
  - Show product locations (custom markers)
  - Color-code by freshness (green=fresh, yellow=ok, red=expiring)
  - Draw radius circle (visual max_radius)
- [ ] 2.4.3: Add map interactivity
  - Click marker to open product popup
  - Hover to highlight product card
  - Sync map with product list
- [ ] 2.4.4: Create address autocomplete
  - Integrate Nominatim search
  - Dropdown suggestions
  - Click to set location
- [ ] 2.4.5: Add geolocation button
  - "Use my current location"
  - Browser geolocation API
  - Update map center

**Deliverables**:
- `components/maps/ProductMap.jsx`
- `components/maps/AddressSearch.jsx`
- `components/maps/GeolocationButton.jsx`
- Interactive map working

**Tools**: Leaflet.js, React-Leaflet, Nominatim API

---

### **Task 2.5: Seller Dashboard** (3-4 days)
**Goal**: Product management for sellers

#### Subtasks:
- [ ] 2.5.1: Create seller layout
  - Navigation: products, add product, orders, analytics
  - Seller-specific menu items
- [ ] 2.5.2: Create product list page
  - Table/grid of seller's products
  - Show: name, price, freshness, days left
  - Actions: edit, delete
  - Freshness warnings (expiring soon)
- [ ] 2.5.3: Create "Add Product" form
  - Product type selector (180 USDA types with search)
  - Price input
  - Quantity + unit
  - Days already used
  - Image upload (with preview)
  - Location (auto-fill from seller profile)
  - Description textarea
  - Submit button
- [ ] 2.5.4: Create "Edit Product" form
  - Pre-filled with existing data
  - Same fields as add form
  - Update functionality
- [ ] 2.5.5: Add product deletion
  - Confirmation dialog
  - Delete API call
- [ ] 2.5.6: Create seller analytics view
  - Average product freshness
  - Total active listings
  - Products expiring within 3 days
  - Most popular product types

**Deliverables**:
- `app/(seller)/products/page.js`
- `app/(seller)/products/add/page.js`
- `app/(seller)/products/[id]/edit/page.js`
- `components/seller/ProductForm.jsx`
- `components/seller/ProductTable.jsx`
- `components/seller/SellerAnalytics.jsx`
- Working seller product management

**Tools**: React Hook Form, shadcn/ui form components, Multer (file upload)

---

### **Task 2.6: User Profile & Preferences** (2 days)
**Goal**: User settings and algorithm preferences

#### Subtasks:
- [ ] 2.6.1: Create profile page
  - Name, email (read-only)
  - User type (buyer/seller/both)
  - Profile picture upload (optional)
  - Save changes button
- [ ] 2.6.2: Create location settings
  - Current address display
  - Address search (Nominatim)
  - Map to confirm location
  - Save location button
- [ ] 2.6.3: Create algorithm preferences (buyers)
  - Weight preset selector (balanced, proximity, freshness)
  - Custom weight sliders
  - Default max radius
  - Default min freshness
  - Display mode preference (ranking/filter)
  - Save preferences button
- [ ] 2.6.4: Add storage condition preference
  - Pantry, Refrigerated, Frozen
  - Filter products by storage match
- [ ] 2.6.5: Create password change form
  - Current password
  - New password + confirmation
  - Update password

**Deliverables**:
- `app/(buyer)/profile/page.js`
- `app/(seller)/profile/page.js`
- `components/profile/ProfileForm.jsx`
- `components/profile/LocationSettings.jsx`
- `components/profile/AlgorithmPreferences.jsx`
- Working profile management

**Tools**: React Hook Form, Leaflet.js (location picker)

---

### **Task 2.7: Mock Payment UI** (1-2 days)
**Goal**: Checkout flow with mock payment

#### Subtasks:
- [ ] 2.7.1: Create shopping cart (simple)
  - Add products to cart (in-memory or localStorage)
  - Display cart items
  - Remove from cart
  - Calculate total
- [ ] 2.7.2: Create checkout page
  - Cart summary
  - Delivery address confirmation
  - Payment method selector (Cash/GCash/Card - all mock)
  - Place order button
- [ ] 2.7.3: Create payment modal
  - Show selected payment method
  - "Processing payment..." animation
  - Mock 2-second delay
  - Success/failure message
- [ ] 2.7.4: Create order confirmation page
  - Order ID
  - Mock transaction ID
  - Order items
  - Total amount
  - Payment method
  - "Back to Dashboard" button
- [ ] 2.7.5: Add prominent mock disclaimer
  - Banner: "⚠️ This is a mock payment system"
  - Explain no real transactions occur

**Deliverables**:
- `app/(buyer)/cart/page.js`
- `app/(buyer)/checkout/page.js`
- `app/(buyer)/orders/[id]/page.js`
- `components/payment/PaymentModal.jsx`
- `components/cart/CartSummary.jsx`
- Mock payment flow working

**Tools**: React, localStorage (cart state)

---

### **Task 2.8: Orders & History** (2 days)
**Goal**: View order history (buyers and sellers)

#### Subtasks:
- [ ] 2.8.1: Create buyer orders page
  - List all orders (newest first)
  - Show: order date, items, total, status
  - Click to view details
- [ ] 2.8.2: Create seller orders page
  - List orders for seller's products
  - Show: buyer info, items, total, status
  - Mark as "completed" (mock)
- [ ] 2.8.3: Create order detail view
  - Full order information
  - Product details
  - Payment info (mock)
  - Status timeline
- [ ] 2.8.4: Add order filters
  - Status: all, pending, paid, completed
  - Date range picker

**Deliverables**:
- `app/(buyer)/orders/page.js`
- `app/(seller)/orders/page.js`
- `components/orders/OrderCard.jsx`
- `components/orders/OrderDetail.jsx`
- Working order views

**Tools**: React, date-fns (date formatting)

---

### **Task 2.9: Responsive Design & Polish** (2-3 days)
**Goal**: Ensure mobile-friendly UI and polish

#### Subtasks:
- [ ] 2.9.1: Test on mobile devices
  - iPhone (Safari)
  - Android (Chrome)
  - Tablet sizes
- [ ] 2.9.2: Fix responsive issues
  - Navigation menu (hamburger on mobile)
  - Product cards (stack on mobile)
  - Forms (full-width on mobile)
  - Map (adjust height on mobile)
- [ ] 2.9.3: Add loading skeletons
  - Product cards skeleton
  - Form skeleton
  - Map skeleton
- [ ] 2.9.4: Add empty states
  - No products found
  - No orders yet
  - Empty cart
- [ ] 2.9.5: Add success/error toasts
  - Product added notification
  - Profile saved
  - Order placed
  - Error messages
- [ ] 2.9.6: Accessibility improvements
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
- [ ] 2.10.1: Set up testing environment
  - Jest + React Testing Library
  - Mock API responses
- [ ] 2.10.2: Write component tests
  - Auth forms
  - Product cards
  - Search form
  - Profile forms
- [ ] 2.10.3: Write integration tests
  - Login → Search → View Product flow
  - Register → Complete Profile flow
  - Seller: Add Product flow
- [ ] 2.10.4: Test error states
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
- [ ] 3.1.1: Configure API client
  - Set backend URL in environment variables
  - Add authentication headers
  - Handle token refresh (if using JWT)
- [ ] 3.1.2: Test all API endpoints from frontend
  - Auth flow
  - Product search
  - Product CRUD
  - User profile updates
  - Mock payments
- [ ] 3.1.3: Fix CORS issues (if any)
- [ ] 3.1.4: Add request/response interceptors
  - Error handling
  - Loading states
  - Token management
- [ ] 3.1.5: Test error scenarios
  - Network failures
  - API errors (4xx, 5xx)
  - Validation errors

**Deliverables**:
- Frontend successfully communicating with backend
- All features working end-to-end

**Tools**: Axios interceptors, error boundaries

---

### **Task 3.2: End-to-End Testing** (2 days)
**Goal**: Test complete user journeys

#### Subtasks:
- [ ] 3.2.1: Set up E2E testing framework (Playwright)
- [ ] 3.2.2: Write E2E tests
  - **Buyer journey**: Register → Search → View Product → Checkout
  - **Seller journey**: Register → Add Product → View Orders
  - **Auth flow**: Login → Logout → Login again
- [ ] 3.2.3: Test cross-browser
  - Chrome
  - Firefox
  - Safari (if available)
- [ ] 3.2.4: Fix bugs discovered during E2E testing

**Deliverables**:
- `e2e/` directory with test files
- All E2E tests passing

**Tools**: Playwright

---

### **Task 3.3: Performance Optimization** (2 days)
**Goal**: Optimize for production

#### Subtasks:
- [ ] 3.3.1: Frontend optimization
  - Image optimization (next/image)
  - Code splitting
  - Lazy loading components
  - Minimize bundle size
- [ ] 3.3.2: Backend optimization
  - Database query optimization (EXPLAIN ANALYZE)
  - Add database indexes where needed
  - Connection pooling
  - Response compression (gzip)
- [ ] 3.3.3: API response caching
  - Cache product types (rarely change)
  - Cache geocoding results
  - Cache user preferences
- [ ] 3.3.4: Load testing
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
- [ ] 3.4.1: Backend security
  - Rate limiting (express-rate-limit)
  - Helmet.js (security headers)
  - Input sanitization
  - SQL injection prevention (parameterized queries)
  - XSS prevention
- [ ] 3.4.2: Frontend security
  - Sanitize user inputs
  - HTTPS enforcement (if deploying)
  - Secure cookie settings
- [ ] 3.4.3: Authentication security
  - Password complexity requirements
  - Session timeout
  - CSRF protection (if needed)

**Deliverables**:
- Security measures implemented
- No critical vulnerabilities

**Tools**: Helmet.js, express-rate-limit, validator.js

---

### **Task 3.5: Documentation** (1-2 days)
**Goal**: Complete project documentation

#### Subtasks:
- [ ] 3.5.1: Create user documentation
  - How to register/login
  - How to search for products (buyer)
  - How to list products (seller)
  - How to adjust preferences
- [ ] 3.5.2: Create developer documentation
  - Project setup instructions
  - Environment variables guide
  - Database setup guide
  - Running tests
- [ ] 3.5.3: Create deployment guide
  - Local deployment steps
  - Environment configuration
  - Database migrations
- [ ] 3.5.4: Update README
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

