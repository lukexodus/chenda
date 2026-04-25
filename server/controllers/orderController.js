/**
 * Order Controller
 * Business logic for order management and mock payment processing
 */

const Order = require('../models/Order');
const Product = require('../models/Product');
const paymentService = require('../services/paymentService');
const paymentReconciliationService = require('../services/paymentReconciliationService');
const paymentMonitoringService = require('../services/paymentMonitoringService');
const paymentReportingService = require('../services/paymentReportingService');

/**
 * Create a new order (buyers only)
 * POST /api/orders
 */
const createOrder = async (req, res) => {
  const { product_id, quantity, payment_method = 'cash' } = req.body;
  const buyer_id = req.user.id;

  // Validate input
  if (!product_id) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required'
    });
  }

  if (!quantity || quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Quantity must be greater than 0'
    });
  }

  if (!paymentService.isMethodSupported(payment_method)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment method or method is currently disabled'
    });
  }

  // Check if product exists and is available
  const product = await Product.findById(product_id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  if (product.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Product is not available for purchase'
    });
  }

  if (product.quantity < quantity) {
    return res.status(400).json({
      success: false,
      message: `Insufficient quantity. Only ${product.quantity} ${product.unit} available`
    });
  }

  // Ensure buyer is not purchasing their own product
  if (product.seller_id === buyer_id) {
    return res.status(400).json({
      success: false,
      message: 'Cannot purchase your own product'
    });
  }

  // Calculate order totals
  const unit_price = parseFloat(product.price);
  const total_amount = unit_price * quantity;

  // Create order
  const orderData = {
    buyer_id,
    seller_id: product.seller_id,
    product_id,
    quantity: parseFloat(quantity),
    unit_price,
    total_amount,
    payment_method,
    delivery_notes: req.body.delivery_notes || null
  };

  const order = await Order.create(orderData);

  // Get order details for response
  const orderDetails = await Order.getById(order.id);

  // Track order creation analytics
  if (req.analytics) {
    req.analytics.track('order_created', {
      order_id: orderDetails.id,
      product_id: orderDetails.product_id,
      seller_id: orderDetails.seller_id,
      buyer_id: orderDetails.buyer_id,
      quantity: orderDetails.quantity,
      unit_price: orderDetails.unit_price,
      total_amount: orderDetails.total_amount,
      payment_method: orderDetails.payment_method
    }, buyer_id).catch(err => console.error('Order creation analytics error:', err));
  }

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    order: orderDetails
  });
};

/**
 * Process payment for an order
 * POST /api/orders/:id/payment
 */
const processPayment = async (req, res) => {
  const orderId = parseInt(req.params.id);
  const userId = req.user.id;
  const idempotencyKey = req.get('Idempotency-Key');

  if (!idempotencyKey) {
    return res.status(400).json({
      success: false,
      message: 'Idempotency-Key header is required',
    });
  }

  // Check if order exists and user can pay for it
  const order = await Order.getById(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Only buyer can pay for the order
  if (order.buyer_id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Only the buyer can pay for this order'
    });
  }

  // Check order status
  if (['paid', 'captured'].includes(order.payment_status)) {
    return res.status(400).json({
      success: false,
      message: 'Order has already been paid'
    });
  }

  if (order.order_status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Cannot pay for a cancelled order'
    });
  }

  try {
    const paymentResult = await paymentService.processOrderPayment({
      order,
      buyer: {
        id: order.buyer_id,
        name: order.buyer_name,
        email: order.buyer_email,
      },
      idempotencyKey,
      successRedirectUrl: req.body?.success_redirect_url,
      failureRedirectUrl: req.body?.failure_redirect_url,
    });

    res.json({
      success: true,
      message: paymentResult.reused ? 'Payment attempt reused (idempotent request)' : 'Payment request created',
      payment: {
        idempotencyKey,
        checkoutUrl: paymentResult.checkoutUrl,
        attempt: paymentResult.attempt,
        reused: paymentResult.reused,
      },
      order: paymentResult.order,
    });
  } catch (error) {
    console.error('Payment processing error:', error);

    await paymentMonitoringService.createAlert({
      alertType: 'payment_processing_exception',
      severity: 'high',
      message: `Payment processing failed for order ${orderId}: ${error.message}`,
      details: {
        orderId,
        buyerId: userId,
      },
    });

    res.status(500).json({
      success: false,
      message: 'Payment processing failed due to system error',
      error: error.message
    });
  }
};

/**
 * Get order details by ID
 * GET /api/orders/:id
 */
const getOrder = async (req, res) => {
  const orderId = parseInt(req.params.id);
  const userId = req.user.id;

  const order = await Order.getById(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Only buyer or seller can view order details
  if (order.buyer_id !== userId && order.seller_id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    order
  });
};

