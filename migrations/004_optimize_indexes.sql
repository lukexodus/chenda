-- Migration 004: Additional B-tree Indexes for Performance Optimization
-- Date: 2026-03-07
-- Description: Adds composite B-tree indexes on high-frequency query patterns
--              identified from EXPLAIN ANALYZE runs and analytics query shapes.
--              All indexes use CREATE INDEX IF NOT EXISTS so the migration is
--              safe to run multiple times.

-- ============================================
-- 1. ORDERS TABLE
-- ============================================

-- Buyer order history listing  (GET /api/orders?role=buyer)
-- Query shape: WHERE buyer_id = $1 AND order_status = ANY(...) ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_buyer_status_created
    ON orders (buyer_id, order_status, created_at DESC);

-- Seller order listing  (GET /api/orders?role=seller)
-- Query shape: WHERE seller_id = $1 AND order_status = ANY(...) ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_seller_status_created
    ON orders (seller_id, order_status, created_at DESC);

-- Recent orders across the platform (analytics, admin views)
CREATE INDEX IF NOT EXISTS idx_orders_created_desc
    ON orders (created_at DESC);

-- ============================================
-- 2. PRODUCTS TABLE
-- ============================================

-- Seller product listing  (GET /api/products for authenticated seller)
-- Query shape: WHERE seller_id = $1 AND status = $2 ORDER BY listed_date DESC
CREATE INDEX IF NOT EXISTS idx_products_seller_status_listed
    ON products (seller_id, status, listed_date DESC);

-- Expiration-aware queries: find products expiring soon
-- Query shape: WHERE status = 'active' AND listed_date + interval ... < NOW() + interval '3 days'
CREATE INDEX IF NOT EXISTS idx_products_active_listed_date
    ON products (listed_date DESC)
    WHERE status = 'active';

-- ============================================
-- 3. ANALYTICS_EVENTS TABLE
-- ============================================

-- Time-range analytics queries  (GET /api/analytics/algorithm?period=7 days)
-- Query shape: WHERE timestamp >= NOW() - INTERVAL $1 ORDER BY timestamp DESC
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_desc
    ON analytics_events (timestamp DESC);

-- Event-type filtering + time range  (most analytics dashboard queries)
-- Query shape: WHERE event_name = $1 AND timestamp >= $2
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created
    ON analytics_events (event_name, timestamp DESC);

-- Per-user activity queries  (GET /api/analytics/my-activity)
-- Query shape: WHERE user_id = $1 ORDER BY timestamp DESC
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created
    ON analytics_events (user_id, timestamp DESC);

-- ============================================
-- 4. USERS TABLE
-- ============================================

-- Login lookup — Passport LocalStrategy queries by email on every login
-- Query shape: WHERE email = $1 (equality, case-sensitive)
-- Note: a unique index implicitly created by the UNIQUE constraint in 001 already
-- covers this; this is a belt-and-suspenders explicit index in case the constraint
-- was dropped or the column was recreated without it.
CREATE INDEX IF NOT EXISTS idx_users_email_lower
    ON users (lower(email));

-- ============================================
-- 5. SESSIONS TABLE — partial TTL index
-- ============================================

-- connect-pg-simple prunes expired sessions with: WHERE expire < NOW()
-- A partial index on the expire column speeds up the pruning query significantly
-- on large session tables.
CREATE INDEX IF NOT EXISTS idx_session_expire
    ON session (expire)
    WHERE expire IS NOT NULL;

-- ============================================
-- COMPLETED: 004_optimize_indexes.sql
-- ============================================
