-- Migration 002: Create Spatial Indexes and Optimizations
-- Date: 2026-02-09
-- Description: Adds PostGIS spatial indexes (GIST) and query optimizations

-- ============================================
-- 1. SPATIAL INDEXES (GIST)
-- ============================================

-- Users location spatial index (already created in 001, but ensuring it exists)
DROP INDEX IF EXISTS idx_users_location;
CREATE INDEX idx_users_location ON users USING GIST(location);

-- Products location spatial index (already created in 001, but ensuring it exists)
DROP INDEX IF EXISTS idx_products_location;
CREATE INDEX idx_products_location ON products USING GIST(location);

-- Advanced spatial index for active products only (partial index)
CREATE INDEX idx_products_active_location_gist ON products USING GIST(location)
WHERE status = 'active';

-- ============================================
-- 2. HELPER FUNCTIONS FOR DISTANCE QUERIES
-- ============================================

-- Function: Calculate distance between two points in kilometers
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 DOUBLE PRECISION,
    lng1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lng2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
BEGIN
    RETURN ST_Distance(
        ST_SetSRID(ST_MakePoint(lng1, lat1), 4326)::geography,
        ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)::geography
    ) / 1000.0; -- Convert meters to kilometers
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Get products within radius
CREATE OR REPLACE FUNCTION get_products_within_radius(
    buyer_lat DOUBLE PRECISION,
    buyer_lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
    product_id INTEGER,
    distance_km DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        ST_Distance(
            ST_SetSRID(ST_MakePoint(buyer_lng, buyer_lat), 4326)::geography,
            p.location::geography
        ) / 1000.0 as distance_km
    FROM products p
    WHERE 
        p.status = 'active'
        AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(buyer_lng, buyer_lat), 4326)::geography,
            p.location::geography,
            radius_km * 1000 -- Convert km to meters
        )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate remaining shelf life percentage
CREATE OR REPLACE FUNCTION calculate_shelf_life_percent(
    total_shelf_life INTEGER,
    days_used INTEGER
)
RETURNS DOUBLE PRECISION AS $$
BEGIN
    IF total_shelf_life <= 0 THEN
        RETURN 0;
    END IF;
    
    IF days_used >= total_shelf_life THEN
        RETURN 0;
    END IF;
    
    RETURN ((total_shelf_life - days_used)::DOUBLE PRECISION / total_shelf_life) * 100.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Calculate expiration date
CREATE OR REPLACE FUNCTION calculate_expiration_date(
    listed_date TIMESTAMP,
    total_shelf_life INTEGER,
    days_used INTEGER
)
RETURNS TIMESTAMP AS $$
BEGIN
    RETURN listed_date + INTERVAL '1 day' * (total_shelf_life - days_used);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Check if product is expired