/**
 * List user's orders (buyer or seller view)
 * GET /api/orders
 */
const listOrders = async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.type;
  const { 
    status = null, 
    role = null, // 'buyer' or 'seller' (for users with type 'both')
    limit = 50, 
    offset = 0 
  } = req.query;

  // Parse limit and offset
  const parsedLimit = Math.min(parseInt(limit) || 50, 100); // Max 100
  const parsedOffset = parseInt(offset) || 0;

  let result;

  // Determine which orders to fetch
  if (role === 'seller' || (userType === 'seller' && role !== 'buyer')) {
    // Get orders where user is seller
    result = await Order.getBySeller(userId, {
      status,
      limit: parsedLimit,
      offset: parsedOffset
    });
  } else if (role === 'buyer' || (userType === 'buyer' && role !== 'seller')) {
    // Get orders where user is buyer
    result = await Order.getByBuyer(userId, {
      status,
      limit: parsedLimit,
      offset: parsedOffset
    });
  } else if (userType === 'both') {
    // For users with type 'both', get both buyer and seller orders if no role specified
    const [buyerOrders, sellerOrders] = await Promise.all([
      Order.getByBuyer(userId, { status, limit: parsedLimit, offset: parsedOffset }),
      Order.getBySeller(userId, { status, limit: parsedLimit, offset: parsedOffset })
    ]);

    result = {
      orders: [
        ...buyerOrders.orders.map(o => ({ ...o, user_role: 'buyer' })),
        ...sellerOrders.orders.map(o => ({ ...o, user_role: 'seller' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, parsedLimit),
      total: buyerOrders.total + sellerOrders.total
    };
  } else {
    // Default to buyer orders
    result = await Order.getByBuyer(userId, {
      status,
      limit: parsedLimit,
      offset: parsedOffset
    });
  }

  res.json({
    success: true,
    orders: result.orders,
    pagination: {
      total: result.total,
      limit: parsedLimit,
      offset: parsedOffset,
      hasMore: parsedOffset + parsedLimit < result.total
    }
  });
};

/**
 * Update order status (seller only)
 * PUT /api/orders/:id/status
 */
const updateOrderStatus = async (req, res) => {
  const orderId = parseInt(req.params.id);
  const userId = req.user.id;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required'
    });
  }

  if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be pending, confirmed, completed, or cancelled'
    });
  }

  // Check if order exists and user is the seller
  const userRelation = await Order.checkUserRelation(orderId, userId);
  if (!userRelation) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (!userRelation.isSeller) {
    return res.status(403).json({
      success: false,
      message: 'Only the seller can update order status'
    });
  }

  // Update order status
  const updatedOrder = await Order.updateStatus(orderId, status);

  res.json({
    success: true,
    message: `Order status updated to ${status}`,
    order: updatedOrder
  });
};

/**
 * Get supported payment methods
 * GET /api/orders/payment-methods
 */
const getPaymentMethods = async (req, res) => {
  const methods = paymentService.getSupportedMethods();
  
  res.json({
    success: true,
    paymentMethods: methods,
    disclaimer: 'Payment methods depend on feature flags and provider configuration.'
  });
};

/**
 * Create full or partial refund (seller only)
 * POST /api/orders/:id/refunds
 */
