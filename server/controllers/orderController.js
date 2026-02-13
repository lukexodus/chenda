/**
 * Order Controller
 * Business logic for order management and mock payment processing
 */

const Order = require('../models/Order');
const Product = require('../models/Product');
const paymentService = require('../services/paymentService');

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

  if (!['cash', 'gcash', 'card'].includes(payment_method)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment method. Must be cash, gcash, or card'
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
    payment_method
  };

  const order = await Order.create(orderData);

  // Get order details for response
  const orderDetails = await Order.getById(order.id);

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
  if (order.payment_status === 'paid') {
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
    // Process payment using payment service
    const paymentData = {
      orderId: order.id,
      amount: order.total_amount,
      method: order.payment_method,
      buyer: {
        id: order.buyer_id,
        name: order.buyer_name,
        email: order.buyer_email
      }
    };

    const paymentResult = await paymentService.processPayment(paymentData);

    if (paymentResult.success) {
      // Update order payment status
      const updatedOrder = await Order.updatePaymentStatus(
        orderId, 
        'paid', 
        paymentResult.transactionId
      );

      res.json({
        success: true,
        message: 'Payment processed successfully',
        payment: paymentResult,
        order: updatedOrder
      });
    } else {
      // Payment failed - update order status
      await Order.updatePaymentStatus(orderId, 'failed');

      res.status(400).json({
        success: false,
        message: 'Payment processing failed',
        payment: paymentResult,
        error: paymentResult.error
      });
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    
    // Update order payment status to failed
    await Order.updatePaymentStatus(orderId, 'failed');

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
    disclaimer: '⚠️ This is a mock payment system. No real transactions are processed.'
  });
};

module.exports = {
  createOrder,
  processPayment,
  getOrder,
  listOrders,
  updateOrderStatus,
  getPaymentMethods
};