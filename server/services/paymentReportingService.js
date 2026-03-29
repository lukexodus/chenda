/**
 * Payment Reporting Service
 * Seller-focused settlement history and payout overview.
 */

const { query } = require('../config/database');

class PaymentReportingService {
  _normalizeStatus(status) {
    const allowed = new Set([
      'all',
      'captured',
      'partially_refunded',
      'fully_refunded',
      'pending',
      'failed',
    ]);

    const normalized = String(status || 'all').toLowerCase();
    return allowed.has(normalized) ? normalized : 'all';
  }

  _clamp(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return fallback;
    }
    return Math.min(Math.max(n, min), max);
  }

  async getSellerSettlementHistory({ sellerId, status = 'all', limit = 50, offset = 0 }) {
    const normalizedStatus = this._normalizeStatus(status);
    const safeLimit = this._clamp(limit, 1, 200, 50);
    const safeOffset = this._clamp(offset, 0, 100000, 0);

    const settlementsSql = `
      WITH refund_totals AS (
        SELECT order_id, COALESCE(SUM(amount), 0) AS total_refunded
        FROM refunds
        WHERE status = 'succeeded'
        GROUP BY order_id
      ),
      settlements AS (
        SELECT
          o.id AS order_id,
          o.created_at,
          o.payment_method,
          o.payment_status,
          o.order_status,
          o.total_amount,
          COALESCE(rt.total_refunded, 0) AS total_refunded,
          GREATEST(COALESCE(o.total_amount, 0) - COALESCE(rt.total_refunded, 0), 0) AS net_settlement,
          CASE
            WHEN COALESCE(rt.total_refunded, 0) >= COALESCE(o.total_amount, 0)
              OR o.payment_status = 'refunded' THEN 'fully_refunded'
            WHEN COALESCE(rt.total_refunded, 0) > 0 THEN 'partially_refunded'
            WHEN o.payment_status IN ('captured', 'paid') THEN 'captured'
            WHEN o.payment_status = 'failed' THEN 'failed'
            ELSE 'pending'
          END AS settlement_status,
          u_buyer.name AS buyer_name,
          pt.name AS product_name
        FROM orders o
        INNER JOIN users u_buyer ON o.buyer_id = u_buyer.id
        INNER JOIN products p ON o.product_id = p.id
        INNER JOIN product_types pt ON p.product_type_id = pt.id
        LEFT JOIN refund_totals rt ON rt.order_id = o.id
        WHERE o.seller_id = $1
          AND o.payment_method IN ('cash', 'gcash')
      )
      SELECT *
      FROM settlements
      WHERE ($2 = 'all' OR settlement_status = $2)
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4;
    `;

    const countSql = `
      WITH refund_totals AS (
        SELECT order_id, COALESCE(SUM(amount), 0) AS total_refunded
        FROM refunds
        WHERE status = 'succeeded'
        GROUP BY order_id
      ),
      settlements AS (
        SELECT
          CASE
            WHEN COALESCE(rt.total_refunded, 0) >= COALESCE(o.total_amount, 0)
              OR o.payment_status = 'refunded' THEN 'fully_refunded'
            WHEN COALESCE(rt.total_refunded, 0) > 0 THEN 'partially_refunded'
            WHEN o.payment_status IN ('captured', 'paid') THEN 'captured'
            WHEN o.payment_status = 'failed' THEN 'failed'
            ELSE 'pending'
          END AS settlement_status
        FROM orders o
        LEFT JOIN refund_totals rt ON rt.order_id = o.id
        WHERE o.seller_id = $1
          AND o.payment_method IN ('cash', 'gcash')
      )
      SELECT COUNT(*)::int AS total
      FROM settlements
      WHERE ($2 = 'all' OR settlement_status = $2);
    `;

    const [settlementsResult, countResult] = await Promise.all([
      query(settlementsSql, [sellerId, normalizedStatus, safeLimit, safeOffset]),
      query(countSql, [sellerId, normalizedStatus]),
    ]);

    return {
      settlements: settlementsResult.rows,
      total: countResult.rows[0]?.total || 0,
      limit: safeLimit,
      offset: safeOffset,
      status: normalizedStatus,
    };
  }

  async getSellerPayoutOverview({ sellerId, days = 30 }) {
    const safeDays = this._clamp(days, 1, 180, 30);

    const overviewSql = `
      WITH refund_totals AS (
        SELECT order_id, COALESCE(SUM(amount), 0) AS total_refunded
        FROM refunds
        WHERE status = 'succeeded'
        GROUP BY order_id
      ),
      settlements AS (
        SELECT
          o.id,
          o.created_at,
          o.total_amount,
          COALESCE(rt.total_refunded, 0) AS total_refunded,
          GREATEST(COALESCE(o.total_amount, 0) - COALESCE(rt.total_refunded, 0), 0) AS net_settlement,
          CASE
            WHEN COALESCE(rt.total_refunded, 0) >= COALESCE(o.total_amount, 0)
              OR o.payment_status = 'refunded' THEN 'fully_refunded'
            WHEN COALESCE(rt.total_refunded, 0) > 0 THEN 'partially_refunded'
            WHEN o.payment_status IN ('captured', 'paid') THEN 'captured'
            WHEN o.payment_status = 'failed' THEN 'failed'
            ELSE 'pending'
          END AS settlement_status
        FROM orders o
        LEFT JOIN refund_totals rt ON rt.order_id = o.id
        WHERE o.seller_id = $1
          AND o.payment_method IN ('cash', 'gcash')
      )
      SELECT
        COUNT(*)::int AS total_orders,
        COALESCE(SUM(total_amount), 0)::numeric(12,2) AS gross_amount,
        COALESCE(SUM(total_refunded), 0)::numeric(12,2) AS refunded_amount,
        COALESCE(SUM(net_settlement), 0)::numeric(12,2) AS net_amount,
        COUNT(*) FILTER (WHERE settlement_status = 'captured')::int AS captured_orders,
        COUNT(*) FILTER (WHERE settlement_status = 'partially_refunded')::int AS partially_refunded_orders,
        COUNT(*) FILTER (WHERE settlement_status = 'fully_refunded')::int AS fully_refunded_orders,
        COUNT(*) FILTER (WHERE settlement_status = 'pending')::int AS pending_orders,
        COUNT(*) FILTER (WHERE settlement_status = 'failed')::int AS failed_orders
      FROM settlements;
    `;

    const trendSql = `
      WITH refund_totals AS (
        SELECT order_id, COALESCE(SUM(amount), 0) AS total_refunded
        FROM refunds
        WHERE status = 'succeeded'
        GROUP BY order_id
      ),
      settlements AS (
        SELECT
          DATE_TRUNC('day', o.created_at)::date AS day,
          o.total_amount,
          COALESCE(rt.total_refunded, 0) AS total_refunded,
          GREATEST(COALESCE(o.total_amount, 0) - COALESCE(rt.total_refunded, 0), 0) AS net_settlement
        FROM orders o
        LEFT JOIN refund_totals rt ON rt.order_id = o.id
        WHERE o.seller_id = $1
          AND o.payment_method IN ('cash', 'gcash')
          AND o.created_at >= NOW() - ($2::text || ' days')::interval
      )
      SELECT
        day,
        COUNT(*)::int AS orders,
        COALESCE(SUM(total_amount), 0)::numeric(12,2) AS gross_amount,
        COALESCE(SUM(total_refunded), 0)::numeric(12,2) AS refunded_amount,
        COALESCE(SUM(net_settlement), 0)::numeric(12,2) AS net_amount
      FROM settlements
      GROUP BY day
      ORDER BY day DESC
      LIMIT 31;
    `;

    const [overviewResult, trendResult] = await Promise.all([
      query(overviewSql, [sellerId]),
      query(trendSql, [sellerId, safeDays]),
    ]);

    return {
      days: safeDays,
      overview: overviewResult.rows[0],
      trend: trendResult.rows,
    };
  }
}

module.exports = new PaymentReportingService();
