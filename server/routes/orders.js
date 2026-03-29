/**
 * Order Routes
 * API endpoints for order management and mock payment processing
 */

const express = require('express');
const { body, query } = require('express-validator');
const { isAuthenticated, isBuyer, isSeller } = require('../middleware/authenticate');
const asyncHandler = require('../middleware/asyncHandler');
const {
  createOrder,
  createBatchOrders,
  processPayment,
  createRefund,
  runPaymentReconciliation,
  getPaymentMonitoringSummary,
  acknowledgePaymentAlert,
  getSellerSettlementHistory,
  getSellerPayoutOverview,
  getOrder,
  listOrders,
  updateOrderStatus,
  getPaymentMethods
} = require('../controllers/orderController');

const router = express.Router();

// Validation middleware
const validateCreateOrder = [
  body('product_id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),
  body('quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
  body('payment_method')
    .optional()
    .isIn(['cash', 'gcash'])
    .withMessage('Payment method must be cash or gcash')
];

const validateProcessPayment = [
  body('success_redirect_url')
    .optional()
    .isURL()
    .withMessage('success_redirect_url must be a valid URL'),
  body('failure_redirect_url')
    .optional()
    .isURL()
    .withMessage('failure_redirect_url must be a valid URL')
];

const validateCreateRefund = [
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be greater than 0'),
  body('reason')
    .optional()
    .isString()
    .isLength({ min: 3, max: 255 })
    .withMessage('reason must be 3 to 255 characters')
];

const validateUpdateStatus = [
  body('status')
    .isIn(['pending', 'confirmed', 'completed', 'cancelled'])
    .withMessage('Status must be pending, confirmed, completed, or cancelled')
];

const validateListOrders = [
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'completed', 'cancelled'])
    .withMessage('Status filter must be pending, confirmed, completed, or cancelled'),
  query('role')
    .optional()
    .isIn(['buyer', 'seller'])
    .withMessage('Role must be buyer or seller'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be 0 or greater')
];

// Routes

/**
 * GET /api/orders/payment-methods
 * Get supported payment methods (public information)
 */
router.get('/payment-methods', asyncHandler(getPaymentMethods));

/**
 * POST /api/orders/batch
 * Create multiple orders at once (buyers only)
 */
router.post('/batch',
  isAuthenticated,
  isBuyer,
  asyncHandler(createBatchOrders)
);

/**
 * POST /api/orders
 * Create a new order (buyers only)
 */
router.post('/', 
  isAuthenticated,
  isBuyer,
  validateCreateOrder,
  asyncHandler(createOrder)
);

/**
 * POST /api/orders/:id/payment
 * Process payment for an order (buyer only)
 */
router.post('/:id/payment',
  isAuthenticated,
  isBuyer,
  validateProcessPayment,
  asyncHandler(processPayment)
);

/**
 * POST /api/orders/:id/refunds
 * Create full/partial refund (seller only)
 */
router.post('/:id/refunds',
  isAuthenticated,
  isSeller,
  validateCreateRefund,
  asyncHandler(createRefund)
);

/**
 * POST /api/orders/reconciliation/run
 * Run payment reconciliation for seller orders
 */
router.post('/reconciliation/run',
  isAuthenticated,
  isSeller,
  asyncHandler(runPaymentReconciliation)
);

/**
 * GET /api/orders/payment-monitoring/summary
 * Get payment monitoring and active alerts
 */
router.get('/payment-monitoring/summary',
  isAuthenticated,
  isSeller,
  asyncHandler(getPaymentMonitoringSummary)
);

/**
 * POST /api/orders/payment-monitoring/alerts/:alertId/ack
 * Acknowledge open payment alert
 */
router.post('/payment-monitoring/alerts/:alertId/ack',
  isAuthenticated,
  isSeller,
  asyncHandler(acknowledgePaymentAlert)
);

/**
 * GET /api/orders/seller/payments/settlements
 * Seller settlement history with status filtering
 */
router.get('/seller/payments/settlements',
  isAuthenticated,
  isSeller,
  asyncHandler(getSellerSettlementHistory)
);

/**
 * GET /api/orders/seller/payments/overview
 * Seller payout summary and trend
 */
router.get('/seller/payments/overview',
  isAuthenticated,
  isSeller,
  asyncHandler(getSellerPayoutOverview)
);

/**
 * GET /api/orders/:id
 * Get order details by ID (buyer or seller only)
 */
router.get('/:id',
  isAuthenticated,
  asyncHandler(getOrder)
);

/**
 * GET /api/orders
 * List user's orders with filtering and pagination
 */
router.get('/',
  isAuthenticated,
  validateListOrders,
  asyncHandler(listOrders)
);

/**
 * PUT /api/orders/:id/status
 * Update order status (seller only)
 */
router.put('/:id/status',
  isAuthenticated,
  isSeller,
  validateUpdateStatus,
  asyncHandler(updateOrderStatus)
);

module.exports = router;