CREATE OR REPLACE FUNCTION is_product_expired(
    listed_date TIMESTAMP,
    total_shelf_life INTEGER,
    days_used INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN calculate_expiration_date(listed_date, total_shelf_life, days_used) < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 3. MATERIALIZED VIEW FOR SEARCH OPTIMIZATION
-- ============================================

-- Materialized view: Products with pre-calculated metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS products_search_cache AS
SELECT 
    p.id,
    p.seller_id,
    p.product_type_id,
    p.days_already_used,
    p.listed_date,
    p.price,
    p.quantity,
    p.unit,
    p.location,
    p.address,
    p.storage_condition,
    p.description,
    p.image_url,
    p.status,
    pt.name as product_name,
    pt.name_subtitle as product_subtitle,
    pt.default_shelf_life_days,
    pt.default_storage_condition,
    pt.keywords,
    u.name as seller_name,
    u.email as seller_email,
    ST_X(p.location::geometry) as longitude,
    ST_Y(p.location::geometry) as latitude,
    -- Pre-calculated shelf life metrics
    calculate_shelf_life_percent(pt.default_shelf_life_days, p.days_already_used) as freshness_percent,
    calculate_expiration_date(p.listed_date, pt.default_shelf_life_days, p.days_already_used) as expiration_date,
    (pt.default_shelf_life_days - p.days_already_used) as remaining_days,
    is_product_expired(p.listed_date, pt.default_shelf_life_days, p.days_already_used) as is_expired
FROM products p
JOIN product_types pt ON p.product_type_id = pt.id
JOIN users u ON p.seller_id = u.id
WHERE p.status = 'active';

-- Indexes on materialized view
CREATE INDEX idx_products_search_cache_location ON products_search_cache USING GIST(location);
CREATE INDEX idx_products_search_cache_freshness ON products_search_cache(freshness_percent DESC);
CREATE INDEX idx_products_search_cache_price ON products_search_cache(price);
CREATE INDEX idx_products_search_cache_expiration ON products_search_cache(expiration_date);
CREATE INDEX idx_products_search_cache_expired ON products_search_cache(is_expired);
CREATE INDEX idx_products_search_cache_name ON products_search_cache USING GIN(to_tsvector('english', product_name));

-- Function to refresh search cache
CREATE OR REPLACE FUNCTION refresh_products_search_cache()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY products_search_cache;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. OPTIMIZED SEARCH QUERY FUNCTION
-- ============================================

-- Main search function that mimics the JavaScript algorithm
CREATE OR REPLACE FUNCTION search_products(
    buyer_lat DOUBLE PRECISION,
    buyer_lng DOUBLE PRECISION,
    max_radius_km DOUBLE PRECISION DEFAULT 50,
    min_freshness_percent DOUBLE PRECISION DEFAULT 0,
    proximity_weight DOUBLE PRECISION DEFAULT 0.5,
    freshness_weight DOUBLE PRECISION DEFAULT 0.5,
    search_mode VARCHAR(20) DEFAULT 'ranking',
    sort_by VARCHAR(20) DEFAULT 'score',
    sort_order VARCHAR(4) DEFAULT 'desc'
)
RETURNS TABLE (
    product_id INTEGER,
    product_name VARCHAR(255),
    product_subtitle TEXT,
    seller_name VARCHAR(255),
    price DECIMAL(10, 2),
    quantity DECIMAL(10, 2),
    unit VARCHAR(50),
    distance_km DOUBLE PRECISION,
    freshness_percent DOUBLE PRECISION,
    remaining_days INTEGER,
    expiration_date TIMESTAMP,
    proximity_score DOUBLE PRECISION,
    freshness_score DOUBLE PRECISION,
    combined_score DOUBLE PRECISION,
    rank INTEGER,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address TEXT,
    description TEXT,
    image_url TEXT,
    storage_condition VARCHAR(50)
) AS $$
DECLARE
    max_distance DOUBLE PRECISION;
BEGIN
    -- Calculate max distance for normalization
    SELECT MAX(ST_Distance(
        ST_SetSRID(ST_MakePoint(buyer_lng, buyer_lat), 4326)::geography,
        location::geography
    )) / 1000.0 INTO max_distance
    FROM products_search_cache
    WHERE is_expired = FALSE
    AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(buyer_lng, buyer_lat), 4326)::geography,
        location::geography,
        max_radius_km * 1000
    );
    
    -- If no products found, set max_distance to 1 to avoid division by zero
    IF max_distance IS NULL OR max_distance = 0 THEN
        max_distance := 1;
    END IF;
    
    RETURN QUERY
    WITH enriched_products AS (
        SELECT 
            p.id,
            p.product_name,
            p.product_subtitle,
            p.seller_name,
            p.price,
            p.quantity,
            p.unit,
            ST_Distance(
                ST_SetSRID(ST_MakePoint(buyer_lng, buyer_lat), 4326)::geography,
                p.location::geography
            ) / 1000.0 as dist_km,
            p.freshness_percent,
            p.remaining_days,
            p.expiration_date,
            p.latitude,
            p.longitude,
            p.address,
            p.description,
            p.image_url,
            p.storage_condition,
            -- Normalize proximity score (closer = higher score)
            CASE 
                WHEN max_distance > 0 THEN
                    100 * (1 - (ST_Distance(
                        ST_SetSRID(ST_MakePoint(buyer_lng, buyer_lat), 4326)::geography,
                        p.location::geography
                    ) / 1000.0 / max_distance))
                ELSE 100
            END as prox_score,
            -- Freshness score is already 0-100
            p.freshness_percent as fresh_score
        FROM products_search_cache p
        WHERE 
            p.is_expired = FALSE
            AND ST_DWithin(
                ST_SetSRID(ST_MakePoint(buyer_lng, buyer_lat), 4326)::geography,
                p.location::geography,
                max_radius_km * 1000
            )
            AND p.freshness_percent >= min_freshness_percent
    ),
    scored_products AS (
        SELECT 
            *,
            (proximity_weight * prox_score + freshness_weight * fresh_score) as comb_score
        FROM enriched_products
    )
    SELECT 
        sp.id,
        sp.product_name,
        sp.product_subtitle,
        sp.seller_name,
        sp.price,
        sp.quantity,
        sp.unit,
        sp.dist_km,
        sp.freshness_percent,
        sp.remaining_days,
        sp.expiration_date,
        sp.prox_score,
        sp.fresh_score,
        sp.comb_score,
        ROW_NUMBER() OVER (
            ORDER BY 
                CASE WHEN sort_order = 'desc' THEN
                    CASE sort_by
                        WHEN 'score' THEN sp.comb_score
                        WHEN 'price' THEN sp.price
                        WHEN 'distance' THEN sp.dist_km
                        WHEN 'freshness' THEN sp.freshness_percent
                    END
                END DESC,
                CASE WHEN sort_order = 'asc' THEN
                    CASE sort_by
                        WHEN 'score' THEN sp.comb_score
                        WHEN 'price' THEN sp.price
                        WHEN 'distance' THEN sp.dist_km
                        WHEN 'freshness' THEN sp.freshness_percent
                    END
                END ASC
        )::INTEGER as rank,
        sp.latitude,
        sp.longitude,
        sp.address,
        sp.description,
        sp.image_url,
        sp.storage_condition
    FROM scored_products sp;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. PERFORMANCE ANALYSIS FUNCTIONS
-- ============================================

-- Function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_search_performance()
RETURNS TABLE (
    index_name TEXT,
    table_name TEXT,
    index_size TEXT,
    table_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        indexrelname::TEXT as index_name,
        tablename::TEXT as table_name,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY pg_relation_size(indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMPLETED: 002_create_indexes.sql
-- ============================================
