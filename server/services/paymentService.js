/**
 * Payment Service
 * Production-oriented payment orchestration with idempotency + multi-attempt tracking.
 */

const PaymentAttempt = require('../models/PaymentAttempt');
const Order = require('../models/Order');
const Refund = require('../models/Refund');
const xenditService = require('./xenditService');

const ENABLE_PAYMENT_COD = (process.env.ENABLE_PAYMENT_COD || 'true') === 'true';
const ENABLE_PAYMENT_GCASH = (process.env.ENABLE_PAYMENT_GCASH || 'true') === 'true';

class PaymentService {
  getSupportedMethods() {
    const methods = [];

    if (ENABLE_PAYMENT_GCASH) {
      methods.push({
        id: 'gcash',
        name: 'GCash',
        description: 'Pay using GCash e-wallet',
        provider: 'xendit',
        live: (process.env.ENABLE_PAYMENT_XENDIT || 'false') === 'true',
      });
    }

    if (ENABLE_PAYMENT_COD) {
      methods.push({
        id: 'cash',
        name: 'Cash on Delivery',
        description: 'Pay with cash upon delivery (manual confirmation)',
        provider: 'manual',
        live: true,
      });
    }

    return methods;
  }

  isMethodSupported(method) {
    return this.getSupportedMethods().some((m) => m.id === method);
  }

  _mapProviderStatusToOrderStatus(status) {
    const normalized = String(status || '').toLowerCase();

    if (normalized === 'captured' || normalized === 'paid') {
      return 'captured';
    }

    if (normalized === 'authorized') {
      return 'authorized';
    }

    if (normalized === 'refunded') {
      return 'refunded';
    }

    if (normalized === 'failed') {
      return 'failed';
    }

    return 'pending';
  }

  async processOrderPayment({ order, buyer, idempotencyKey, successRedirectUrl, failureRedirectUrl }) {
    const existingAttempt = await PaymentAttempt.findByOrderAndIdempotency(order.id, idempotencyKey);

    if (existingAttempt) {
      const refreshedOrder = await Order.getById(order.id);
      return {
        reused: true,
        order: refreshedOrder,
        attempt: existingAttempt,
        checkoutUrl: existingAttempt.response_payload?.actions?.mobile_web_checkout_url
          || existingAttempt.response_payload?.actions?.desktop_web_checkout_url
          || existingAttempt.response_payload?.actions?.mobile_deeplink_checkout_url
          || existingAttempt.response_payload?.checkout_url
          || null,
      };
    }

    if (order.payment_method === 'cash') {
      const codAttempt = await PaymentAttempt.create({
        order_id: order.id,
        provider: 'manual',
        payment_method: 'cash',
        idempotency_key: idempotencyKey,
        amount: Number(order.total_amount),
        currency: 'PHP',
        status: 'pending',
        request_payload: { source: 'cod_manual_flow' },
        response_payload: { message: 'Awaiting manual payment collection.' },
      });

      const updatedOrder = await Order.updatePaymentStatus(order.id, 'pending', null, {
        paymentProvider: 'manual',
      });

      return {
        reused: false,
        order: updatedOrder,
        attempt: codAttempt,
        checkoutUrl: null,
      };
    }

    if (order.payment_method !== 'gcash') {
      throw new Error(`Payment method ${order.payment_method} is not supported for production flow.`);
    }

    const referenceId = `order_${order.id}_${Date.now()}`;

    const result = await xenditService.createPaymentRequest({
      amount: Number(order.total_amount),
      currency: 'PHP',
      referenceId,
      idempotencyKey,
      customer: buyer,
      successRedirectUrl,
      failureRedirectUrl,
      metadata: {
        order_id: order.id,
        buyer_id: order.buyer_id,
        seller_id: order.seller_id,
      },
    });

    const orderPaymentStatus = this._mapProviderStatusToOrderStatus(result.status);

    const attempt = await PaymentAttempt.create({
      order_id: order.id,
      provider: 'xendit',
      payment_method: order.payment_method,
      idempotency_key: idempotencyKey,
      payment_request_id: result.paymentRequestId,
      provider_payment_id: result.providerPaymentId,
      external_reference_id: result.referenceId,
      amount: Number(order.total_amount),
      currency: 'PHP',
      status: orderPaymentStatus,
      request_payload: result.requestPayload,
      response_payload: result.raw,
    });

    const updatedOrder = await Order.updatePaymentStatus(order.id, orderPaymentStatus, result.paymentRequestId, {
      paymentProvider: 'xendit',
      externalPaymentId: result.providerPaymentId,
    });

    return {
      reused: false,
      order: updatedOrder,
      attempt,
      checkoutUrl: result.checkoutUrl,
      providerStatus: result.status,
    };
  }

