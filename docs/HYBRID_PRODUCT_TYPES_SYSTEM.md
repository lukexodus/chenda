# Hybrid Product Types System

**Version**: 1.0  
**Added**: Migration 009 (2026-04-24)  
**Purpose**: Support USDA baseline product types for universal items + Philippine regional specialties + custom shelf life overrides for sellers

---

## Overview

Chenda now supports three types of product configurations:

| Type | Source | Purpose | Customization |
|------|--------|---------|---|
| **USDA Baseline** | `product_types.source = 'usda'` | Standard universal items (eggs, chicken, vegetables) | Via shelf life overrides |
| **Regional/Philippine** | `product_types.source = 'regional'` | Local specialties (Ilocos garlic, calamansi, bagoong) | Via shelf life overrides |
| **Custom Overrides** | `product_shelf_life_overrides` | Per-seller customization for tropical/local conditions | Seller-managed API |

---

## 1. USDA Baseline Product Types

### What's included
- ~180 universal food items from USDA FoodKeeper database
- Standard shelf life based on temperate climate storage
- Full-text searchable keywords
- Organized by category (dairy, meat, produce, etc.)

### Example USDA types:
```sql
SELECT id, name, default_shelf_life_days, source 
FROM product_types 
WHERE source = 'usda' 
LIMIT 5;

-- Results:
-- id: 5   | name: Cheese (shredded)        | days: 30  | source: usda
-- id: 21  | name: Eggs                     | days: 28  | source: usda
-- id: 113 | name: Chicken, Fresh           | days: 2   | source: usda
-- id: 251 | name: Banana                   | days: 5   | source: usda
```

### API access
```
GET /api/product-types?source=usda&ph_available=true
```

---

## 2. Philippine Regional Product Types

### What's included
- 23+ regional/local specialty product types
- Organized by region (Ilocos, Cordillera, Visayas, Mindanao)
- Shelf life adjusted for **tropical storage conditions**
- Full-text search support

### Regional categories included:

#### Ilocos Specialties (Region I)
- Ilocos Garlic (id 301) — 180 days in pantry
- Tobacco Leaves (id 302) — 365 days dried
- Local heritage meats

#### Tropical Fruits & Produce
- Mango (id 303) — 7 days refrigerated (shorter than USDA due to tropical ripening)
- Calamansi (id 305) — 14 days pantry (Philippine citrus)
- Coconut (id 320) — 30 days pantry
- Kangkong (id 307) — 3 days (highly perishable leafy green)

#### Regional Proteins
- Chicken (Local Heritage) (id 311) — 2 days refrigerated
- Tilapia (Fresh) (id 313) — 1 day refrigerated
- Carabao Milk (id 314) — 1 day refrigerated (perishable in tropical heat)

#### Specialty Items
- Bagoong (id 317) — 365 days pantry (fermented, shelf-stable)
- Salted Fish/Tuyo (id 316) — 180 days pantry (dried/cured)

### Example regional types:
```sql
SELECT id, name, default_shelf_life_days, region, source 
FROM product_types 
WHERE source = 'regional' 
ORDER BY region;

-- Results show: Ilocos products, CAR products, Visayas, Mindanao, etc.
```

### API access
```
GET /api/product-types?source=regional&region=Ilocos%20Norte
GET /api/product-types?ph_available=true  -- All types available in PH
```

---

## 3. Shelf Life Overrides

### Why overrides?
- **Tropical climate**: USDA shelf life assumes temperate storage; Philippine heat reduces lifespan
- **Local conditions**: Seller-specific storage (e.g., specialized cooling, traditional methods)
- **Regional variations**: Different cultivars/breeds store differently
- **Customization**: Sellers can adjust based on experience

### How they work

**Workflow:**
1. Seller creates a product using any `product_type_id` (USDA or regional)
2. Optionally, seller creates an override for that product type
3. When calculating freshness, algorithm checks for override
4. **If override exists:** Use custom shelf life
5. **If no override:** Use product_type default

### Database structure

```sql
-- Table: product_shelf_life_overrides
CREATE TABLE product_shelf_life_overrides (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL,           -- Which seller
    product_type_id INTEGER NOT NULL,     -- Which product type
    override_shelf_life_days INTEGER,     -- Custom days
    override_storage_condition VARCHAR,   -- Custom storage (optional)
    reason TEXT,                          -- Why (e.g., "Tropical storage")
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(seller_id, product_type_id)    -- One override per seller+product combo
);
```

### Example overrides:

