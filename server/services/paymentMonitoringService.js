/**
 * Payment Monitoring Service
 * Tracks webhook outcomes and creates alerts for abnormal failure spikes.
 */

const { query } = require('../config/database');

const ENABLE_PAYMENT_ALERTS = (process.env.ENABLE_PAYMENT_ALERTS || 'true') === 'true';

class PaymentMonitoringService {
  _intervalHours(hours) {
    const safeHours = Number.isFinite(Number(hours)) ? Number(hours) : 24;
    return Math.min(Math.max(safeHours, 1), 168);
  }

  async recordWebhookEvent({ source, eventName = null, result, httpStatus, message = null, payload = null }) {
    try {
      await query(
        `INSERT INTO payment_webhook_events (source, event_name, result, http_status, message, payload)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [source, eventName, result, httpStatus, message, payload]
      );

      if (ENABLE_PAYMENT_ALERTS) {
        await this.evaluateFailureAlerts();
      }
    } catch (error) {
      // Avoid breaking checkout/webhook flows if telemetry tables are not ready.
      console.warn('Payment monitoring recordWebhookEvent failed:', error.message);
    }
  }

  async createAlert({ alertType, severity = 'medium', message, details = {} }) {
    if (!ENABLE_PAYMENT_ALERTS) {
      return null;
    }

    const duplicateWindowMinutes = 15;

    const duplicate = await query(
      `SELECT id
       FROM payment_alerts
       WHERE alert_type = $1
         AND status = 'open'
         AND created_at >= NOW() - ($2::text || ' minutes')::interval
       ORDER BY created_at DESC
       LIMIT 1`,
      [alertType, duplicateWindowMinutes]
    );

    if (duplicate.rows[0]) {
      return null;
    }

    const result = await query(
      `INSERT INTO payment_alerts (alert_type, severity, message, details)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [alertType, severity, message, details]
    );

    return result.rows[0];
  }

  async evaluateFailureAlerts() {
    const windowMinutes = 15;

    const webhookFailures = await query(
      `SELECT COUNT(*)::int AS total
       FROM payment_webhook_events
       WHERE result IN ('failed', 'unauthorized', 'misconfigured')
         AND received_at >= NOW() - ($1::text || ' minutes')::interval`,
      [windowMinutes]
    );

    const failedWebhookCount = webhookFailures.rows[0]?.total || 0;
    if (failedWebhookCount >= 3) {
      await this.createAlert({
        alertType: 'webhook_failures_spike',
        severity: failedWebhookCount >= 10 ? 'critical' : 'high',
        message: `Detected ${failedWebhookCount} webhook failures in the last ${windowMinutes} minutes.`,
        details: {
          windowMinutes,
          failedWebhookCount,
        },
      });
    }

    const paymentFailures = await query(
      `SELECT COUNT(*)::int AS total
       FROM payment_attempts
       WHERE status = 'failed'
         AND updated_at >= NOW() - ($1::text || ' minutes')::interval`,
      [windowMinutes]
    );

    const failedPaymentCount = paymentFailures.rows[0]?.total || 0;
    if (failedPaymentCount >= 3) {
      await this.createAlert({
        alertType: 'payment_capture_failures_spike',
        severity: failedPaymentCount >= 10 ? 'critical' : 'high',
        message: `Detected ${failedPaymentCount} failed payment attempts in the last ${windowMinutes} minutes.`,
        details: {
          windowMinutes,
          failedPaymentCount,
        },
      });
    }
  }

  async getSummary({ hours = 24 }) {
    const windowHours = this._intervalHours(hours);

    const totals = await query(
      `SELECT
         COUNT(*)::int AS total_events,
         COUNT(*) FILTER (WHERE result = 'processed')::int AS processed_events,
         COUNT(*) FILTER (WHERE result IN ('failed', 'unauthorized', 'misconfigured'))::int AS failed_events
       FROM payment_webhook_events
       WHERE received_at >= NOW() - ($1::text || ' hours')::interval`,
      [windowHours]
    );

    const bySource = await query(
      `SELECT source, result, COUNT(*)::int AS count
       FROM payment_webhook_events
       WHERE received_at >= NOW() - ($1::text || ' hours')::interval
       GROUP BY source, result
       ORDER BY source, result`,
      [windowHours]
    );

    const paymentFailures = await query(
      `SELECT COUNT(*)::int AS failed_attempts
       FROM payment_attempts
       WHERE status = 'failed'
         AND updated_at >= NOW() - ($1::text || ' hours')::interval`,
      [windowHours]
    );

    const openAlerts = await query(
      `SELECT id, alert_type, severity, message, details, status, created_at
       FROM payment_alerts
       WHERE status = 'open'
       ORDER BY created_at DESC
       LIMIT 25`
    );

    const alertCounts = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'open')::int AS open_count,
         COUNT(*) FILTER (WHERE status = 'acknowledged')::int AS acknowledged_count,
         COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved_count
       FROM payment_alerts`
    );

    return {
      windowHours,
      webhook: {
        totals: totals.rows[0] || {
          total_events: 0,
          processed_events: 0,
          failed_events: 0,
        },
        bySource: bySource.rows,
      },
      paymentFailures: {
        failedAttempts: paymentFailures.rows[0]?.failed_attempts || 0,
      },
      alerts: {
        counts: alertCounts.rows[0] || {
          open_count: 0,
          acknowledged_count: 0,
          resolved_count: 0,
        },
        open: openAlerts.rows,
      },
    };
  }

  async acknowledgeAlert({ alertId, userId }) {
    const result = await query(
      `UPDATE payment_alerts
       SET status = 'acknowledged', acknowledged_by = $2, acknowledged_at = NOW()
       WHERE id = $1
         AND status = 'open'
       RETURNING *`,
      [alertId, userId]
    );

    return result.rows[0] || null;
  }
}

module.exports = new PaymentMonitoringService();
