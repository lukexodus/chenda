-- Migration 006: Refunds and Reconciliation Tracking
-- Date: 2026-03-29
-- Description: Adds refund ledger and reconciliation run records

-- ============================================
-- 1. REFUNDS LEDGER
-- ============================================

CREATE TABLE IF NOT EXISTS refunds (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_attempt_id INTEGER REFERENCES payment_attempts(id) ON DELETE SET NULL,

    provider VARCHAR(30) NOT NULL,
    provider_refund_id VARCHAR(255),

    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'PHP',
    reason VARCHAR(255),

    status VARCHAR(20) NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'succeeded', 'failed')),

    failure_code VARCHAR(100),
    failure_message TEXT,

    requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    request_payload JSONB,
    response_payload JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_attempt_id ON refunds(payment_attempt_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_provider_refund_id ON refunds(provider_refund_id);

CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. RECONCILIATION RUN TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS payment_reconciliation_runs (
    id SERIAL PRIMARY KEY,
    triggered_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    scope VARCHAR(20) NOT NULL DEFAULT 'seller' CHECK (scope IN ('seller', 'all')),
    seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    scanned_orders INTEGER NOT NULL DEFAULT 0,
    mismatches_found INTEGER NOT NULL DEFAULT 0,
    fixed_count INTEGER NOT NULL DEFAULT 0,

    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recon_runs_created_at ON payment_reconciliation_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recon_runs_seller_id ON payment_reconciliation_runs(seller_id);
