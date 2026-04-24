# Database Migrations

This directory contains all database migration files for the Chenda project.

## Overview

The database uses **PostgreSQL 16** with **PostGIS 3.6** for geospatial functionality.

## Quick Start

```bash
# Run all pending migrations (safe to run multiple times)
docker compose run --rm backend node migrations/migrate.js up

# Check which migrations have been applied
docker compose run --rm backend node migrations/migrate.js status
```

## Why migration tracking matters

Running migrations without tracking is fragile:

| Risk | What happens | With tracking |
|---|---|---|
| **Partial migrations** | If a migration fails halfway, schema is inconsistent | Transactions + rollback keep schema consistent |
| **Duplicate runs** | Rerunning migrations causes errors (table already exists, trigger exists, etc.) | Migrations table prevents reruns |
| **Environment drift** | Local DB differs from prod (local "accidentally" has new columns) | Audit trail shows exactly what's deployed where |
| **Silent failures** | `CREATE TABLE IF NOT EXISTS` hides real problems | Explicit tracking catches issues |

## How the migration runner works

1. **Tracking table**: Creates `migrations` table (if needed) to record which files have been applied
2. **Pending detection**: Compares files on disk against the `migrations` table
3. **Ordered execution**: Runs pending migrations in filename order (001, 002, 003, etc.)
4. **Transactional safety**: Wraps each migration in `BEGIN...COMMIT/ROLLBACK`
5. **Audit log**: Records filename and timestamp for every applied migration

## Usage

### Run all pending migrations
```bash
node migrate.js up
```

### Check migration status
```bash
node migrate.js status
```

### Rollback last migration
```bash
node migrate.js rollback
```

## Database Schema

### Core Tables

#### 1. **users**
- User authentication and profile data
- Location stored as PostGIS POINT geometry
- Preferences stored as JSONB (weights, radius, display mode)
- Supports buyer, seller, or both types

#### 2. **product_types**
- USDA FoodKeeper product catalog (180 items)
- Default shelf life and storage conditions
- Keywords for search functionality

#### 3. **products**
- Products listed by sellers
- Location stored as PostGIS POINT geometry
- Tracks days_already_used for shelf life calculation
- Status: active, sold, expired, removed

#### 4. **orders**
- Purchase transactions
- Mock payment system (cash, gcash, card)
- Links buyers, sellers, and products

#### 5. **analytics_events**
- Algorithm usage tracking
- Event properties stored as JSONB
- Session and user tracking

### Spatial Indexes

All location columns use **GIST spatial indexes** for efficient distance queries:
- `idx_users_location` - User locations
- `idx_products_location` - Product locations
- `idx_products_active_location_gist` - Partial index for active products

### Helper Functions

#### Distance Calculation
```sql
SELECT calculate_distance_km(14.5995, 120.9842, 14.5547, 121.0244);
-- Returns: ~15.2 km
```

#### Products Within Radius
```sql
SELECT * FROM get_products_within_radius(14.5995, 120.9842, 50);
-- Returns all active products within 50km
```

#### Shelf Life Calculations
```sql
-- Calculate remaining shelf life percentage
SELECT calculate_shelf_life_percent(14, 1);  -- 14 days total, 1 day used
-- Returns: 92.86

-- Calculate expiration date
SELECT calculate_expiration_date('2026-01-29'::timestamp, 14, 1);
-- Returns: 2026-02-11 (13 days from listing)

-- Check if expired
SELECT is_product_expired('2026-01-15'::timestamp, 14, 20);
-- Returns: true (expired)
```

#### Main Search Function
```sql
SELECT * FROM search_products(
    14.5995,              -- buyer latitude
    120.9842,             -- buyer longitude
    50,                   -- max radius (km)
    0,                    -- min freshness (%)
    0.5,                  -- proximity weight
    0.5,                  -- freshness weight
    'ranking',            -- mode
    'score',              -- sort by
    'desc'                -- sort order
);
```

### Materialized View

**products_search_cache** - Optimized view with pre-calculated metrics:
- Freshness percentage
- Expiration date
- Remaining days
- Expired status

Refresh the cache:
```sql
SELECT refresh_products_search_cache();
```

## Connection String

```bash
# Environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=chenda
export DB_USER=postgres
export DB_PASSWORD=

# Or use connection string
postgresql://postgres@localhost:5432/chenda
```

## Testing the Schema

### Test spatial queries
```bash
sudo -u postgres psql -d chenda
```

```sql
-- Insert test user
INSERT INTO users (name, email, password_hash, type, location, address)
VALUES (
    'Test User',
    'test@chenda.com',
    '$2b$10$dummy',
    'buyer',
    ST_SetSRID(ST_MakePoint(120.9842, 14.5995), 4326),
    'Quezon City, Metro Manila'
);

-- Query distance
SELECT 
    name,
    ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint(121.0244, 14.5547), 4326)::geography
    ) / 1000 as distance_km
FROM users;
```

## Performance

### Analyze query performance
```sql
SELECT * FROM analyze_search_performance();
```

### Check index usage
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## Handling Already-Migrated Databases

If your database was already migrated (e.g., via manual SQL piping before the tracking system was in place), you may see errors like:

```
ERROR: relation "idx_users_email" already exists
ERROR: trigger "update_users_updated_at" already exists
```

This is expected — the schema exists, but the `migrations` table doesn't have a record. **This is safe.**

### Option 1: Let migrate.js catch up (Recommended)

Simply run the migration runner:

```bash
docker compose run --rm backend node migrations/migrate.js up
```

The runner will:
1. Create the `migrations` tracking table
2. See that tables already exist (via `CREATE TABLE IF NOT EXISTS`)
3. Skip recreating them
4. **Insert the migration records into `migrations` table for future tracking**

Future runs will see the records and never attempt to re-apply them.

### Option 2: Bootstrap the migrations table manually

If you want to verify the state first:

```bash
docker compose exec db psql -U postgres -d chenda -c "
  CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  INSERT INTO migrations (filename) VALUES 
    ('001_create_tables.sql'),
    ('002_create_indexes.sql'),
    ('003_create_session_table.sql'),
    ('004_optimize_indexes.sql'),
    ('005_payment_integration.sql'),
    ('006_refunds_reconciliation.sql'),
    ('007_payment_monitoring_alerts.sql'),
    ('008_courier_delivery_fulfillment.sql')
  ON CONFLICT (filename) DO NOTHING;
  
  SELECT * FROM migrations ORDER BY id;
"
```

Then run the migration checker:

```bash
docker compose run --rm backend node migrations/migrate.js status
```

You should see all 8 migrations marked as applied.

### Verification

After handling the already-migrated state, verify your schema is consistent:

```bash
docker compose exec db psql -U postgres -d chenda -c "
  SELECT COUNT(*) as migration_count FROM migrations;
  SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';
  SELECT COUNT(*) as index_count FROM pg_indexes WHERE schemaname = 'public';
"
```

Expected output:
- `migration_count`: 8 (all migrations recorded)
- `table_count`: 16+ (users, products, product_types, orders, deliveries, session, etc.)
- `index_count`: 40+ (spatial, B-tree, and composite indexes)
