/**
 * Xendit Service
 * Handles Payment Requests V3 API operations.
 */

const axios = require('axios');

class XenditService {
  constructor() {
    this.baseUrl = process.env.XENDIT_BASE_URL || 'https://api.xendit.co';
    this.secretKey = process.env.XENDIT_SECRET_KEY || '';
    this.isEnabled = (process.env.ENABLE_PAYMENT_XENDIT || 'false') === 'true';
  }

  _getHeaders(idempotencyKey) {
    const auth = Buffer.from(`${this.secretKey}:`).toString('base64');

    return {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      'api-version': '2022-07-31',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    };
  }

  _ensureConfigured() {
    if (!this.isEnabled) {
      throw new Error('Xendit payment provider is disabled (ENABLE_PAYMENT_XENDIT=false).');
    }

    if (!this.secretKey) {
      throw new Error('XENDIT_SECRET_KEY is not configured.');
    }
  }

  _extractCheckoutUrl(response) {
    return (
      response?.actions?.mobile_web_checkout_url
      || response?.actions?.desktop_web_checkout_url
      || response?.actions?.mobile_deeplink_checkout_url
      || response?.checkout_url
      || null
    );
  }

  _mapStatus(status) {
    const s = String(status || '').toUpperCase();

    if (['SUCCEEDED', 'PAID', 'CAPTURED', 'COMPLETED'].includes(s)) {
      return 'captured';
    }

    if (['AUTHORIZED', 'REQUIRES_ACTION'].includes(s)) {
      return 'authorized';
    }

    if (['FAILED', 'EXPIRED', 'CANCELLED'].includes(s)) {
      return 'failed';
    }

    if (['REFUNDED'].includes(s)) {
      return 'refunded';
    }

    return 'pending';
  }

  async createPaymentRequest(params) {
    this._ensureConfigured();

    const {
      amount,
      currency = 'PHP',
      referenceId,
      idempotencyKey,
      customer,
      successRedirectUrl,
      failureRedirectUrl,
      metadata = {},
    } = params;

    const payload = {
      amount,
      currency,
      reference_id: referenceId,
      payment_method: {
        type: 'EWALLET',
        reusability: 'ONE_TIME_USE',
        ewallet: {
          channel_code: 'PH_GCASH',
          channel_properties: {
            success_return_url: successRedirectUrl,
            failure_return_url: failureRedirectUrl,
          },
        },
      },
      customer: customer ? {
        reference_id: String(customer.id || ''),
        given_names: customer.name || undefined,
        email: customer.email || undefined,
      } : undefined,
      metadata,
    };

    const response = await axios.post(
      `${this.baseUrl}/payment_requests`,
      payload,
      { headers: this._getHeaders(idempotencyKey), timeout: 20000 }
    );

    return {
      provider: 'xendit',
      paymentRequestId: response.data?.id || null,
      providerPaymentId: response.data?.payment_id || null,
      referenceId,
      status: this._mapStatus(response.data?.status),
      checkoutUrl: this._extractCheckoutUrl(response.data),
      raw: response.data,
      requestPayload: payload,
    };
  }

  async createRefund(params) {
    this._ensureConfigured();

    const { paymentRequestId, amount, currency = 'PHP', reason = 'requested_by_customer' } = params;

    const payload = {
      payment_request_id: paymentRequestId,
      amount,
      currency,
      reason,
    };

    const response = await axios.post(
      `${this.baseUrl}/refunds`,
      payload,
      { headers: this._getHeaders(), timeout: 20000 }
    );

    return response.data;
  }

  mapWebhookStatus(status) {
    return this._mapStatus(status);
  }
}

module.exports = new XenditService();
