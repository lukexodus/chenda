# Database Seeds

This directory contains seed data for the Chenda database.

## Overview

Seed files populate the database with initial data for development and testing:
- **180 USDA Product Types** - Real perishable food data from FoodKeeper database
- **10 Mock Users** - Test buyer and seller accounts
- **30 Mock Products** - Sample product listings

## Files

```
seeds/
├── generate-seeds.js      # Converts JSON to SQL
├── seed.js                # Executes SQL seed files
├── product_types.sql      # 180 USDA product types (auto-generated)
├── mock_users.sql         # 10 test users (auto-generated)
└── mock_products.sql      # 30 test products (auto-generated)
```

## Usage

### Generate Seed Files

Convert JSON data from algorithm to SQL:

```bash
node generate-seeds.js
```

This reads from:
- `chenda-algo/src/product-management/product-types.json` (180 items)
- `chenda-algo/src/data/mock_users.json` (10 users)
- `chenda-algo/src/data/mock_products.json` (30 products)

### Seed the Database

**First time** (empty database):
```bash
node seed.js
```

**Re-seed** (clear and reload):
```bash
node seed.js --force
```

**Help**:
```bash
node seed.js --help
```

## Test Credentials

All mock users have the same password for testing:

```
Email: maria.santos@email.com
Password: password123
```

### Mock Users

| ID | Name | Email | Type |
|----|------|-------|------|
| 1 | Maria Santos | maria.santos@email.com | buyer |
| 2 | Carlos Reyes | carlos.reyes@email.com | buyer |
| 3 | Ana Garcia | ana.garcia@email.com | buyer |
| 4 | Roberto Cruz | roberto.cruz@email.com | buyer |
| 5 | Sofia Mendoza | sofia.mendoza@email.com | buyer |
| 6 | Juan dela Cruz | juan.delacruz@email.com | seller |
| 7 | Pedro Santos | pedro.santos@email.com | seller |
| 8 | Rosa Martinez | rosa.martinez@email.com | seller |
| 9 | Luis Gonzales | luis.gonzales@email.com | both |
| 10 | Elena Rodriguez | elena.rodriguez@email.com | both |

## Data Structure

### Product Types (180 items)

From USDA FoodKeeper database with:
- Product name and subtitle
- Category ID
- Keywords for search
- Default shelf life (in days)
- Default storage condition (pantry/refrigerated/frozen variants)
- Source data (min/max/metric from USDA)

Example:
```sql
INSERT INTO product_types VALUES (
  33,
  'Yogurt',
  NULL,
  7,
  'Yogurt',
  11,
  'refrigerated_opened',
  '{"min":1,"max":2,"metric":"Weeks"}'::jsonb
);
```

### Mock Users (10 users)

Including:
- Name, email, password hash (bcrypt)
- User type: buyer, seller, or both
- **Location** as PostGIS POINT (lat/lng)
- Address text
- Algorithm preferences (JSONB): weights, radius, thresholds
- Email verified status
- Created timestamp

Example:
```sql
INSERT INTO users VALUES (
  'Maria Santos',
  'maria.santos@email.com',
  '$2b$10$...',  -- bcrypt hash of 'password123'
  'buyer',
  ST_SetSRID(ST_MakePoint(120.9842, 14.5995), 4326),  -- Quezon City
  'Quezon City, Metro Manila',
  '{"proximity_weight":60,"shelf_life_weight":40,...}'::jsonb,
  true,
  '2025-01-15T08:30:00Z'
);
```

### Mock Products (30 products)

Including:
- Seller ID (FK to users)
- Product type ID (FK to product_types)
- Days already used (shelf life tracking)
- Listed date
- Price, quantity, unit
- **Location** as PostGIS POINT (lat/lng)
- Address text
- Storage condition
- Description
- Status (active/sold/expired/removed)

Example:
```sql
INSERT INTO products VALUES (
  6,  -- seller_id (Juan dela Cruz)
  33,  -- product_type_id (Yogurt)
  1,  -- days_already_used
  '2025-01-29T06:00:00Z',
  85.00,
  3,
  'containers',
  ST_SetSRID(ST_MakePoint(121.0223, 14.6091), 4326),  -- Pasig City
  'Pasig City',
  'refrigerated_opened',
  'Fresh yogurt, opened yesterday',
  'active'
);
```

## Seeding Process

The `seed.js` script:

1. **Checks migrations** - Ensures database schema is created
2. **Checks existing data** - Prevents accidental data loss
3. **Disables triggers** - For faster bulk insert (session_replication_role)
4. **Executes SQL files** in order:
   - product_types.sql (180 items)
   - mock_users.sql (10 users)
   - mock_products.sql (30 products)
5. **Re-enables triggers**
6. **Updates sequences** - Resets auto-increment counters
7. **Verifies counts** - Confirms data was inserted

## Performance

Bulk inserts with disabled triggers:
- **Product Types**: ~500ms (180 rows)
- **Users**: ~100ms (10 rows with PostGIS)
- **Products**: ~200ms (30 rows with PostGIS)

**Total**: < 1 second for complete seeding

## Verification

After seeding, verify data:

```bash
# Count records
sudo -u postgres psql -d chenda -c "
  SELECT 'product_types' as table, COUNT(*) FROM product_types
  UNION SELECT 'users', COUNT(*) FROM users
  UNION SELECT 'products', COUNT(*) FROM products;
"

# Check users with locations
sudo -u postgres psql -d chenda -c "
  SELECT 
    name, 
    email, 
    type,
    ST_X(location::geometry) as lng,
    ST_Y(location::geometry) as lat
  FROM users;
"

# Check products with enriched data
sudo -u postgres psql -d chenda -c "
  SELECT 
    p.id,
    pt.name as product,
    u.name as seller,
    p.price,
    calculate_shelf_life_percent(
      pt.default_shelf_life_days,
      p.days_already_used
    ) as freshness_percent
  FROM products p
  JOIN product_types pt ON p.product_type_id = pt.id
  JOIN users u ON p.seller_id = u.id
  LIMIT 5;
"
```

## Re-generating Seeds

If the source JSON files change:

```bash
# Regenerate SQL files
node generate-seeds.js

# Re-seed database
node seed.js --force
```

## Troubleshooting

### "Migrations not applied"
Run migrations first:
```bash
cd ../migrations && node migrate.js up
```

### "Database already contains data"
Use `--force` to clear and re-seed:
```bash
node seed.js --force
```

### Password not working
All mock users use password: `password123`

### Spatial data not showing
Check PostGIS functions:
```sql
SELECT ST_X(location::geometry), ST_Y(location::geometry) FROM users LIMIT 1;
```

## Next Steps

After seeding:

1. ✅ Database has data
2. ⬜ Start API server (Task 1.2)
3. ⬜ Test algorithm with real database (Task 1.4)
4. ⬜ Build frontend (Phase 2)
