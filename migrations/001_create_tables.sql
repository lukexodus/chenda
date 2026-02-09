-- Migration 001: Create Core Tables
-- Date: 2026-02-09
-- Description: Creates Users, Product_Types, Products, Orders, and Analytics_Events tables

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('buyer', 'seller', 'both')),
    
    -- Geospatial location (PostGIS POINT)
    location GEOMETRY(Point, 4326),
    address TEXT,
    
    -- User preferences (JSONB for flexibility)
    preferences JSONB DEFAULT '{
        "proximity_weight": 50,
        "shelf_life_weight": 50,
        "max_radius_km": 50,
        "min_freshness_percent": 0,
        "display_mode": "ranking",
        "storage_condition": "refrigerated"
    }'::jsonb,
    
    -- Email verification (optional feature)
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(type);
CREATE INDEX idx_users_location ON users USING GIST(location);

-- ============================================
-- 2. PRODUCT_TYPES TABLE (USDA FoodKeeper Data)
-- ============================================
CREATE TABLE IF NOT EXISTS product_types (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_subtitle TEXT,
    category_id INTEGER,
    keywords TEXT,
    
    -- Shelf life data
    default_shelf_life_days INTEGER NOT NULL,
    default_storage_condition VARCHAR(50) NOT NULL CHECK (
        default_storage_condition IN (
            'pantry', 'pantry_opened',
            'refrigerated', 'refrigerated_opened',
            'frozen', 'frozen_opened'
        )
    ),
    
    -- USDA source data (JSONB for flexibility)
    shelf_life_source JSONB,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for product_types
CREATE INDEX idx_product_types_name ON product_types(name);
CREATE INDEX idx_product_types_category ON product_types(category_id);
CREATE INDEX idx_product_types_keywords ON product_types USING GIN(to_tsvector('english', keywords));

-- ============================================
-- 3. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_type_id INTEGER NOT NULL REFERENCES product_types(id),
    
    -- Shelf life tracking
    days_already_used INTEGER NOT NULL DEFAULT 0 CHECK (days_already_used >= 0),
    listed_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Pricing and inventory
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL DEFAULT 'pieces',
    
    -- Geospatial location (PostGIS POINT)
    location GEOMETRY(Point, 4326) NOT NULL,
    address TEXT,
    
    -- Storage condition (affects shelf life calculation)
    storage_condition VARCHAR(50) NOT NULL CHECK (
        storage_condition IN (
            'pantry', 'pantry_opened',
            'refrigerated', 'refrigerated_opened',
            'frozen', 'frozen_opened'
        )
    ),
    
    -- Optional fields
    description TEXT,
    image_url TEXT,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'removed')),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for products
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_type ON products(product_type_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_location ON products USING GIST(location);
CREATE INDEX idx_products_listed_date ON products(listed_date);
CREATE INDEX idx_products_storage ON products(storage_condition);

-- Composite index for common queries
CREATE INDEX idx_products_active_location ON products(status, location) WHERE status = 'active';

-- ============================================
-- 4. ORDERS TABLE (Mock Payment System)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    
    -- Order details
    quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    
    -- Payment details (mock)
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'gcash', 'card')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'paid', 'failed', 'refunded')
    ),
    transaction_id VARCHAR(255),
    
    -- Order status
    order_status VARCHAR(20) DEFAULT 'pending' CHECK (
        order_status IN ('pending', 'confirmed', 'completed', 'cancelled')
    ),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes for orders
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_product ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================
-- 5. ANALYTICS_EVENTS TABLE (Optional)
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Event details
    event_name VARCHAR(100) NOT NULL,
    event_properties JSONB,
    
    -- Session tracking
    session_id VARCHAR(255),
    
    -- Metadata
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address INET
);

-- Indexes for analytics
CREATE INDEX idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX idx_analytics_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_properties ON analytics_events USING GIN(event_properties);

-- ============================================
-- 6. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_types_updated_at BEFORE UPDATE ON product_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Products with enriched data
CREATE OR REPLACE VIEW products_enriched AS
SELECT 
    p.*,
    pt.name as product_name,
    pt.name_subtitle as product_subtitle,
    pt.default_shelf_life_days,
    pt.default_storage_condition,
    u.name as seller_name,
    u.email as seller_email,
    ST_X(p.location::geometry) as longitude,
    ST_Y(p.location::geometry) as latitude
FROM products p
JOIN product_types pt ON p.product_type_id = pt.id
JOIN users u ON p.seller_id = u.id;

-- View: Active products only
CREATE OR REPLACE VIEW products_active AS
SELECT * FROM products_enriched
WHERE status = 'active';

-- ============================================
-- COMPLETED: 001_create_tables.sql
-- ============================================
