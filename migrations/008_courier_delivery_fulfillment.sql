-- Migration 008: Courier/Rider and Hybrid Fulfillment
-- Date: 2026-03-30
-- Description: Adds rider role, delivery workflow tables, notifications, and SLA telemetry support

-- 1) Extend users.type to support rider
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_type_check;

ALTER TABLE users
ADD CONSTRAINT users_type_check
CHECK (type IN ('buyer', 'seller', 'both', 'rider'));

-- 2) Rider profile settings (availability + earnings model)
CREATE TABLE IF NOT EXISTS rider_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_available BOOLEAN NOT NULL DEFAULT true,
  base_fee DECIMAL(10, 2) NOT NULL DEFAULT 35.00 CHECK (base_fee >= 0),
  percentage_rate DECIMAL(6, 4) NOT NULL DEFAULT 0.0500 CHECK (percentage_rate >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_rider_profiles_updated_at
  BEFORE UPDATE ON rider_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3) Deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id SERIAL PRIMARY KEY,
  order_id INTEGER UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_rider_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

  fulfillment_type VARCHAR(20) NOT NULL CHECK (fulfillment_type IN ('in_house', 'third_party')),
  third_party_provider VARCHAR(100),
  third_party_tracking_ref VARCHAR(255),

  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (
    status IN ('available', 'assigned', 'accepted', 'declined', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled')
  ),

  eta_at TIMESTAMP,
  accepted_at TIMESTAMP,
  picked_up_at TIMESTAMP,
  in_transit_at TIMESTAMP,
  delivered_at TIMESTAMP,
  failed_at TIMESTAMP,

  buyer_address_snapshot TEXT,
  seller_address_snapshot TEXT,
  proof_photo_url TEXT,
  failure_reason TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_seller_id ON deliveries(seller_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_buyer_id ON deliveries(buyer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_assigned_rider_id ON deliveries(assigned_rider_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_fulfillment_type ON deliveries(fulfillment_type);
CREATE INDEX IF NOT EXISTS idx_deliveries_eta_at ON deliveries(eta_at);

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4) Rider live location updates (manual + auto)
CREATE TABLE IF NOT EXISTS delivery_location_updates (
  id SERIAL PRIMARY KEY,
  delivery_id INTEGER NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  rider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location GEOMETRY(Point, 4326) NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'auto')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_location_updates_delivery_id ON delivery_location_updates(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_location_updates_rider_id ON delivery_location_updates(rider_id);
CREATE INDEX IF NOT EXISTS idx_delivery_location_updates_created_at ON delivery_location_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_location_updates_location ON delivery_location_updates USING GIST(location);

-- 5) Delivery timeline events
CREATE TABLE IF NOT EXISTS delivery_events (
  id SERIAL PRIMARY KEY,
  delivery_id INTEGER NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  event_note TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_events_delivery_id ON delivery_events(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_events_event_type ON delivery_events(event_type);
CREATE INDEX IF NOT EXISTS idx_delivery_events_created_at ON delivery_events(created_at DESC);

-- 6) In-app delivery notifications
CREATE TABLE IF NOT EXISTS delivery_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivery_id INTEGER NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_notifications_user_id ON delivery_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_delivery_id ON delivery_notifications(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_read_at ON delivery_notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_created_at ON delivery_notifications(created_at DESC);
