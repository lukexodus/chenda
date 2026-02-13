/**
 * Order Model
 * 
 * Database operations for orders table
 */

const { query } = require('../config/database');

class Order {
  /**
   * Create a new order
   */
  static async create(orderData) {
    const {
      buyer_id,
      seller_id,
      product_id,
      quantity,
      unit_price,
      total_amount,
      payment_method = 'cash'
    } = orderData;

    const result = await query(`
      INSERT INTO orders (
        buyer_id, seller_id, product_id, quantity, unit_price, total_amount,
        payment_method, payment_status, order_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, 'pending', 'pending'
      ) RETURNING 
        id, buyer_id, seller_id, product_id, quantity, unit_price, total_amount,
        payment_method, payment_status, order_status, transaction_id,
        created_at, updated_at, completed_at
    `, [buyer_id, seller_id, product_id, quantity, unit_price, total_amount, payment_method]);

    return result.rows[0];
  }

  /**
   * Get order by ID with full details (product, buyer, seller)
   */
  static async getById(orderId) {
    const result = await query(`
      SELECT 
        o.id,
        o.buyer_id,
        o.seller_id,
        o.product_id,
        o.quantity,
        o.unit_price,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.transaction_id,
        o.created_at,
        o.updated_at,
        o.completed_at,
        -- Product details
        p.price as product_price,
        p.status as product_status,
        pt.name as product_name,
        pt.default_shelf_life_days as product_shelf_life,
        -- Buyer details
        u_buyer.name as buyer_name,
        u_buyer.email as buyer_email,
        -- Seller details
        u_seller.name as seller_name,
        u_seller.email as seller_email
      FROM orders o
      INNER JOIN products p ON o.product_id = p.id
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      INNER JOIN users u_buyer ON o.buyer_id = u_buyer.id
      INNER JOIN users u_seller ON o.seller_id = u_seller.id
      WHERE o.id = $1
    `, [orderId]);

    return result.rows[0] || null;
  }

  /**
   * Get orders for a buyer
   */
  static async getByBuyer(buyerId, { status = null, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT 
        o.id,
        o.product_id,
        o.quantity,
        o.unit_price,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.transaction_id,
        o.created_at,
        o.completed_at,
        pt.name as product_name,
        u_seller.name as seller_name
      FROM orders o
      INNER JOIN products p ON o.product_id = p.id
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      INNER JOIN users u_seller ON o.seller_id = u_seller.id
      WHERE o.buyer_id = $1
    `;

    const params = [buyerId];

    if (status) {
      sql += ` AND o.order_status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    
    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM orders WHERE buyer_id = $1';
    const countParams = [buyerId];
    
    if (status) {
      countSql += ' AND order_status = $2';
      countParams.push(status);
    }

    const countResult = await query(countSql, countParams);

    return {
      orders: result.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  /**
   * Get orders for a seller
   */
  static async getBySeller(sellerId, { status = null, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT 
        o.id,
        o.product_id,
        o.quantity,
        o.unit_price,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.transaction_id,
        o.created_at,
        o.completed_at,
        pt.name as product_name,
        u_buyer.name as buyer_name
      FROM orders o
      INNER JOIN products p ON o.product_id = p.id
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      INNER JOIN users u_buyer ON o.buyer_id = u_buyer.id
      WHERE o.seller_id = $1
    `;

    const params = [sellerId];

    if (status) {
      sql += ` AND o.order_status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    
    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM orders WHERE seller_id = $1';
    const countParams = [sellerId];
    
    if (status) {
      countSql += ' AND order_status = $2';
      countParams.push(status);
    }

    const countResult = await query(countSql, countParams);

    return {
      orders: result.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  /**
   * Update order payment status
   */
  static async updatePaymentStatus(orderId, paymentStatus, transactionId = null) {
    const updates = [`payment_status = $1`];
    const params = [paymentStatus, orderId];
    let paramIndex = 3;

    if (transactionId) {
      updates.push(`transaction_id = $${paramIndex}`);
      params.splice(2, 0, transactionId);
      paramIndex++;
    }

    // If payment successful, update order status to confirmed
    if (paymentStatus === 'paid') {
      updates.push(`order_status = 'confirmed'`);
    }

    const result = await query(`
      UPDATE orders 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING 
        id, buyer_id, seller_id, product_id, quantity, unit_price, total_amount,
        payment_method, payment_status, order_status, transaction_id,
        created_at, updated_at, completed_at
    `, params);

    return result.rows[0] || null;
  }

  /**
   * Update order status
   */
  static async updateStatus(orderId, orderStatus) {
    const updates = ['order_status = $1'];

    // If order completed, set completed_at
    if (orderStatus === 'completed') {
      updates.push('completed_at = CURRENT_TIMESTAMP');
    }

    const result = await query(`
      UPDATE orders 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING 
        id, buyer_id, seller_id, product_id, quantity, unit_price, total_amount,
        payment_method, payment_status, order_status, transaction_id,
        created_at, updated_at, completed_at
    `, [orderStatus, orderId]);

    return result.rows[0] || null;
  }

  /**
   * Check if user is buyer or seller of order
   */
  static async checkUserRelation(orderId, userId) {
    const result = await query(`
      SELECT buyer_id, seller_id
      FROM orders
      WHERE id = $1
    `, [orderId]);

    if (result.rows.length === 0) {
      return null;
    }

    const order = result.rows[0];
    return {
      isBuyer: order.buyer_id === userId,
      isSeller: order.seller_id === userId,
      buyerId: order.buyer_id,
      sellerId: order.seller_id
    };
  }
}

module.exports = Order;
