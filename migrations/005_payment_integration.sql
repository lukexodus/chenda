-- Migration 005: Payment Integration Foundation
-- Date: 2026-03-29
-- Description: Adds production payment lifecycle support and payment attempts table

-- ============================================
-- 1. EXPAND ORDERS PAYMENT STATUS LIFECYCLE
-- ============================================

ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_payment_status_check
CHECK (payment_status IN ('pending', 'authorized', 'captured', 'paid', 'failed', 'refunded'));

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(30) DEFAULT 'internal',
ADD COLUMN IF NOT EXISTS external_payment_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_orders_payment_provider ON orders(payment_provider);
CREATE INDEX IF NOT EXISTS idx_orders_external_payment_id ON orders(external_payment_id);

-- ============================================
-- 2. PAYMENT ATTEMPTS (MULTI-ATTEMPT + IDEMPOTENCY)
-- ============================================

CREATE TABLE IF NOT EXISTS payment_attempts (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    provider VARCHAR(30) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'gcash', 'card')),

    idempotency_key VARCHAR(255) NOT NULL,

    payment_request_id VARCHAR(255),
    provider_payment_id VARCHAR(255),
    external_reference_id VARCHAR(255),

    currency VARCHAR(10) NOT NULL DEFAULT 'PHP',
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),

    status VARCHAR(20) NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'authorized', 'captured', 'paid', 'failed', 'refunded')),

    failure_code VARCHAR(100),
    failure_message TEXT,

    request_payload JSONB,
    response_payload JSONB,
    webhook_payload JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    captured_at TIMESTAMP,
    refunded_at TIMESTAMP,

    CONSTRAINT uniq_order_idempotency UNIQUE (order_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_order_id ON payment_attempts(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON payment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_provider ON payment_attempts(provider);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_payment_request_id ON payment_attempts(payment_request_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_provider_payment_id ON payment_attempts(provider_payment_id);

CREATE TRIGGER update_payment_attempts_updated_at BEFORE UPDATE ON payment_attempts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
