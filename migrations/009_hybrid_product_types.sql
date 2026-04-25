-- Migration 009: Hybrid Product Types (USDA + Regional)
-- Date: 2026-04-24
-- Description: Adds support for USDA + Philippine regional product types with custom shelf life overrides
-- Purpose: Enable local/regional product support while maintaining USDA baseline for universal items

-- ============================================
-- 1. EXTEND PRODUCT_TYPES TABLE
-- ============================================

-- Add source column to distinguish USDA vs Regional/Custom products
ALTER TABLE product_types
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'usda' CHECK (source IN ('usda', 'regional'));

-- Add region column for regional products
ALTER TABLE product_types
ADD COLUMN IF NOT EXISTS region VARCHAR(100);

-- Add is_available_in_philippines flag
ALTER TABLE product_types
ADD COLUMN IF NOT EXISTS is_available_in_philippines BOOLEAN DEFAULT false;

-- Create index for source filtering
CREATE INDEX IF NOT EXISTS idx_product_types_source ON product_types(source);
CREATE INDEX IF NOT EXISTS idx_product_types_region ON product_types(region);
CREATE INDEX IF NOT EXISTS idx_product_types_ph_available ON product_types(is_available_in_philippines) WHERE source = 'regional';

-- ============================================
-- 2. CREATE SHELF LIFE OVERRIDES TABLE
-- ============================================

-- Purpose: Store seller-specific or location-specific shelf life overrides
-- Allows customization for tropical/regional storage conditions
CREATE TABLE IF NOT EXISTS product_shelf_life_overrides (
    id SERIAL PRIMARY KEY,
    
    -- Reference to seller and product type
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_type_id INTEGER NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
    
    -- Custom shelf life values (in days)
    override_shelf_life_days INTEGER NOT NULL CHECK (override_shelf_life_days > 0),
    override_storage_condition VARCHAR(50) CHECK (
        override_storage_condition IN (
            'pantry', 'pantry_opened',
            'refrigerated', 'refrigerated_opened',
            'frozen', 'frozen_opened'
        )
    ),
    
    -- Context/reason for override
    reason VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for shelf life overrides
CREATE INDEX IF NOT EXISTS idx_shelf_life_overrides_seller ON product_shelf_life_overrides(seller_id);
CREATE INDEX IF NOT EXISTS idx_shelf_life_overrides_product_type ON product_shelf_life_overrides(product_type_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_shelf_life_overrides_unique ON product_shelf_life_overrides(seller_id, product_type_id);

-- Apply trigger for updated_at
DROP TRIGGER IF EXISTS update_shelf_life_overrides_updated_at ON product_shelf_life_overrides;
CREATE TRIGGER update_shelf_life_overrides_updated_at BEFORE UPDATE ON product_shelf_life_overrides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. UPDATE PRODUCT_TYPES VIEW
-- ============================================

-- Drop existing enriched view (to recreate with override support)
DROP VIEW IF EXISTS products_enriched CASCADE;

-- Recreate enriched view with shelf life override support
CREATE OR REPLACE VIEW products_enriched AS
SELECT 
    p.*,
    pt.name as product_name,
    pt.name_subtitle as product_subtitle,
    pt.source as product_source,
    pt.region as product_region,
    -- Use override shelf life if available, otherwise use default
    COALESCE(pslo.override_shelf_life_days, pt.default_shelf_life_days) as shelf_life_days,
    COALESCE(pslo.override_storage_condition, pt.default_storage_condition) as effective_storage_condition,
    pt.default_shelf_life_days,
    pt.default_storage_condition,
    u.name as seller_name,
    u.email as seller_email,
    ST_X(p.location::geometry) as longitude,
    ST_Y(p.location::geometry) as latitude
FROM products p
JOIN product_types pt ON p.product_type_id = pt.id
JOIN users u ON p.seller_id = u.id
LEFT JOIN product_shelf_life_overrides pslo ON (pslo.seller_id = p.seller_id AND pslo.product_type_id = pt.id);

-- Recreate active products view
CREATE OR REPLACE VIEW products_active AS
SELECT * FROM products_enriched
WHERE status = 'active';

-- ============================================
-- 4. MIGRATION HELPER QUERIES
-- ============================================

-- Mark existing USDA product types
UPDATE product_types SET source = 'usda' WHERE source IS NULL;

-- Mark common USDA types as available in Philippines (optional convenience)
UPDATE product_types 
SET is_available_in_philippines = true 
WHERE name IN (
    'Buttermilk', 'Cheese', 'Eggs', 'Milk', 'Yogurt',
    'Chicken', 'Pork', 'Beef',
    'Apples', 'Bananas', 'Oranges', 'Mango', 'Papaya',
    'Broccoli', 'Carrots', 'Lettuce', 'Tomatoes', 'Onions', 'Garlic',
    'Beans', 'Peas'
);

-- ============================================
-- COMPLETED: 009_hybrid_product_types.sql
-- ============================================
