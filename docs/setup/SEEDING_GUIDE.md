## Seeding Guide (Docker Compose)

Use this guide when running Chenda with Docker Compose.

## What's New

### Migration 010 — Extensible Custom Product Types

As of **Migration 010** (2026-04-25), sellers can now create products that are not in the USDA or regional catalog. The system supports three tiers of product types:

| Source | How created | Shelf life authority | IDs |
|---|---|---|---|
| `usda` | Seeded from FoodKeeper data | Fixed research baseline | 1–9999 |
| `regional` | Seeded from `philippines_regional_products.sql` | Community average once ≥3 sellers override | 10001–19999 |
| `custom` | Created on-the-fly by any seller via the API/form | Seller-provided; becomes community avg over time | ≥10000 (sequence) |

Key features added:
- `source` CHECK constraint now includes `'custom'`
- `community_avg_shelf_life_days` — auto-updated by DB trigger when ≥3 sellers set overrides
- Deduplication — two sellers using the same custom product name share one `product_types` row (case-insensitive)
- `products_enriched` view: shelf life = seller override → community avg → original default

### Migration 011 — Product Type Images

As of **Migration 011** (2026-04-25), `product_types` now has a nullable `image_url TEXT` column:
- Populated automatically by `seed.js` from `seeds/product-images-manifest.json`
- Shown as thumbnails in the product type picker
- Pre-fills the listing image when a seller selects a catalog type
- Custom types default to `NULL`; sellers upload their own photo

### Migration 009 — Hybrid Product Types (earlier baseline)

As of **Migration 009** (2026-04-24), Chenda added:
- **USDA Baseline** (~180 items) — Universal products (eggs, chicken, common vegetables)
- **Regional Philippine Products** (23 items) — Local specialties (Ilocos garlic, calamansi, bagoong, regional meats)
- **Custom Shelf Life Overrides** — Sellers can override shelf life per product type

See [HYBRID_PRODUCT_TYPES_SYSTEM.md](../HYBRID_PRODUCT_TYPES_SYSTEM.md) for full details.

## Preconditions

Before any seed command:

1. Containers are running: `docker compose up -d`
2. Migrations are already applied (including Migration 009 if updating)
3. You are in the project root

## Important: Target The Correct Database

If you run `node migrations/migrate.js up` or `node seeds/seed.js` on your host, they use your host environment values and may target local Postgres (`localhost`) instead of the Docker `db` container.

For Docker deployments, prefer Docker-executed commands to guarantee the container database is updated.

### Docker-safe Migration (Migration 009)

```bash
# Apply migration directly to Docker DB container
docker compose exec -T db psql -U postgres -d chenda < migrations/009_hybrid_product_types.sql
```

### Verify Migration 009 in Docker DB

```bash
docker compose exec db psql -U postgres -d chenda -c "
	SELECT column_name
	FROM information_schema.columns
	WHERE table_name = 'product_types'
	ORDER BY ordinal_position;
"

# Must include:
# source
# region
# is_available_in_philippines
```

### Docker-safe Full Seeding (explicit SQL order)

```bash
docker compose exec -T db psql -U postgres -d chenda < seeds/product_types.sql
docker compose exec -T db psql -U postgres -d chenda < seeds/philippines_regional_products.sql
docker compose exec -T db psql -U postgres -d chenda < seeds/mock_users.sql
docker compose exec -T db psql -U postgres -d chenda < seeds/mock_products.sql
docker compose exec -T db psql -U postgres -d chenda < seeds/nationwide_products.sql
```

### Verify Product Type Counts in Docker DB

```bash
docker compose exec db psql -U postgres -d chenda -c "
	SELECT source, COUNT(*) FROM product_types GROUP BY source ORDER BY source;
"

# Expected:
# regional | 23
# usda     | 180
```

## Seeding Options

| Option | Command | Scope | Keeps users/product types? | Typical use |
|---|---|---|---|---|
| Safe first seed | `node seeds/seed.js` | Full seed if DB is empty | N/A | First setup on fresh DB |
| Full reset | `node seeds/seed.js --force` | Reseed all datasets | No | Rebuild complete test DB |
| Products-only reseed | `node seeds/seed.js --products-only` | Clears `orders` + `products`, then reseeds | Yes | Refresh product listings quickly |
| Clear-only utility | `node seeds/clear-products.js --confirm` | Clears `orders` + `products` only | Yes | Manual cleanup before custom tests |
| Add regional products only | `docker compose exec -T db psql ... < seeds/philippines_regional_products.sql` | Insert 23 regional types into existing DB | Yes | Extend existing DB |

