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
  processPayment,
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
    .isIn(['cash', 'gcash', 'card'])
    .withMessage('Payment method must be cash, gcash, or card')
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
  asyncHandler(processPayment)
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