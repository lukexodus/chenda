# Database Migrations

This directory contains all database migration files for the Chenda project.

## Overview

The database uses **PostgreSQL 16** with **PostGIS 3.6** for geospatial functionality.

## Structure

```
migrations/
├── migrate.js              # Migration runner script
├── 001_create_tables.sql   # Creates core tables (users, products, etc.)
├── 002_create_indexes.sql  # Creates spatial indexes and helper functions
└── README.md              # This file
```

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

## Next Steps

After running migrations:

1. ✅ Task 1.1.2: Create database schema - **COMPLETE**
2. ✅ Task 1.1.3: Create spatial indexes - **COMPLETE**
3. ✅ Task 1.1.4: Write migration scripts - **COMPLETE**
4. ⬜ Task 1.1.5: Seed initial data (USDA products, mock users, mock products)
5. ⬜ Task 1.1.6: Test database connections

See `seeds/` directory for data seeding scripts.
