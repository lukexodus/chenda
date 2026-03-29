/**
 * Refund Model
 * Stores full/partial refund records for auditable payment flows.
 */

const { query } = require('../config/database');

class Refund {
  static async create(data) {
    const {
      order_id,
      payment_attempt_id = null,
      provider,
      provider_refund_id = null,
      amount,
      currency = 'PHP',
      reason = null,
      status = 'pending',
      failure_code = null,
      failure_message = null,
      requested_by = null,
      request_payload = null,
      response_payload = null,
    } = data;

    const result = await query(`
      INSERT INTO refunds (
        order_id, payment_attempt_id, provider, provider_refund_id,
        amount, currency, reason, status,
        failure_code, failure_message, requested_by,
        request_payload, response_payload
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11,
        $12, $13
      )
      RETURNING *
    `, [
      order_id,
      payment_attempt_id,
      provider,
      provider_refund_id,
      amount,
      currency,
      reason,
      status,
      failure_code,
      failure_message,
      requested_by,
      request_payload,
      response_payload,
    ]);

    return result.rows[0];
  }

  static async getTotalRefundedForOrder(orderId) {
    const result = await query(`
      SELECT COALESCE(SUM(amount), 0) AS total_refunded
      FROM refunds
      WHERE order_id = $1
        AND status = 'succeeded'
    `, [orderId]);

    return Number(result.rows[0]?.total_refunded || 0);
  }

  static async listByOrder(orderId) {
    const result = await query(`
      SELECT *
      FROM refunds
      WHERE order_id = $1
      ORDER BY created_at DESC
    `, [orderId]);

    return result.rows;
  }
}

module.exports = Refund;