> **Images are applied automatically** at the end of every `seed.js` run if `seeds/product-images-manifest.json` exists. If it doesn't, seeding still completes — you just won't have type images. See **Product Images** below.

Note: `--products-only` does not generate new timestamps dynamically. It reloads values exactly as defined in SQL seed files.

## Migration Path: Already Seeded Database

**If you have an existing seeded database (before Migration 009), choose one path:**

### Option A: Minimal Update — Migrations 010 + 011 only (keep existing data)

```bash
# 1. Apply new migrations
docker compose run --rm \
	-v "$(pwd)":/workspace \
	-w /workspace/migrations \
	--entrypoint node \
	backend migrate.js up
# Applies 010_custom_product_types.sql and 011_product_type_images.sql

# 2. (Optional) Download images (Skip if already in repo)
node seeds/fetch-product-images.js --download --all
docker compose run --rm -v "$(pwd)":/workspace -w /workspace/seeds --entrypoint node backend seed.js --products-only
```

**Pros:** No data loss, custom product creation works immediately  
**Cons:** Existing products don't get images unless you run the image step

### Option B: Full Reset (Recommended for dev/test)

Clean slate with all new data.

```bash
# 1. Apply all pending migrations
docker compose run --rm \
	-v "$(pwd)":/workspace \
	-w /workspace/migrations \
	--entrypoint node \
	backend migrate.js up

# 2. (Optional) Download images first (Skip if already in repo)
node seeds/fetch-product-images.js --download --all

# 3. Full reseed — images applied automatically
docker compose run --rm -v "$(pwd)":/workspace -w /workspace/seeds --entrypoint node backend seed.js --force
```

**Pros:** Clean start, all features active, images populated  
**Cons:** All existing products, orders, users deleted

### Option C: Keep Users, Refresh Products

```bash
# 1. Apply all pending migrations
docker compose run --rm \
	-v "$(pwd)":/workspace \
	-w /workspace/migrations \
	--entrypoint node \
	backend migrate.js up

# 2. Reseed products (keeps users and types)
docker compose run --rm -v "$(pwd)":/workspace -w /workspace/seeds --entrypoint node backend seed.js --products-only
```

**Pros:** Test users remain, new migrations active, images applied  
**Cons:** Mock products reset to defaults

## Running Seeder in Docker Compose

If Node is not installed on the host, run the seeder inside a temporary backend container:

### Running seed.js via Docker

```bash
# Safe seed (if DB is empty)
docker compose run --rm \
	-v "$(pwd)":/workspace \
	-w /workspace/seeds \
	--entrypoint node \
	backend seed.js

# Full reset
docker compose run --rm \
	-v "$(pwd)":/workspace \
	-w /workspace/seeds \
	--entrypoint node \
	backend seed.js --force

# Products-only reseed
docker compose run --rm \
	-v "$(pwd)":/workspace \
	-w /workspace/seeds \
	--entrypoint node \
	backend seed.js --products-only
```

Windows PowerShell equivalent:

```powershell
# Safe seed
docker compose run --rm `
	-v "${PWD}:/workspace" `
	-w /workspace/seeds `
	--entrypoint node `
	backend seed.js

# Full reset
docker compose run --rm `
	-v "${PWD}:/workspace" `
	-w /workspace/seeds `
	--entrypoint node `
	backend seed.js --force

# Products-only reseed
docker compose run --rm `
	-v "${PWD}:/workspace" `
	-w /workspace/seeds `
	--entrypoint node `
	backend seed.js --products-only
```

### Running SQL seeds directly via psql

