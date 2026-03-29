/**
 * Payment Reconciliation Service
 * Compares order payment state vs payment attempt state and records reconciliation runs.
 */

const { query } = require('../config/database');

class PaymentReconciliationService {
  async run({ sellerId, triggeredBy, autoFix = false }) {
    const scopedFilter = sellerId ? 'WHERE o.seller_id = $1' : '';
    const params = sellerId ? [sellerId] : [];

    const result = await query(`
      WITH latest_attempt AS (
        SELECT DISTINCT ON (pa.order_id)
          pa.order_id,
          pa.id,
          pa.status,
          pa.provider,
          pa.updated_at
        FROM payment_attempts pa
        ORDER BY pa.order_id, pa.updated_at DESC, pa.id DESC
      )
      SELECT
        o.id AS order_id,
        o.seller_id,
        o.payment_status AS order_payment_status,
        o.payment_method,
        la.id AS latest_attempt_id,
        la.status AS latest_attempt_status,
        la.provider AS latest_attempt_provider
      FROM orders o
      LEFT JOIN latest_attempt la ON la.order_id = o.id
      ${scopedFilter}
      ORDER BY o.id DESC
      LIMIT 1000
    `, params);

    const rows = result.rows;
    const mismatches = [];
    let fixedCount = 0;

    for (const row of rows) {
      const orderStatus = String(row.order_payment_status || '').toLowerCase();
      const attemptStatus = String(row.latest_attempt_status || '').toLowerCase();

      if (row.payment_method === 'gcash' && !row.latest_attempt_id) {
        mismatches.push({
          type: 'missing_attempt',
          order_id: row.order_id,
          order_status: orderStatus,
          attempt_status: null,
        });
        continue;
      }

      if (!attemptStatus) {
        continue;
      }

      const equivalent =
        (orderStatus === 'paid' && ['captured', 'paid'].includes(attemptStatus))
        || (orderStatus === 'captured' && ['captured', 'paid'].includes(attemptStatus))
        || orderStatus === attemptStatus;

      if (!equivalent) {
        mismatches.push({
          type: 'status_mismatch',
          order_id: row.order_id,
          order_status: orderStatus,
          attempt_status: attemptStatus,
        });

        if (autoFix) {
          const target = ['captured', 'paid'].includes(attemptStatus) ? 'captured' : attemptStatus;

          await query(`
            UPDATE orders
            SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [target, row.order_id]);

          fixedCount += 1;
        }
      }
    }

    const runRecord = await query(`
      INSERT INTO payment_reconciliation_runs (
        triggered_by, scope, seller_id,
        scanned_orders, mismatches_found, fixed_count, details
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6, $7
      )
      RETURNING *
    `, [
      triggeredBy || null,
      sellerId ? 'seller' : 'all',
      sellerId || null,
      rows.length,
      mismatches.length,
      fixedCount,
      { mismatches },
    ]);

    return {
      scanned: rows.length,
      mismatches,
      fixedCount,
      run: runRecord.rows[0],
    };
  }
}

module.exports = new PaymentReconciliationService();
