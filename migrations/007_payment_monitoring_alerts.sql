-- Migration 007: Payment Monitoring and Alerts
-- Date: 2026-03-29
-- Description: Adds webhook event telemetry and payment alert records

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id SERIAL PRIMARY KEY,
  source VARCHAR(64) NOT NULL,
  event_name VARCHAR(128),
  result VARCHAR(32) NOT NULL CHECK (result IN ('processed', 'ignored', 'failed', 'unauthorized', 'misconfigured')),
  http_status INTEGER NOT NULL,
  message TEXT,
  payload JSONB,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_received_at
  ON payment_webhook_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_source
  ON payment_webhook_events(source);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_result
  ON payment_webhook_events(result);

CREATE TABLE IF NOT EXISTS payment_alerts (
  id SERIAL PRIMARY KEY,
  alert_type VARCHAR(64) NOT NULL,
  severity VARCHAR(16) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  details JSONB,
  status VARCHAR(16) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  acknowledged_by INTEGER REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_alerts_status_created
  ON payment_alerts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_alerts_alert_type
  ON payment_alerts(alert_type);

CREATE TRIGGER update_payment_alerts_updated_at
  BEFORE UPDATE ON payment_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