const createRefund = async (req, res) => {
  const orderId = parseInt(req.params.id, 10);
  const sellerId = req.user.id;
  const { amount, reason = 'requested_by_seller' } = req.body;

  const order = await Order.getById(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  if (order.seller_id !== sellerId) {
    return res.status(403).json({
      success: false,
      message: 'Only the seller for this order can issue refunds',
    });
  }

  try {
    const result = await paymentService.createRefund({
      order,
      amount,
      reason,
      requestedBy: sellerId,
    });

    if (req.analytics) {
      req.analytics.track('payment_refund_created', {
        order_id: order.id,
        seller_id: sellerId,
        refund_id: result.refund.id,
        amount: result.refundedAmount,
        fully_refunded: result.fullyRefunded,
      }, sellerId).catch((err) => console.error('Refund analytics error:', err));
    }

    return res.status(201).json({
      success: true,
      message: 'Refund recorded successfully',
      refund: result.refund,
      paymentSummary: {
        totalRefunded: result.totalRefunded,
        remainingRefundable: result.remainingRefundable,
        fullyRefunded: result.fullyRefunded,
      },
      order: result.order,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Refund failed',
    });
  }
};

/**
 * Run payment reconciliation (seller scope)
 * POST /api/orders/reconciliation/run
 */
const runPaymentReconciliation = async (req, res) => {
  const sellerId = req.user.id;
  const autoFix = Boolean(req.body?.auto_fix);

  const result = await paymentReconciliationService.run({
    sellerId,
    triggeredBy: sellerId,
    autoFix,
  });

  return res.json({
    success: true,
    message: 'Payment reconciliation completed',
    reconciliation: {
      scanned: result.scanned,
      mismatchesFound: result.mismatches.length,
      fixedCount: result.fixedCount,
      mismatches: result.mismatches,
      runId: result.run.id,
      createdAt: result.run.created_at,
    },
  });
};

/**
 * Get payment monitoring summary (seller scope)
 * GET /api/orders/payment-monitoring/summary
 */
const getPaymentMonitoringSummary = async (req, res) => {
  const hoursRaw = req.query?.hours;
  const hours = hoursRaw ? parseInt(hoursRaw, 10) : 24;

  const summary = await paymentMonitoringService.getSummary({ hours });

  return res.json({
    success: true,
    monitoring: summary,
  });
};

/**
 * Acknowledge payment alert (seller scope)
 * POST /api/orders/payment-monitoring/alerts/:alertId/ack
 */
const acknowledgePaymentAlert = async (req, res) => {
  const alertId = parseInt(req.params.alertId, 10);
  const userId = req.user.id;

  if (!alertId || Number.isNaN(alertId)) {
    return res.status(400).json({
      success: false,
      message: 'alertId must be a valid integer',
    });
  }

  const alert = await paymentMonitoringService.acknowledgeAlert({
    alertId,
    userId,
  });

  if (!alert) {
    return res.status(404).json({
      success: false,
      message: 'Open alert not found',
    });
  }

  return res.json({
    success: true,
    message: 'Alert acknowledged',
    alert,
  });
};

/**
 * Get seller settlement history
 * GET /api/orders/seller/payments/settlements
 */
const getSellerSettlementHistory = async (req, res) => {
  const sellerId = req.user.id;
  const { status = 'all', limit = 50, offset = 0 } = req.query;

  const result = await paymentReportingService.getSellerSettlementHistory({
    sellerId,
    status,
    limit,
    offset,
  });

  return res.json({
    success: true,
    settlements: result.settlements,
    pagination: {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.offset + result.limit < result.total,
    },
    filter: {
      status: result.status,
    },
  });
};

/**
 * Get seller payout overview and trend
 * GET /api/orders/seller/payments/overview
 */
const getSellerPayoutOverview = async (req, res) => {
  const sellerId = req.user.id;
  const { days = 30 } = req.query;

  const result = await paymentReportingService.getSellerPayoutOverview({
    sellerId,
    days,
  });

  return res.json({
    success: true,
    days: result.days,
    overview: result.overview,
    trend: result.trend,
  });
};

/**
 * Create multiple orders in one request (buyers only)
 * POST /api/orders/batch
 * Body: { items: [{ product_id, quantity }], payment_method }
 */
const createBatchOrders = async (req, res) => {
  const { items, payment_method = 'cash', delivery_notes = null } = req.body;
  const buyer_id = req.user.id;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'items must be a non-empty array'
    });
  }

  if (!paymentService.isMethodSupported(payment_method)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment method or method is currently disabled'
    });
  }

  const createdOrders = [];

  for (const item of items) {
    const { product_id, quantity } = item;

    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: `Each item must have a valid product_id and quantity > 0`
      });
    }

    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product ${product_id} not found`
      });
    }

    if (product.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Product "${product.name || product_id}" is not available for purchase`
      });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient quantity for product ${product_id}. Only ${product.quantity} ${product.unit} available`
      });
    }

    if (product.seller_id === buyer_id) {
      return res.status(400).json({
        success: false,
        message: `Cannot purchase your own product (${product_id})`
      });
    }

    const unit_price = parseFloat(product.price);
    const total_amount = unit_price * quantity;

    const order = await Order.create({
      buyer_id,
      seller_id: product.seller_id,
      product_id,
      quantity: parseFloat(quantity),
      unit_price,
      total_amount,
      payment_method,
      delivery_notes
    });

    const orderDetails = await Order.getById(order.id);

    if (req.analytics) {
      req.analytics.track('order_created', {
        order_id: orderDetails.id,
        product_id: orderDetails.product_id,
        seller_id: orderDetails.seller_id,
        buyer_id: orderDetails.buyer_id,
        quantity: orderDetails.quantity,
        unit_price: orderDetails.unit_price,
        total_amount: orderDetails.total_amount,
        payment_method: orderDetails.payment_method
      }, buyer_id).catch(err => console.error('Order creation analytics error:', err));
    }

    createdOrders.push(orderDetails);
  }

  res.status(201).json({
    success: true,
    message: `${createdOrders.length} order(s) created successfully`,
    orders: createdOrders
  });
};

module.exports = {
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
};