  async handleWebhookEvent({ source, payload }) {
    const event = payload?.event || null;
    const data = payload?.data || {};

    const paymentRequestId = data?.id || data?.payment_request_id || null;
    const providerPaymentId = data?.payment_id || null;

    let attempt = null;

    if (paymentRequestId) {
      attempt = await PaymentAttempt.findByPaymentRequestId(paymentRequestId);
    }

    if (!attempt && providerPaymentId) {
      attempt = await PaymentAttempt.findByProviderPaymentId(providerPaymentId);
    }

    if (!attempt) {
      return {
        handled: false,
        reason: 'payment_attempt_not_found',
        source,
        event,
      };
    }

    const mappedStatus = xenditService.mapWebhookStatus(data?.status);

    const updatePayload = {
      status: mappedStatus,
      provider_payment_id: providerPaymentId || attempt.provider_payment_id,
      webhook_payload: payload,
    };

    if (mappedStatus === 'captured') {
      updatePayload.captured_at = new Date().toISOString();
    }

    if (mappedStatus === 'refunded') {
      updatePayload.refunded_at = new Date().toISOString();
    }

    if (mappedStatus === 'failed') {
      updatePayload.failure_code = data?.failure_code || null;
      updatePayload.failure_message = data?.failure_message || null;
    }

    const updatedAttempt = await PaymentAttempt.updateById(attempt.id, updatePayload);

    const updatedOrder = await Order.updatePaymentStatus(
      attempt.order_id,
      mappedStatus,
      paymentRequestId || attempt.payment_request_id,
      {
        paymentProvider: 'xendit',
        externalPaymentId: providerPaymentId || attempt.provider_payment_id,
      }
    );

    return {
      handled: true,
      source,
      event,
      attempt: updatedAttempt,
      order: updatedOrder,
      mappedStatus,
    };
  }

  async createRefund({ order, amount, reason, requestedBy }) {
    if (!['captured', 'paid'].includes(order.payment_status)) {
      throw new Error('Refund is only allowed for paid/captured orders.');
    }

    const totalAmount = Number(order.total_amount);
    const totalRefunded = await Refund.getTotalRefundedForOrder(order.id);
    const remaining = Math.max(0, totalAmount - totalRefunded);

    const refundAmount = amount === undefined || amount === null
      ? remaining
      : Number(amount);

    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      throw new Error('Refund amount must be greater than 0.');
    }

    if (refundAmount > remaining) {
      throw new Error(`Refund amount exceeds remaining refundable balance (${remaining.toFixed(2)}).`);
    }

    const attempt = await PaymentAttempt.findLatestSuccessfulByOrder(order.id);
    if (!attempt && order.payment_method === 'gcash') {
      throw new Error('No successful payment attempt found for this order.');
    }

    let refundRecord;

    if (order.payment_method === 'cash') {
      refundRecord = await Refund.create({
        order_id: order.id,
        payment_attempt_id: attempt?.id || null,
        provider: 'manual',
        amount: refundAmount,
        currency: 'PHP',
        reason,
        status: 'succeeded',
        requested_by: requestedBy,
        request_payload: { source: 'manual_cod_refund' },
        response_payload: { message: 'COD refund recorded as manual success.' },
      });
    } else {
      const providerRefund = await xenditService.createRefund({
        paymentRequestId: attempt.payment_request_id,
        amount: refundAmount,
        currency: 'PHP',
        reason: reason || 'requested_by_seller',
      });

      refundRecord = await Refund.create({
        order_id: order.id,
        payment_attempt_id: attempt.id,
        provider: 'xendit',
        provider_refund_id: providerRefund?.id || null,
        amount: refundAmount,
        currency: providerRefund?.currency || 'PHP',
        reason,
        status: 'succeeded',
        requested_by: requestedBy,
        request_payload: {
          payment_request_id: attempt.payment_request_id,
          amount: refundAmount,
          reason,
        },
        response_payload: providerRefund,
      });
    }

    const newTotalRefunded = await Refund.getTotalRefundedForOrder(order.id);
    const isFullyRefunded = newTotalRefunded >= totalAmount;

    const updatedOrder = await Order.updatePaymentStatus(
      order.id,
      isFullyRefunded ? 'refunded' : 'captured',
      order.transaction_id,
      {
        paymentProvider: order.payment_provider || (order.payment_method === 'gcash' ? 'xendit' : 'manual'),
        externalPaymentId: order.external_payment_id || null,
      }
    );

    if (attempt && isFullyRefunded) {
      await PaymentAttempt.updateById(attempt.id, {
        status: 'refunded',
        refunded_at: new Date().toISOString(),
      });
    }

    return {
      refund: refundRecord,
      order: updatedOrder,
      refundedAmount: refundAmount,
      totalRefunded: newTotalRefunded,
      remainingRefundable: Math.max(0, totalAmount - newTotalRefunded),
      fullyRefunded: isFullyRefunded,
    };
  }
}

module.exports = new PaymentService();
