# How to Troubleshoot the Chenda App — The Agent's Playbook

This guide explains the exact methods, commands, and mental model used when diagnosing and fixing bugs or building new features in this project. Think of it as the step-by-step playbook an agent runs through every time something is broken or needs to be built.

The scope covers every layer of the stack:  
**Database → Backend server → API → Frontend → End-to-end**

---

## Table of Contents

1. [The Core Mental Model](#1-the-core-mental-model)
2. [Layer 1 — Database (PostgreSQL + PostGIS)](#2-layer-1--database-postgresql--postgis)
3. [Layer 2 — Backend Server (Node/Express)](#3-layer-2--backend-server-nodeexpress)
4. [Layer 3 — API Endpoints (curl)](#4-layer-3--api-endpoints-curl)
5. [Layer 4 — Frontend (Next.js)](#5-layer-4--frontend-nextjs)
6. [Layer 5 — End-to-End (Playwright)](#6-layer-5--end-to-end-playwright)
7. [Using the Diagnostic Scripts in This Repo](#7-using-the-diagnostic-scripts-in-this-repo)
8. [Reading Logs](#8-reading-logs)
9. [Inspecting Code with grep and find](#9-inspecting-code-with-grep-and-find)
10. [Migrations and Seeds](#10-migrations-and-seeds)
11. [Writing a One-Off Script to Verify a Fix](#11-writing-a-one-off-script-to-verify-a-fix)
12. [Common Failure Patterns and Their Diagnosis](#12-common-failure-patterns-and-their-diagnosis)
13. [Reference — All Commands on One Page](#13-reference--all-commands-on-one-page)

---

## 1. The Core Mental Model

Before running any command, the agent decides **where in the stack the problem lives**. The stack is a chain of layers; a problem in one layer looks like a problem in the layer above it.

```
Browser / Next.js frontend
        ↓ HTTP request
Express backend (app.js → routes → controller → service)
        ↓ SQL query
PostgreSQL + PostGIS
```

**First question every time**: *Is the database reachable?* If not, everything above it is broken regardless of code.

**Second question**: *Is the backend server running and healthy?* Check `/api/health` before reading any controller code.

**Third question**: *Does the specific API endpoint return the right data?* Test it with `curl` in isolation before touching the frontend.

**Fourth question**: *Does the frontend correctly call the API and render the response?*

Work from the bottom up. This avoids chasing a frontend bug that is actually a database issue.

---

## 2. Layer 1 — Database (PostgreSQL + PostGIS)

### 2.1 Connect to the database

```bash
# Connect to the chenda database as the postgres user
psql -U postgres -d chenda

# If you need a password prompt
psql -U postgres -W -d chenda

# Connect to the test database
psql -U postgres -d chenda_test
```

Once inside `psql`, you are at the `chenda=#` prompt. Everything below with `chenda=#` is typed there.

---

### 2.2 Orientation — what tables exist?

```sql
-- List all tables
\dt

-- List all tables with their sizes
\dt+

-- Describe a specific table's columns and constraints
\d users
\d products
\d product_types
\d orders
```

This is always the first step when you do not know whether a migration ran or a column exists.

---

### 2.3 Count rows — is there any data?

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM product_types;
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM analytics_events;
```

If a table has 0 rows when it should not, seeds were not run.

---

### 2.4 Spot-check real data

```sql
-- Look at the first 5 users
SELECT id, name, email, type, email_verified FROM users LIMIT 5;

-- Look at active products with their type name
SELECT p.id, pt.name, p.price, p.status, p.days_already_used
FROM products p
JOIN product_types pt ON p.product_type_id = pt.id
WHERE p.status = 'active'
LIMIT 10;

-- Look at a specific user by email
SELECT * FROM users WHERE email = 'maria.santos@email.com';

-- Look at orders for a specific buyer
SELECT * FROM orders WHERE buyer_id = 1;
```

---

### 2.5 Inspect PostGIS location data

Location columns are `GEOMETRY(Point, 4326)`. They are not plain numbers — you need PostGIS functions to read them.

```sql
-- Extract lat/lng from user location
SELECT id, name,
  ST_X(location::geometry) AS lng,
  ST_Y(location::geometry) AS lat
FROM users
WHERE location IS NOT NULL;

-- Check which users have NO location set
SELECT id, name, email FROM users WHERE location IS NULL;

-- Check which products have a location
SELECT id, ST_X(location::geometry) AS lng, ST_Y(location::geometry) AS lat
FROM products
WHERE location IS NOT NULL
LIMIT 5;
```

If a user or product has `NULL` location, the algorithm cannot use them — that is the first place to look when search returns empty results.

---

### 2.6 Test the radius search function

The core algorithm depends on `ST_DWithin`. You can test it directly:

```sql
-- Find all products within 10 km of Manila city center (14.5995, 120.9842)
SELECT product_id, ROUND(distance_km::numeric, 2) AS distance_km
FROM get_products_within_radius(14.5995, 120.9842, 10);

-- Manual ST_DWithin query (same logic the function uses)
SELECT p.id, pt.name,
  ST_Distance(
    p.location::geography,
    ST_SetSRID(ST_MakePoint(120.9842, 14.5995), 4326)::geography
  ) / 1000 AS distance_km
FROM products p
JOIN product_types pt ON p.product_type_id = pt.id
WHERE p.status = 'active'
  AND ST_DWithin(
    p.location::geography,
    ST_SetSRID(ST_MakePoint(120.9842, 14.5995), 4326)::geography,
    10000  -- 10 km in meters
  )
ORDER BY distance_km;
```

If this returns 0 rows, either no products are in range **or** product locations are `NULL`.

---

### 2.7 Inspect indexes

```sql
-- List all indexes on a table
\di products
\di users

-- Check if the spatial index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'products' AND indexname LIKE '%location%';
```

A missing spatial index causes `ST_DWithin` to be very slow on large datasets.

---

### 2.8 Check whether migrations ran

```sql
-- See which migration files have been applied and when
SELECT filename, applied_at FROM migrations ORDER BY applied_at;
```

If a migration file is missing from this table, its tables and indexes do not exist yet.

---

### 2.9 Check PostGIS is installed

```sql
SELECT PostGIS_version();
```

If this throws an error, PostGIS is not enabled. Fix it with:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

---

### 2.10 Quick freshness math check

```sql
-- Reproduce the freshness % formula for a product
SELECT
  pt.default_shelf_life_days,
  p.days_already_used,
  ROUND(
    ((pt.default_shelf_life_days - p.days_already_used)::numeric
     / pt.default_shelf_life_days) * 100, 1
  ) AS freshness_pct,
  p.listed_date + ((pt.default_shelf_life_days - p.days_already_used) || ' days')::interval AS expires_at
FROM products p
JOIN product_types pt ON p.product_type_id = pt.id
WHERE p.id = 1;
```

---

### 2.11 Exit psql

```
\q
```

---

## 3. Layer 2 — Backend Server (Node/Express)

### 3.1 Start the server

```bash
cd server
npm start        # production mode
npm run dev      # nodemon watch mode (auto-restarts on file changes)
```

Logs appear immediately. Look for:
- `✓ Database connection successful` — DB is reachable
- `✓ Server running on port 3001` — server is up
- Any red `❌` line — something failed to initialize

---

### 3.2 Check the health endpoint

This is the fastest sanity check. While the server is running, in another terminal:

```bash
curl http://localhost:3001/api/health
```

A healthy response looks like:

```json
{
  "success": true,
  "message": "Server is running",
  "database": { "connected": true, "version": "PostgreSQL 15.x" }
}
```

If `"connected": false` or the request times out, the database is the problem.

---

### 3.3 Check what environment variables are loaded

```bash
cd server
node -e "require('dotenv').config(); console.log(JSON.stringify(process.env, null, 2))" | grep -E "DB_|SESSION_|PORT|NODE_ENV|FRONTEND"
```

This shows exactly what values the server will use. Common mistake: `DB_PASSWORD` is empty when it should not be.

---

### 3.4 Check the .env file directly

```bash
cat server/.env
```

Compare it to `server/.env.example` to see if any required variables are missing.

---

### 3.5 Load the app without starting the server (diagnose.js)

This is useful when the server crashes on startup and you cannot see the error clearly in watch mode:

```bash
cd server
node diagnose.js
```

It tries to `require('./app')` and prints exactly why it fails if it does.

---

### 3.6 Verify the database module alone

```bash
cd server
node -e "require('./config/database').testConnection().then(ok => process.exit(ok ? 0 : 1))"
```

Exit code 0 = database OK. Exit code 1 = connection failed.

---

### 3.7 Check package.json scripts

```bash
cat server/package.json | grep -A 10 '"scripts"'
```

Shows all available npm commands for the backend.

---

### 3.8 Check if port 3001 is already in use

```bash
lsof -i :3001
# or
ss -tlnp | grep 3001
# or
fuser 3001/tcp
```

If occupied, kill the process or change `PORT` in `.env`.

---

### 3.9 Check if port 3000 is already in use (frontend)

```bash
lsof -i :3000
```

---

## 4. Layer 3 — API Endpoints (curl)

`curl` is the agent's primary tool for testing API endpoints in isolation — without the frontend, without a browser.

### 4.1 Public endpoints (no login needed)

```bash
# Health check
curl http://localhost:3001/api/health

# Get all product types (reference data)
curl http://localhost:3001/api/product-types | head -100

# Get specific product type by ID
curl http://localhost:3001/api/product-types/1

# Get payment methods
curl http://localhost:3001/api/orders/payment-methods
```

---

### 4.2 Login and save session cookie

Almost everything requires authentication. Save the cookie to a file and reuse it:

```bash
# Login and save session cookie to /tmp/chenda_cookies.txt
curl -s -c /tmp/chenda_cookies.txt \
  -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria.santos@email.com","password":"password123"}'
```

Now use `-b /tmp/chenda_cookies.txt` on every subsequent request.

---

### 4.3 Test authenticated endpoints

```bash
# Get your profile (must be logged in)
curl -b /tmp/chenda_cookies.txt http://localhost:3001/api/users/profile

# Get your preferences
curl -b /tmp/chenda_cookies.txt http://localhost:3001/api/users/preferences

# Search products (buyer)
curl -b /tmp/chenda_cookies.txt \
  "http://localhost:3001/api/search?lat=14.5995&lng=120.9842&radius=10&proximity_weight=0.6&freshness_weight=0.4"

# List seller's own products
curl -b /tmp/chenda_cookies.txt http://localhost:3001/api/products/my-products
```

---

### 4.4 POST requests with JSON body

```bash
# Register a new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "type": "buyer"
  }'

# Create a product (seller must be logged in)
curl -b /tmp/chenda_cookies.txt \
  -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "product_type_id": 1,
    "price": 50.00,
    "quantity": 10,
    "unit": "kg",
    "days_already_used": 2,
    "lat": 14.5995,
    "lng": 120.9842,
    "storage_condition": "refrigerated"
  }'

# Place an order (buyer must be logged in)
curl -b /tmp/chenda_cookies.txt \
  -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "quantity": 2,
    "payment_method": "cash"
  }'
```

---

### 4.5 PUT requests (update)

```bash
# Update user profile
curl -b /tmp/chenda_cookies.txt \
  -X PUT http://localhost:3001/api/users/profile \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'

# Update user preferences
curl -b /tmp/chenda_cookies.txt \
  -X PUT http://localhost:3001/api/users/preferences \
  -H "Content-Type: application/json" \
  -d '{"proximity_weight":60,"freshness_weight":40}'

# Update user location (raw coordinates)
curl -b /tmp/chenda_cookies.txt \
  -X PUT http://localhost:3001/api/users/location \
  -H "Content-Type: application/json" \
  -d '{"lat":14.5995,"lng":120.9842}'
```

---

### 4.6 DELETE requests

```bash
# Delete a product (seller)
curl -b /tmp/chenda_cookies.txt \
  -X DELETE http://localhost:3001/api/products/1
```

---

### 4.7 See full HTTP response including headers

```bash
# -v = verbose: shows request headers, response headers, status code, body
curl -v -b /tmp/chenda_cookies.txt http://localhost:3001/api/users/profile

# -w = write-out: show just the status code
curl -o /dev/null -w "%{http_code}" http://localhost:3001/api/health
```

The HTTP status code tells the story:
- `200` — success
- `400` — bad request (validation error — check the error message)
- `401` — not logged in
- `403` — logged in but not allowed (wrong role)
- `404` — route does not exist
- `409` — conflict (e.g. email already taken)
- `500` — server crashed — read server logs immediately

---

### 4.8 Pretty-print JSON with jq

```bash
# Install once
sudo apt install jq

# Use it
curl -s http://localhost:3001/api/health | jq .
curl -s -b /tmp/chenda_cookies.txt http://localhost:3001/api/users/profile | jq '.data.preferences'
```

---

### 4.9 Logout

```bash
curl -b /tmp/chenda_cookies.txt \
  -X POST http://localhost:3001/api/auth/logout
rm /tmp/chenda_cookies.txt
```

---

## 5. Layer 4 — Frontend (Next.js)

### 5.1 Start the dev server

```bash
cd chenda-frontend
npm run dev
```

Runs on `http://localhost:3000`. Shows compile errors and route requests in the terminal as they happen.

---

### 5.2 Check the .env.local file

```bash
cat chenda-frontend/.env.local
```

The most common frontend bug: `NEXT_PUBLIC_API_URL` is wrong or missing, so all API calls fail silently.

Required values:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_PREFIX=/api
```

---

### 5.3 Run the TypeScript compiler to check for type errors

```bash
cd chenda-frontend
npx tsc --noEmit
```

Shows all type errors without building. Useful when a build or compile error appears in the dev server logs.

---

### 5.4 Run the linter

```bash
cd chenda-frontend
npm run lint
```

---

### 5.5 Check browser network tab

In your browser (Chrome/Firefox), open **DevTools → Network tab**, then reload the problem page.

Look for:
- Red requests — these failed
- Click a failing request → **Response** tab — shows the exact error from the server
- The **Request Headers** → confirm `Cookie: chenda.sid=...` is present (auth check)
- The **Request URL** — confirm it actually hits `localhost:3001`, not some other host

---

### 5.6 Check browser console

**DevTools → Console tab**

- Red errors = JavaScript exceptions in the frontend code
- `CORS policy` errors = backend `FRONTEND_URL` does not match the origin
- `Failed to fetch` errors = backend is not running or wrong port

---

### 5.7 Check a Next.js API route vs backend route

Next.js does not have its own API routes in this project — all API calls go to `localhost:3001`. If a frontend page is broken, the first check is:

```bash
# What does the API actually return for this page's data?
curl -s -b /tmp/chenda_cookies.txt "http://localhost:3001/api/search?lat=14.5995&lng=120.9842&radius=10" | jq .
```

If the API returns correct data but the page is broken, the problem is in the frontend component.

---

## 6. Layer 5 — End-to-End (Playwright)

### 6.1 Run all E2E tests

```bash
# From the project root
npx playwright test
```

---

### 6.2 Run a specific test file

```bash
npx playwright test e2e/auth-flow.spec.ts
npx playwright test e2e/buyer-journey.spec.ts
npx playwright test e2e/seller-journey.spec.ts
```

---

### 6.3 Run tests with a visible browser (headed mode)

```bash
npx playwright test --headed
```

You can watch the browser click through the test steps. Useful when a test fails and you cannot tell why from the log alone.

---

### 6.4 Run tests in UI mode (interactive)

```bash
npx playwright test --ui
```

Opens the Playwright test runner GUI — you can click on any test to run it and see a step-by-step trace.

---

### 6.5 See a test failure report

```bash
npx playwright show-report
```

Opens the HTML report in a browser showing screenshots, videos, and traces of every failed test.

---

## 7. Using the Diagnostic Scripts in This Repo

These scripts already exist and are designed to be run directly.

### 7.1 `server/diagnose.js` — does the app load without crashing?

```bash
cd server
node diagnose.js
```

Loads `app.js` in test mode. Prints `✅ App loaded OK` or the exact line of the crash.

---

### 7.2 `server/smoke.js` — does the health endpoint respond?

```bash
cd server
node smoke.js
```

Starts a temporary server on a random port, hits `/api/health`, prints the status code and body, then shuts down. Run this when you cannot tell whether the server itself is broken or just the database.

---

### 7.3 `server/check-coords.js` — are location coordinates stored correctly?

```bash
cd server
node check-coords.js
```

Queries sellers, buyers, and specific products and dumps their `lat/lng` extracted from PostGIS. Run this when the search algorithm returns 0 results — the problem is often that locations are `NULL`.

---

### 7.4 `server/quick-test.sh` — smoke test all user management endpoints

```bash
cd server
bash quick-test.sh
```

Logs in, calls profile, preferences, location, geocode, and reverse-geocode endpoints. Each prints `✅` or `❌`. Use this after changing a user-related controller to make sure nothing broke.

---

### 7.5 `server/test-user-api.sh` — detail test of user API

```bash
cd server
bash test-user-api.sh
```

More verbose version of the above. Shows the actual JSON response for each step.

---

### 7.6 `server/test-order-api.sh` — test the order workflow

```bash
cd server
bash test-order-api.sh
```

Walks through: login → get payment methods → create order → check order status → confirm order.

---

### 7.7 `migrations/test-connection.js` — test DB connectivity with a report

```bash
cd migrations
node test-connection.js
```

Runs five checks: connect, PostgreSQL version, PostGIS extension, table existence, and a spatial query. Prints a pass/fail for each.

---

## 8. Reading Logs

### 8.1 Server logs in the terminal

When the server is running with `npm run dev`, logs appear in real time. The format is:

```
[2026-03-09T12:00:00.000Z] GET /api/search 200 45ms
[2026-03-09T12:00:01.000Z] POST /api/auth/login 401 12ms
❌ Unexpected error on idle client: connection refused
```

Lines with `❌` are always worth reading in full.

---

### 8.2 Increase log verbosity temporarily

Add `console.log` statements directly in the controller or service file you are investigating:

```javascript
// In server/controllers/searchController.js
console.log('Search params:', req.query);
console.log('DB result rows:', result.rows.length);
```

Remove them when done.

---

### 8.3 Next.js compile errors

Watch the terminal where `npm run dev` is running:

```
✓ Compiled in 1082ms
⚠ Warning: ...
✗ Error: Cannot find module './ProductCard'
```

Red lines with `✗` mean the page will not render until fixed.

---

### 8.4 PostgreSQL server logs

```bash
# Ubuntu/Debian — tail the Postgres log
sudo tail -f /var/log/postgresql/postgresql-*.log

# Or check systemd journal
sudo journalctl -u postgresql -f
```

Shows connection errors, failed queries, and `FATAL` errors from the database side.

---

## 9. Inspecting Code with grep and find

When you need to find where a particular piece of logic lives, use these patterns:

### 9.1 Find all files that mention a term

```bash
# Find where "freshness_weight" is used across the whole project
grep -r "freshness_weight" --include="*.js" --include="*.ts" --include="*.tsx" .

# Find where a specific route is defined in the backend
grep -r "router.get\|router.post" server/routes/

# Find where a column is used in SQL
grep -r "days_already_used" server/
```

---

### 9.2 Find a file by name

```bash
find . -name "searchController.js"
find . -name "*.env*" -not -path "*/node_modules/*"
find . -name "*.sql"
```

---

### 9.3 Look at what a route file exports

```bash
grep -n "router\." server/routes/search.js
```

Shows every `GET`, `POST`, `PUT`, `DELETE` endpoint in that file with line numbers.

---

### 9.4 Find TODO or FIXME comments

```bash
grep -rn "TODO\|FIXME\|HACK\|BUG" server/ chenda-frontend/src/ --include="*.js" --include="*.ts" --include="*.tsx"
```

---

## 10. Migrations and Seeds

### 10.1 Run all migrations (create tables)

```bash
cd migrations
node migrate.js up
```

Creates all tables defined in `001_create_tables.sql` through `004_optimize_indexes.sql`. Safe to run multiple times — it skips already-applied files.

---

### 10.2 Check migration status

```bash
cd migrations
node migrate.js status
```

Lists which files have been applied and which are pending.

---

### 10.3 Run seeds (fill tables with test data)

```bash
cd seeds
node seed.js
```

Inserts mock users, products, and product types. Only run this on a development or test database.

---

### 10.4 Seed a specific file manually with psql

```bash
psql -U postgres -d chenda -f seeds/mock_users.sql
psql -U postgres -d chenda -f seeds/mock_products.sql
psql -U postgres -d chenda -f seeds/product_types.sql
```

---

### 10.5 Reset the database completely

> **Warning**: This deletes all data. Only use on dev/test.

```bash
psql -U postgres -c "DROP DATABASE IF EXISTS chenda;"
psql -U postgres -c "CREATE DATABASE chenda;"
psql -U postgres -d chenda -c "CREATE EXTENSION postgis;"
cd migrations && node migrate.js up
cd ../seeds && node seed.js
```

---

### 10.6 Create the test database

```bash
psql -U postgres -c "CREATE DATABASE chenda_test;"
psql -U postgres -d chenda_test -c "CREATE EXTENSION postgis;"
DB_NAME=chenda_test node migrations/migrate.js up
```

---

## 11. Writing a One-Off Script to Verify a Fix

When a fix involves the database or backend logic and you want to verify it before touching the frontend, write a small Node script in the `server/` directory.

**Pattern**:

```javascript
// server/verify-my-fix.js
require('dotenv').config();
const { query } = require('./config/database');

async function main() {
  // Run the exact query your fix touches
  const result = await query(
    `SELECT id, ST_X(location::geometry) AS lng, ST_Y(location::geometry) AS lat
     FROM users WHERE id = $1`,
    [1]
  );
  console.log('Result:', JSON.stringify(result.rows, null, 2));
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
```

```bash
cd server
node verify-my-fix.js
```

Delete the file when you are done. This is how `check-coords.js`, `smoke.js`, and `diagnose.js` were created.

---

## 12. Common Failure Patterns and Their Diagnosis

### "Search returns 0 results"

1. Check that the buyer has a location set:
   ```sql
   SELECT id, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat FROM users WHERE id = YOUR_USER_ID;
   ```
2. Check that active products are within the radius:
   ```sql
   SELECT COUNT(*) FROM get_products_within_radius(BUYER_LAT, BUYER_LNG, RADIUS_KM);
   ```
3. Check that products have a location:
   ```sql
   SELECT COUNT(*) FROM products WHERE location IS NULL AND status = 'active';
   ```
4. Check the spatial index exists:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'products' AND indexname LIKE '%location%';
   ```

---

### "Login returns 401"

1. Check the user exists:
   ```sql
   SELECT id, email, password_hash FROM users WHERE email = 'their@email.com';
   ```
2. Check `password_hash` is not null or empty.
3. Check `email_verified` — if the feature is enabled, unverified users cannot log in.
4. Try logging in via curl to eliminate frontend issues:
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"their@email.com","password":"password123"}'
   ```

---

### "Server crashes on startup"

1. Run `node diagnose.js` — it prints the exact crash line.
2. Check `.env` exists and has `DB_PASSWORD` set.
3. Check PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```
4. Check port 3001 is free:
   ```bash
   lsof -i :3001
   ```

---

### "Image upload returns error"

1. Check the uploads directory exists and is writable:
   ```bash
   ls -la uploads/
   ```
2. Create it if missing:
   ```bash
   mkdir -p uploads/products uploads/users/avatars
   ```
3. Check `UPLOAD_DIR` in `.env`.

---

### "CORS error in browser"

Check `FRONTEND_URL` in `server/.env`:
```bash
grep FRONTEND_URL server/.env
```
It must exactly match the origin the browser is sending from (protocol + host + port).

---

### "Migration fails"

1. Check PostgreSQL is running.
2. Check `DB_NAME`, `DB_USER`, `DB_PASSWORD` in `.env`.
3. Check if PostGIS is installed:
   ```sql
   SELECT PostGIS_version();
   ```
4. Run `node migrations/test-connection.js` for a detailed connection report.

---

### "Product freshness calculation looks wrong"

Run the formula directly in the database:
```sql
SELECT
  pt.default_shelf_life_days,
  p.days_already_used,
  p.listed_date,
  ((pt.default_shelf_life_days - p.days_already_used)::float / pt.default_shelf_life_days) * 100 AS freshness_pct,
  p.listed_date + ((pt.default_shelf_life_days - p.days_already_used) || ' days')::interval AS expires_at
FROM products p
JOIN product_types pt ON p.product_type_id = pt.id
WHERE p.id = PRODUCT_ID;
```

---

## 13. Reference — All Commands on One Page

```bash
# ── POSTGRESQL ──────────────────────────────────────────────
psql -U postgres -d chenda               # connect
\dt                                       # list tables
\d products                               # describe table
\q                                        # quit

SELECT COUNT(*) FROM products;
SELECT id, name, email, type FROM users LIMIT 5;
SELECT ST_X(location::geometry) AS lng, ST_Y(location::geometry) AS lat FROM users WHERE id = 1;
SELECT * FROM migrations ORDER BY applied_at;
SELECT PostGIS_version();

# ── SERVER ──────────────────────────────────────────────────
cd server
npm run dev                               # start with auto-restart
node diagnose.js                          # test app loads
node smoke.js                             # test health endpoint
node check-coords.js                      # inspect coordinates
bash quick-test.sh                        # smoke test user API
bash test-user-api.sh                     # detail test user API
bash test-order-api.sh                    # test order workflow
lsof -i :3001                             # is the port in use?
cat .env                                  # check env vars

# ── API (CURL) ───────────────────────────────────────────────
curl http://localhost:3001/api/health
curl -c /tmp/cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria.santos@email.com","password":"password123"}'
curl -b /tmp/cookies.txt http://localhost:3001/api/users/profile
curl -b /tmp/cookies.txt "http://localhost:3001/api/search?lat=14.5995&lng=120.9842&radius=10"
curl -v -b /tmp/cookies.txt http://localhost:3001/api/products/my-products

# ── FRONTEND ────────────────────────────────────────────────
cd chenda-frontend
npm run dev                               # start dev server (:3000)
npx tsc --noEmit                          # check TypeScript errors
npm run lint                              # check lint errors
cat .env.local                            # check env vars

# ── E2E TESTS ───────────────────────────────────────────────
npx playwright test                       # run all tests
npx playwright test e2e/auth-flow.spec.ts # run one file
npx playwright test --headed              # with visible browser
npx playwright test --ui                  # interactive UI
npx playwright show-report                # view failure report

# ── MIGRATIONS & SEEDS ──────────────────────────────────────
cd migrations && node migrate.js up       # apply all migrations
cd migrations && node migrate.js status   # check what ran
cd seeds && node seed.js                  # seed mock data
psql -U postgres -d chenda -f seeds/mock_users.sql

# ── GREP & FIND ─────────────────────────────────────────────
grep -r "freshness_weight" --include="*.js" .
grep -rn "router\." server/routes/search.js
find . -name "searchController.js"
find . -name "*.env*" -not -path "*/node_modules/*"
```
