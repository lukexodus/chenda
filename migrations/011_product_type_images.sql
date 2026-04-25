-- Migration 011: Product Type Images
-- Date: 2026-04-25
-- Description: Adds an image_url column to product_types so each catalog entry
--              (USDA, regional, and custom) can carry a canonical representative photo.
--              Products continue to store their own seller-uploaded image in products.image_url.
--              The type-level image is used as a preview in the product-type picker and
--              as the default product image when the seller hasn't uploaded their own photo.

ALTER TABLE product_types
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Index for any future queries that filter/select only types with images
CREATE INDEX IF NOT EXISTS idx_product_types_has_image
  ON product_types(id) WHERE image_url IS NOT NULL;

-- ============================================
-- COMPLETED: 011_product_type_images.sql
-- ============================================
