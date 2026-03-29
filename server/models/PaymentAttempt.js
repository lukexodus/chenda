/**
 * Payment Attempt Model
 * Tracks payment attempts per order with idempotency guarantees.
 */

const { query } = require('../config/database');

class PaymentAttempt {
  static async create(data) {
    const {
      order_id,
      provider,
      payment_method,
      idempotency_key,
      payment_request_id = null,
      provider_payment_id = null,
      external_reference_id = null,
      currency = 'PHP',
      amount,
      status = 'pending',
      request_payload = null,
      response_payload = null,
      webhook_payload = null,
      failure_code = null,
      failure_message = null,
    } = data;

    const result = await query(`
      INSERT INTO payment_attempts (
        order_id, provider, payment_method, idempotency_key,
        payment_request_id, provider_payment_id, external_reference_id,
        currency, amount, status,
        request_payload, response_payload, webhook_payload,
        failure_code, failure_message
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9, $10,
        $11, $12, $13,
        $14, $15
      )
      RETURNING *
    `, [
      order_id,
      provider,
      payment_method,
      idempotency_key,
      payment_request_id,
      provider_payment_id,
      external_reference_id,
      currency,
      amount,
      status,
      request_payload,
      response_payload,
      webhook_payload,
      failure_code,
      failure_message,
    ]);

    return result.rows[0];
  }

  static async findByOrderAndIdempotency(orderId, idempotencyKey) {
    const result = await query(`
      SELECT *
      FROM payment_attempts
      WHERE order_id = $1 AND idempotency_key = $2
      ORDER BY id DESC
      LIMIT 1
    `, [orderId, idempotencyKey]);

    return result.rows[0] || null;
  }

  static async findByPaymentRequestId(paymentRequestId) {
    const result = await query(`
      SELECT *
      FROM payment_attempts
      WHERE payment_request_id = $1
      ORDER BY id DESC
      LIMIT 1
    `, [paymentRequestId]);

    return result.rows[0] || null;
  }

  static async findByProviderPaymentId(providerPaymentId) {
    const result = await query(`
      SELECT *
      FROM payment_attempts
      WHERE provider_payment_id = $1
      ORDER BY id DESC
      LIMIT 1
    `, [providerPaymentId]);

    return result.rows[0] || null;
  }

  static async findLatestSuccessfulByOrder(orderId) {
    const result = await query(`
      SELECT *
      FROM payment_attempts
      WHERE order_id = $1
        AND status IN ('captured', 'paid')
      ORDER BY updated_at DESC, id DESC
      LIMIT 1
    `, [orderId]);

    return result.rows[0] || null;
  }

  static async updateById(attemptId, updates) {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = [
      'status',
      'payment_request_id',
      'provider_payment_id',
      'external_reference_id',
      'response_payload',
      'webhook_payload',
      'failure_code',
      'failure_message',
      'captured_at',
      'refunded_at',
    ];

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        fields.push(`${key} = $${idx}`);
        values.push(updates[key]);
        idx += 1;
      }
    }

    if (fields.length === 0) {
      const existing = await query('SELECT * FROM payment_attempts WHERE id = $1', [attemptId]);
      return existing.rows[0] || null;
    }

    const result = await query(`
      UPDATE payment_attempts
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${idx}
      RETURNING *
    `, [...values, attemptId]);

    return result.rows[0] || null;
  }
}

module.exports = PaymentAttempt;
