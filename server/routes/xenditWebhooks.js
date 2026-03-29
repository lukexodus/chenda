/**
 * Xendit Webhook Routes
 * Development-focused webhook handlers for GCash/eWallet, Invoices, and Payment Requests V3.
 */

const crypto = require('crypto');
const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const paymentService = require('../services/paymentService');
const paymentMonitoringService = require('../services/paymentMonitoringService');

const router = express.Router();

const secureCompare = (a, b) => {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
};

const verifyXenditCallbackToken = (req, res, next) => {
  const expectedToken = process.env.XENDIT_CALLBACK_TOKEN;
  const receivedToken = req.get('x-callback-token');

  if (!expectedToken) {
    paymentMonitoringService.recordWebhookEvent({
      source: 'xendit',
      eventName: req.path,
      result: 'misconfigured',
      httpStatus: 500,
      message: 'XENDIT_CALLBACK_TOKEN is not configured',
      payload: req.body,
    }).catch((error) => console.warn('Webhook monitoring error:', error.message));

    paymentMonitoringService.createAlert({
      alertType: 'xendit_callback_token_missing',
      severity: 'critical',
      message: 'XENDIT_CALLBACK_TOKEN is missing; webhook processing is failing.',
      details: {
        path: req.path,
      },
    }).catch((error) => console.warn('Webhook alert creation error:', error.message));

    return res.status(500).json({
      success: false,
      message: 'XENDIT_CALLBACK_TOKEN is not configured',
    });
  }

  if (!receivedToken || !secureCompare(receivedToken, expectedToken)) {
    console.warn('[XENDIT] Invalid callback token', {
      path: req.path,
      hasToken: Boolean(receivedToken),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

    paymentMonitoringService.recordWebhookEvent({
      source: 'xendit',
      eventName: req.path,
      result: 'unauthorized',
      httpStatus: 401,
      message: 'Invalid x-callback-token',
      payload: req.body,
    }).catch((error) => console.warn('Webhook monitoring error:', error.message));

    return res.status(401).json({
      success: false,
      message: 'Invalid callback token',
    });
  }

  return next();
};

const handleWebhook = (eventName) => asyncHandler(async (req, res) => {
  console.log(`[XENDIT:${eventName}] webhook received`, {
    path: req.originalUrl,
    method: req.method,
    requestId: req.get('x-request-id') || null,
    userAgent: req.get('user-agent') || null,
    receivedAt: new Date().toISOString(),
    payload: req.body,
  });

  try {
    const result = await paymentService.handleWebhookEvent({
      source: eventName,
      payload: req.body,
    });

    if (!result.handled) {
      console.warn(`[XENDIT:${eventName}] webhook accepted but not linked to payment attempt`, result);
    }

    await paymentMonitoringService.recordWebhookEvent({
      source: 'xendit',
      eventName,
      result: result.handled ? 'processed' : 'ignored',
      httpStatus: 200,
      message: result.handled ? 'Webhook processed' : 'Webhook not linked to payment attempt',
      payload: req.body,
    });

    // Acknowledge quickly so Xendit treats delivery as successful.
    return res.status(200).json({
      success: true,
      message: `${eventName} webhook received`,
      handled: Boolean(result.handled),
    });
  } catch (error) {
    await paymentMonitoringService.recordWebhookEvent({
      source: 'xendit',
      eventName,
      result: 'failed',
      httpStatus: 500,
      message: error.message,
      payload: req.body,
    });

    await paymentMonitoringService.createAlert({
      alertType: 'xendit_webhook_processing_error',
      severity: 'high',
      message: `Webhook ${eventName} failed: ${error.message}`,
      details: {
        eventName,
      },
    });

    return res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
    });
  }
});

router.post('/ewallet-payment-status', verifyXenditCallbackToken, handleWebhook('EWALLET_PAYMENT_STATUS'));
router.post('/invoices', verifyXenditCallbackToken, handleWebhook('INVOICES'));
router.post('/payment-requests-v3', verifyXenditCallbackToken, handleWebhook('PAYMENT_REQUESTS_V3'));

module.exports = router;
