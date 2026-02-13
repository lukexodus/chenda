/**
 * Mock Payment Service
 * Simulates payment processing with different payment methods
 */

const crypto = require('crypto');

class PaymentService {
  /**
   * Process a mock payment
   * @param {Object} paymentData - Payment information
   * @param {string} paymentData.orderId - Order ID
   * @param {number} paymentData.amount - Payment amount
   * @param {string} paymentData.method - Payment method (cash, gcash, card)
   * @param {Object} paymentData.buyer - Buyer information
   * @returns {Promise<Object>} Payment result
   */
  async processPayment(paymentData) {
    const { orderId, amount, method, buyer } = paymentData;

    // Validate input
    if (!orderId || !amount || !method || !buyer) {
      throw new Error('Missing required payment data');
    }

    if (amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    if (!['cash', 'gcash', 'card'].includes(method)) {
      throw new Error('Invalid payment method. Must be cash, gcash, or card');
    }

    // Generate mock transaction ID
    const transactionId = this._generateTransactionId(method);

    // Simulate payment processing with delays
    const processingTime = this._getProcessingTime(method);
    await this._delay(processingTime);

    // Determine payment success based on method
    const success = this._determinePaymentSuccess(method);

    if (success) {
      return {
        success: true,
        transactionId,
        method,
        amount,
        orderId,
        status: 'paid',
        message: `Payment of ₱${amount.toFixed(2)} via ${method.toUpperCase()} processed successfully`,
        processedAt: new Date().toISOString(),
        processingTime: `${processingTime}ms`
      };
    } else {
      // Simulate payment failure
      const failureReason = this._getFailureReason(method);
      return {
        success: false,
        transactionId: null,
        method,
        amount,
        orderId,
        status: 'failed',
        message: `Payment failed: ${failureReason}`,
        error: failureReason,
        processedAt: new Date().toISOString(),
        processingTime: `${processingTime}ms`
      };
    }
  }

  /**
   * Refund a payment (mock)
   * @param {string} transactionId - Original transaction ID
   * @param {number} amount - Refund amount
   * @param {string} reason - Refund reason
   * @returns {Promise<Object>} Refund result
   */
  async refundPayment(transactionId, amount, reason = 'Customer request') {
    // Simulate refund processing delay
    await this._delay(1500);

    const refundId = this._generateTransactionId('refund');

    return {
      success: true,
      refundId,
      originalTransactionId: transactionId,
      amount,
      reason,
      status: 'refunded',
      message: `Refund of ₱${amount.toFixed(2)} processed successfully`,
      processedAt: new Date().toISOString()
    };
  }

  /**
   * Check payment status (mock)
   * @param {string} transactionId - Transaction ID to check
   * @returns {Promise<Object>} Payment status
   */
  async checkPaymentStatus(transactionId) {
    // Simulate API call delay
    await this._delay(500);

    if (!transactionId) {
      return {
        success: false,
        message: 'Transaction ID is required'
      };
    }

    // Mock status check - in real app would query payment provider
    return {
      success: true,
      transactionId,
      status: 'paid',
      amount: 0, // Would be retrieved from database
      processedAt: new Date().toISOString(),
      message: 'Payment confirmed'
    };
  }

  /**
   * Generate mock transaction ID
   * @param {string} method - Payment method
   * @returns {string} Transaction ID
   */
  _generateTransactionId(method) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const prefix = {
      'cash': 'CASH',
      'gcash': 'GCH', 
      'card': 'CRD',
      'refund': 'REF'
    }[method] || 'TXN';

    return `${prefix}-${timestamp}-${random.toUpperCase()}`;
  }

  /**
   * Get processing time for payment method
   * @param {string} method - Payment method
   * @returns {number} Processing time in milliseconds
   */
  _getProcessingTime(method) {
    switch (method) {
      case 'cash':
        return 500; // Cash is instant
      case 'gcash':
        return 2000; // 2 seconds for e-wallet
      case 'card':
        return 2500; // 2.5 seconds for card processing
      default:
        return 1000;
    }
  }

  /**
   * Determine if payment should succeed based on method
   * @param {string} method - Payment method
   * @returns {boolean} Whether payment succeeds
   */
  _determinePaymentSuccess(method) {
    const random = Math.random();
    
    switch (method) {
      case 'cash':
        return random < 0.99; // 99% success rate (almost always works)
      case 'gcash':
        return random < 0.95; // 95% success rate
      case 'card':
        return random < 0.90; // 90% success rate (cards can fail more often)
      default:
        return random < 0.95;
    }
  }

  /**
   * Get failure reason for payment method
   * @param {string} method - Payment method
   * @returns {string} Failure reason
   */
  _getFailureReason(method) {
    const reasons = {
      'cash': [
        'Insufficient physical cash',
        'Cash handling error'
      ],
      'gcash': [
        'Insufficient GCash balance',
        'GCash service temporarily unavailable',
        'Invalid GCash account',
        'Transaction limit exceeded'
      ],
      'card': [
        'Insufficient funds',
        'Card expired',
        'Invalid card details',
        'Bank declined transaction',
        'Network error',
        'Card blocked by issuer'
      ]
    };

    const methodReasons = reasons[method] || ['Payment processing error'];
    return methodReasons[Math.floor(Math.random() * methodReasons.length)];
  }

  /**
   * Delay helper function
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get supported payment methods
   * @returns {Array<Object>} Available payment methods
   */
  getSupportedMethods() {
    return [
      {
        id: 'cash',
        name: 'Cash on Delivery',
        description: 'Pay with physical cash upon delivery',
        processingTime: '500ms',
        successRate: '99%',
        icon: '💰'
      },
      {
        id: 'gcash',
        name: 'GCash',
        description: 'Pay using GCash e-wallet',
        processingTime: '2s',
        successRate: '95%',
        icon: '📱'
      },
      {
        id: 'card',
        name: 'Credit/Debit Card',
        description: 'Pay using credit or debit card',
        processingTime: '2.5s',
        successRate: '90%',
        icon: '💳'
      }
    ];
  }
}

module.exports = new PaymentService();