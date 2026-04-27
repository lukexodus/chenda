-- Migration 013: Seller Shelf Life Per Listing
-- Date: 2026-04-27
-- Description:
--   1) Persists seller-entered shelf life on each product listing.
--   2) Backfills existing products from seller overrides (if any) or product type defaults.
--   3) Rebuilds enriched views to treat listing shelf life as authoritative.

-- ============================================
-- 1. ADD COLUMN (nullable first for backfill)
-- ============================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS seller_shelf_life_days INTEGER;

-- ============================================
-- 2. BACKFILL EXISTING ROWS
-- ============================================

UPDATE products p
SET seller_shelf_life_days = COALESCE(
  (
    SELECT pslo.override_shelf_life_days
    FROM product_shelf_life_overrides pslo
    WHERE pslo.seller_id = p.seller_id
      AND pslo.product_type_id = p.product_type_id
    LIMIT 1
  ),
  (
    SELECT pt.default_shelf_life_days
    FROM product_types pt
    WHERE pt.id = p.product_type_id
    LIMIT 1
  )
)
WHERE 1=1
  AND (p.seller_shelf_life_days IS NULL OR p.seller_shelf_life_days <= 0);

-- ============================================
-- 3. ENFORCE CONSTRAINTS
-- ============================================

-- Ensure inserts that omit seller_shelf_life_days (e.g., seed SQL) still get a sensible value.
-- The API continues to require explicit seller input; this is a DB safety net.
CREATE OR REPLACE FUNCTION set_products_seller_shelf_life_days_default()
RETURNS TRIGGER AS $$
DECLARE
  fallback_days INTEGER;
BEGIN
  IF NEW.seller_shelf_life_days IS NULL OR NEW.seller_shelf_life_days <= 0 THEN
    SELECT default_shelf_life_days INTO fallback_days
    FROM product_types
    WHERE id = NEW.product_type_id;

    IF fallback_days IS NULL OR fallback_days <= 0 THEN
      RAISE EXCEPTION 'seller_shelf_life_days is required and no product type default exists for product_type_id=%', NEW.product_type_id;
    END IF;

    NEW.seller_shelf_life_days := fallback_days;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_set_seller_shelf_life_default ON products;
CREATE TRIGGER trg_products_set_seller_shelf_life_default
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_products_seller_shelf_life_days_default();

ALTER TABLE products
  ADD CONSTRAINT products_seller_shelf_life_days_check
  CHECK (seller_shelf_life_days > 0);

ALTER TABLE products
  ALTER COLUMN seller_shelf_life_days SET NOT NULL;

-- ============================================
-- 4. REBUILD ENRICHED VIEWS (listing shelf life is authoritative)
-- ============================================

DROP VIEW IF EXISTS products_active CASCADE;
DROP VIEW IF EXISTS products_enriched CASCADE;

CREATE OR REPLACE VIEW products_enriched AS
SELECT
  p.*,
  pt.name                         AS product_name,
  pt.name_subtitle                AS product_subtitle,
  pt.source                       AS product_source,
  pt.region                       AS product_region,

  -- Authoritative shelf life: listing (seller-entered)
  p.seller_shelf_life_days        AS shelf_life_days,

  -- Authoritative storage condition: personal override → type default
  COALESCE(
    pslo.override_storage_condition,
    pt.default_storage_condition
  )                               AS effective_storage_condition,

  -- Reference values (unchanged)
  pt.default_shelf_life_days,
  pt.default_storage_condition,
  pt.community_avg_shelf_life_days,
  pt.community_override_count,

  -- Seller info
  u.name                          AS seller_name,
  u.email                         AS seller_email,

  -- Coordinates
  ST_X(p.location::geometry)      AS longitude,
  ST_Y(p.location::geometry)      AS latitude
FROM products p
JOIN  product_types pt            ON p.product_type_id = pt.id
JOIN  users u                     ON p.seller_id = u.id
LEFT JOIN product_shelf_life_overrides pslo
  ON (pslo.seller_id = p.seller_id AND pslo.product_type_id = pt.id);

CREATE OR REPLACE VIEW products_active AS
SELECT * FROM products_enriched
WHERE status = 'active';

-- ============================================
-- COMPLETED: 013_seller_shelf_life_per_listing.sql
-- ============================================
