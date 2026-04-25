-- Migration 012: Add Delivery Notes
-- Date: 2026-04-25
-- Description: Adds a delivery_notes column to the orders table so buyers can provide instructions to riders.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