#### Override 1: Tropical Eggs
```sql
INSERT INTO product_shelf_life_overrides (
    seller_id, product_type_id, override_shelf_life_days, reason
) VALUES (
    5,        -- Seller ID
    21,       -- Eggs (USDA default 28 days)
    21,       -- Custom: 21 days in Philippines
    'Tropical storage reduces shelf life; must consume sooner in heat'
);
```

#### Override 2: Ilocos Garlic
```sql
INSERT INTO product_shelf_life_overrides (
    seller_id, product_type_id, override_shelf_life_days, reason
) VALUES (
    12,       -- Batac Heritage Foods
    301,      -- Ilocos Garlic (regional, default 180 days)
    200,      -- Override: 200 days with special storage
    'Enhanced packaging and air conditioning maintain 200-day viability'
);
```

### API Endpoints

#### List all available product types (both USDA + regional)
```http
GET /api/shelf-life/product-types?source=regional&page=1&limit=50
```

**Query params:**
- `source`: `'usda'` | `'regional'` (optional)
- `region`: Filter by region name (optional)
- `ph_available`: `'true'` to show only PH-available types (optional)
- `page`, `limit`: Pagination (default: 1, 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 301,
      "name": "Ilocos Garlic",
      "name_subtitle": "white; bulbs or cloves",
      "source": "regional",
      "region": "Ilocos Norte",
      "default_shelf_life_days": 180,
      "is_available_in_philippines": true
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 23 }
}
```

#### Create a shelf life override
```http
POST /api/shelf-life/overrides
Authorization: Bearer <seller_token>
Content-Type: application/json

{
  "product_type_id": 301,
  "override_shelf_life_days": 200,
  "override_storage_condition": "pantry",
  "reason": "Special climate-controlled storage in Batac"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Shelf life override created/updated successfully",
  "data": {
    "id": 1,
    "seller_id": 5,
    "product_type_id": 301,
    "override_shelf_life_days": 200,
    "override_storage_condition": "pantry",
    "reason": "Special climate-controlled storage in Batac",
    "created_at": "2026-04-24T10:30:00.000Z",
    "updated_at": "2026-04-24T10:30:00.000Z"
  }
}
```

#### Get seller's overrides
```http
GET /api/shelf-life/overrides
Authorization: Bearer <seller_token>
```

**Query:**
- `product_type_id`: Filter by product type (optional)
- `page`, `limit`: Pagination (default: 1, 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "seller_id": 5,
      "product_type_id": 301,
      "override_shelf_life_days": 200,
      "product_name": "Ilocos Garlic",
      "default_shelf_life_days": 180,
      "source": "regional",
      "region": "Ilocos Norte"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1 }
}
```

#### Update an override
```http
PATCH /api/shelf-life/overrides/:overrideId
Authorization: Bearer <seller_token>

{
  "override_shelf_life_days": 210,
  "reason": "Extended cold chain implementation"
}
```

#### Delete an override
```http
DELETE /api/shelf-life/overrides/:overrideId
Authorization: Bearer <seller_token>
```

---

## 4. Shelf Life Calculation with Overrides

### Algorithm

**Before (USDA only):**
```
Freshness% = (total_shelf_life - days_used) / total_shelf_life * 100
  where total_shelf_life = product_types.default_shelf_life_days
```

**After (with overrides):**
```
effective_shelf_life = 
  IF override exists for (seller, product_type)
    THEN product_shelf_life_overrides.override_shelf_life_days
    ELSE product_types.default_shelf_life_days

freshness% = (effective_shelf_life - days_used) / effective_shelf_life * 100
```

### Code integration

**Node.js calculation:**
```javascript
const { calculateShelfLifeMetricsWithOverride } = require('./shelf-life');

// Product with override
const product = {
  total_shelf_life_days: 28,           // USDA default (eggs)
  override_shelf_life_days: 21,        // Custom override
  days_already_used: 5,
  listed_date: '2026-04-24T06:00:00Z',
  source: 'usda',
  region: null
};

const metrics = calculateShelfLifeMetricsWithOverride(product);
// Returns:
// {
//   remaining_shelf_life_days: 16,
//   freshness_percent: 76.19,         // (21-5) / 21 * 100
//   expiration_date: Date,
//   is_expired: false,
//   shelf_life_config: {
//     effectiveShelfLifeDays: 21,      // Used override
//     usedOverride: true,
//     reason: 'seller_custom_override'
//   }
// }
```

### Database view