For manual SQL seeding (useful when Node isn't available):

```bash
# Seed USDA baseline product types
docker compose exec -T db psql -U postgres -d chenda < seeds/product_types.sql

# Seed Philippine regional product types (NEW — Migration 009)
docker compose exec -T db psql -U postgres -d chenda < seeds/philippines_regional_products.sql

# Seed mock users
docker compose exec -T db psql -U postgres -d chenda < seeds/mock_users.sql

# Seed mock products
docker compose exec -T db psql -U postgres -d chenda < seeds/mock_products.sql

# Seed nationwide products (optional, large dataset)
docker compose exec -T db psql -U postgres -d chenda < seeds/nationwide_products.sql
```

## Why orders are cleared with products-only

The `orders` table references `products` through a foreign key. Clearing products first would fail with FK constraints, so the process deletes orders before products.

## Product Images

Product type images are fetched via DuckDuckGo Image Search (no API key required) and stored locally. The manifest is consumed by `seed.js` automatically.

### Image Sources

| Source | List file | Count | Notes |
|---|---|---|---|
| USDA | `seeds/products-list-unique.txt` | 474 names | Generic food product names |
| Regional | `seeds/regional-products-list.txt` | 23 names | Philippines-specific query hints applied |
| Custom | *(none — runtime only)* | — | Sellers upload their own photos |

### Download images (one-time setup)

```bash
# USDA only (default)
node seeds/fetch-product-images.js --download

# Regional only
node seeds/fetch-product-images.js --download --regional

# Both USDA + regional (recommended for full catalog)
node seeds/fetch-product-images.js --download --all

# Limit to N items (useful for quick testing)
node seeds/fetch-product-images.js --download --all --limit 30

# Force re-download even if file exists
node seeds/fetch-product-images.js --download --all --force
```

Images are saved to `public/images/products/<slug>.<ext>` and the manifest to `seeds/product-images-manifest.json`.

### Skip logic

The script **skips already-downloaded images** by default (checks all common extensions). Use `--force` to redownload.

### Integration with seed.js

`seed.js` automatically calls `applyImageManifest()` at the end of every run. If the manifest exists, it:
1. `UPDATE product_types SET image_url` for each matched name (case-insensitive)
2. `UPDATE products SET image_url` from the type's image for products with no seller photo

If the manifest is missing, seeding completes normally with a warning.

## Custom Product Types

Sellers can create products outside the catalog entirely by using the custom product form toggle ("Not in the list? Add custom →").

### How it works

- Seller provides a product name and shelf life in days
- The API upserts a `source='custom'` row in `product_types` (case-insensitive dedup — two sellers with the same name share one row)
- Custom IDs start at 10,000 via `product_types_custom_id_seq` (no collision with USDA/regional IDs)
- The community average trigger fires when ≥3 sellers have overrides for the same custom type

### API example

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Authorization: Bearer <seller_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "custom_product_name": "Dayap Citrus",
    "custom_shelf_life_days": 14,
    "price": 80,
    "quantity": 20,
    "unit": "pieces",
    "location": { "lat": 14.5995, "lng": 120.9842 },
    "storage_condition": "refrigerated"
  }'
```

## Quick Validation

### Data counts

```bash
docker compose exec db psql -U postgres -d chenda -c "
	SELECT 'product_types' AS table, COUNT(*) FROM product_types
	UNION ALL
	SELECT 'users', COUNT(*) FROM users
	UNION ALL
	SELECT 'products', COUNT(*) FROM products
	UNION ALL
	SELECT 'orders', COUNT(*) FROM orders;
"
```

### Product types breakdown (USDA vs Regional vs Custom)

```bash
docker compose exec db psql -U postgres -d chenda -c "
	SELECT source, COUNT(*) FROM product_types GROUP BY source ORDER BY source;
"

# Expected after full seed:
#  source  | count
# ---------+-------
#  regional |    23
#  usda     |   180
# (custom entries appear here once sellers start creating them)
```

### Check image population

```bash
docker compose exec db psql -U postgres -d chenda -c "
	SELECT COUNT(*) as types_with_images FROM product_types WHERE image_url IS NOT NULL;
"

docker compose exec db psql -U postgres -d chenda -c "
	SELECT COUNT(*) as products_with_images FROM products WHERE image_url IS NOT NULL;
"
```

### Check regional product examples

```bash
docker compose exec db psql -U postgres -d chenda -c "
	SELECT id, name, region, default_shelf_life_days, source 
	FROM product_types 
	WHERE source = 'regional' 
	ORDER BY region, name 
	LIMIT 10;
"
```

### Verify shelf life overrides table exists (Migration 009)

```bash
docker compose exec db psql -U postgres -d chenda -c "
	\dt product_shelf_life_overrides
"

# Should show the table if Migration 009 was applied
```

### Test shelf life override API

```bash
# Get available regional product types
curl http://localhost:3001/api/shelf-life/product-types?source=regional&limit=5

# Create a shelf life override (requires seller token)
curl -X POST http://localhost:3001/api/shelf-life/overrides \
  -H "Authorization: Bearer <seller_token>" \
  -H "Content-Type: application/json" \
  -d '{
		"product_type_id": 10001,
    "override_shelf_life_days": 200,
    "reason": "Tropical storage conditions"
  }'
```
