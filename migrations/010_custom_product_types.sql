-- Migration 010: Custom Product Types + Community Shelf Life
-- Date: 2026-04-24
-- Description:
--   1. Extends product_types.source to accept 'custom' entries created by sellers.
--   2. Adds deduplication so the same custom product name maps to a single shared row.
--   3. Adds community_avg_shelf_life_days: a running average of all seller overrides
--      for 'regional' and 'custom' product types (updated by trigger).
--   4. Updates the enriched view COALESCE chain:
--        personal_override → community_avg (when ≥3 data points) → original_default

-- ============================================
-- 1. EXTEND source CONSTRAINT
-- ============================================

ALTER TABLE product_types
  DROP CONSTRAINT IF EXISTS product_types_source_check;

ALTER TABLE product_types
  ADD CONSTRAINT product_types_source_check
  CHECK (source IN ('usda', 'regional', 'custom'));

-- ============================================
-- 2. NEW COLUMNS ON product_types
-- ============================================

-- Tracks which seller first created this custom type (NULL for usda/regional)
ALTER TABLE product_types
  ADD COLUMN IF NOT EXISTS created_by_seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Running community average of seller shelf-life overrides.
-- Updated automatically by trigger whenever product_shelf_life_overrides changes.
-- NULL until at least 3 sellers have submitted an override (see trigger).
ALTER TABLE product_types
  ADD COLUMN IF NOT EXISTS community_avg_shelf_life_days NUMERIC(8,2);

-- Number of override entries contributing to the community average
ALTER TABLE product_types
  ADD COLUMN IF NOT EXISTS community_override_count INTEGER NOT NULL DEFAULT 0;

-- ============================================
-- 3. SEQUENCE FOR CUSTOM IDs
-- ============================================

-- USDA seeds use fixed IDs (2–474 range), regional seeds extend from there.
-- Starting at 10000 gives a safe, non-colliding range for custom entries.
CREATE SEQUENCE IF NOT EXISTS product_types_custom_id_seq
  START 10000
  INCREMENT 1
  MINVALUE 10000;

-- ============================================
-- 4. DEDUPLICATION INDEX (custom types only)
-- ============================================

-- Ensures two sellers cannot create separate rows for the same custom product name.
-- Case-insensitive comparison via expression index on LOWER(name).
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_types_custom_name_unique
  ON product_types (LOWER(name))
  WHERE source = 'custom';

-- ============================================
-- 5. SUPPORTING INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_product_types_custom
  ON product_types(source) WHERE source = 'custom';

CREATE INDEX IF NOT EXISTS idx_product_types_created_by
  ON product_types(created_by_seller_id);

-- ============================================
-- 6. TRIGGER: recompute community_avg_shelf_life_days
-- ============================================

-- Function: called after any INSERT / UPDATE / DELETE on product_shelf_life_overrides.
-- Recalculates the average for the affected product_type if its source is 'regional' or 'custom'.
-- Sets community_avg_shelf_life_days to NULL when fewer than 3 overrides exist
-- so the enriched view falls back to the original default_shelf_life_days.
CREATE OR REPLACE FUNCTION update_community_shelf_life_avg()
RETURNS TRIGGER AS $$
DECLARE
  affected_type_id INTEGER;
  avg_days         NUMERIC(8,2);
  override_count   INTEGER;
  type_source      VARCHAR(20);
BEGIN
  -- Determine which product_type_id was affected
  IF TG_OP = 'DELETE' THEN
    affected_type_id := OLD.product_type_id;
  ELSE
    affected_type_id := NEW.product_type_id;
  END IF;

  -- Only update for regional / custom types; USDA shelf life is immutable
  SELECT source INTO type_source
    FROM product_types WHERE id = affected_type_id;

  IF type_source NOT IN ('regional', 'custom') THEN
    RETURN NEW;
  END IF;

  -- Calculate current average and count from all overrides for this type
  SELECT
    COUNT(*)::INTEGER,
    AVG(override_shelf_life_days)::NUMERIC(8,2)
  INTO override_count, avg_days
  FROM product_shelf_life_overrides
  WHERE product_type_id = affected_type_id;

  -- Only surface the average as the community reference once ≥ 3 sellers have contributed.
  -- Below that threshold, community_avg_shelf_life_days stays NULL so the
  -- enriched view falls back to the original default_shelf_life_days.
  UPDATE product_types
  SET
    community_avg_shelf_life_days = CASE WHEN override_count >= 3 THEN avg_days ELSE NULL END,
    community_override_count      = override_count,
    updated_at                    = CURRENT_TIMESTAMP
  WHERE id = affected_type_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to product_shelf_life_overrides (created in migration 009)
DROP TRIGGER IF EXISTS trg_update_community_shelf_life ON product_shelf_life_overrides;
CREATE TRIGGER trg_update_community_shelf_life
  AFTER INSERT OR UPDATE OR DELETE ON product_shelf_life_overrides
  FOR EACH ROW EXECUTE FUNCTION update_community_shelf_life_avg();

-- ============================================
-- 7. REBUILD enriched views with updated COALESCE chain
-- ============================================

-- Drop existing views (from 009) before recreating
DROP VIEW IF EXISTS products_active CASCADE;
DROP VIEW IF EXISTS products_enriched CASCADE;

-- Enriched view COALESCE priority:
--   1. Seller's personal override (most specific)
--   2. Community average for regional/custom types (when ≥3 data points exist)
--   3. Original default_shelf_life_days (USDA research value or initial seed)
CREATE OR REPLACE VIEW products_enriched AS
SELECT
  p.*,
  pt.name                         AS product_name,
  pt.name_subtitle                AS product_subtitle,
  pt.source                       AS product_source,
  pt.region                       AS product_region,

  -- Authoritative shelf life: personal → community avg → original default
  COALESCE(
    pslo.override_shelf_life_days,
    pt.community_avg_shelf_life_days,
    pt.default_shelf_life_days
  )                               AS shelf_life_days,

  -- Authoritative storage condition: personal → type default
  COALESCE(
    pslo.override_storage_condition,
    pt.default_storage_condition
  )                               AS effective_storage_condition,

  -- Reference values (always present, unchanged)
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

-- Convenience view: active listings only
CREATE OR REPLACE VIEW products_active AS
SELECT * FROM products_enriched
WHERE status = 'active';

-- ============================================
-- COMPLETED: 010_custom_product_types.sql
-- ============================================