**products_enriched view** (auto-updated after migration 009):
```sql
CREATE VIEW products_enriched AS
SELECT 
  p.*,
  -- ... other fields ...
  COALESCE(pslo.override_shelf_life_days, pt.default_shelf_life_days) as shelf_life_days,
  COALESCE(pslo.override_storage_condition, pt.default_storage_condition) as effective_storage_condition,
  -- ... joins to product_types, users, and LEFT JOIN to overrides ...
FROM products p
JOIN product_types pt ON p.product_type_id = pt.id
LEFT JOIN product_shelf_life_overrides pslo ON (pslo.seller_id = p.seller_id AND pslo.product_type_id = pt.id);
```

---

## 5. Regional Product IDs

### ID Ranges

| Range | Type | Count | Purpose |
|-------|------|-------|---------|
| **1–280** | USDA baseline | ~180 | Universal USDA FoodKeeper items |
| **300–399** | Regional | 23 | Philippine regional specialties |

### Regional Product IDs (Philippines)

| ID | Name | Region | Default Shelf Life |
|-------|------|--------|---|
| 301 | Ilocos Garlic | Ilocos Norte | 180 days |
| 302 | Tobacco Leaves | Ilocos Region | 365 days |
| 303 | Mango | Davao, Calamansi | 7 days |
| 305 | Calamansi | Nationwide | 14 days |
| 307 | Kangkong | Nationwide | 3 days |
| 311 | Chicken (Local Heritage) | Nationwide | 2 days |
| 313 | Tilapia (Fresh) | Nationwide | 1 day |
| 314 | Carabao Milk | Nationwide | 1 day |
| 316 | Salted Fish (Tuyo) | Nationwide | 180 days |
| 317 | Bagoong | Nationwide | 365 days |
| 320 | Coconut (Fresh) | Mindanao, Visayas | 30 days |

---

## 6. Seed Data Structure

### Files
- `migrations/009_hybrid_product_types.sql` — Schema changes (source, region, overrides table)
- `seeds/philippines_regional_products.sql` — 23 regional product types
- `seeds/product_types.sql` — USDA baseline (unchanged, marked as source='usda')

### Running seeds
```bash
# Run migration
node migrations/migrate.js up

# Seed USDA baseline (existing)
psql chenda < seeds/product_types.sql

# Seed regional products (new)
psql chenda < seeds/philippines_regional_products.sql

# Verify counts
psql chenda -c "SELECT source, COUNT(*) FROM product_types GROUP BY source;"
-- Results: usda | 180, regional | 23
```

---

## 7. Best Practices

### For Sellers
✅ Create overrides for **tropical/regional** storage  
✅ Document the **reason** for each override  
✅ Update overrides if storage **conditions change**  
❌ Don't override items you **don't actually sell**  
❌ Don't set unrealistic shelf life values  

### For System Design
✅ Always use `calculateShelfLifeMetricsWithOverride()` in freshness calculations  
✅ Return override info in API responses for transparency  
✅ Show shelf life config when displaying freshness warnings  
✅ Allow sellers to view/manage their own overrides  
❌ Don't allow global override by non-admin sellers  
❌ Don't auto-create overrides based on geography  

### For Regional Expansion
✅ Add new regions to `product_types.region` when expanding  
✅ Create regional product types for local specialties  
✅ Allow sellers to customize via overrides  
✅ Document climate/storage assumptions in reason field  

---

## 8. Migration Path

**Timeline:**
- **Before**: 180 USDA product types only
- **After Migration 009**:
  - `product_types` extended with `source`, `region`, `is_available_in_philippines`
  - `product_shelf_life_overrides` table created
  - 23 regional product types seeded
  - Enriched view updated to use overrides

**No breaking changes:**
- Existing products continue working
- Default behavior unchanged (no overrides = USDA defaults)
- Overrides are opt-in per seller

---

## 9. Future Extensions

### Potential improvements
- **Batch override creation** — Sellers can set overrides for multiple types at once
- **Override templates** — Pre-built profiles for common scenarios (e.g., "Tropical storage", "Air-conditioned warehouse")
- **Analytics** — Track which product types are most overridden per region
- **AI suggestions** — Recommend overrides based on seller's historical data
- **Seasonal adjustments** — Allow time-based overrides for seasonal products
- **Category overrides** — Apply overrides to entire product categories

---

## 10. References

- **Migration**: `migrations/009_hybrid_product_types.sql`
- **Regional seeds**: `seeds/philippines_regional_products.sql`
- **API routes**: `server/routes/shelfLifeOverrides.js`
- **Controller**: `server/controllers/shelfLifeOverridesController.js`
- **Calculations**: `server/algorithm/calculations/shelf-life.js` (functions: `resolveShelfLifeWithOverride`, `calculateShelfLifeMetricsWithOverride`)
- **Database schema**: `docs/DATABASE_SCHEMA.md`

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-24  
**Implemented in**: Migration 009
