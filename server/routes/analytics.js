const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authenticate');
const {
  getAlgorithmAnalytics,
  getBusinessAnalytics,
  getPerformanceAnalytics,
  getSellerDashboard,
  getMyActivity,
  getRealtimeAnalytics
} = require('../controllers/analyticsController');

// =====================================================
// ANALYTICS ROUTES
// =====================================================

/**
 * Algorithm Analytics Dashboard
 * GET /api/analytics/algorithm?period=7d
 * Shows: weight distributions, response times, popular products
 * Access: Authenticated users (buyers and sellers can see algorithm usage patterns)
 */
router.get('/algorithm', isAuthenticated, getAlgorithmAnalytics);

/**
 * Business Analytics Dashboard
 * GET /api/analytics/business?period=30d
 * Shows: orders, revenue, popular products
 * Access: Authenticated users (sellers see their own data, future admin sees all)
 */
router.get('/business', isAuthenticated, getBusinessAnalytics);

/**
 * Performance Analytics Dashboard
 * GET /api/analytics/performance?period=24h
 * Shows: response times, error rates, system health
 * Access: Authenticated users (everyone can see system performance for transparency)
 */
router.get('/performance', isAuthenticated, getPerformanceAnalytics);

/**
 * Seller Dashboard - Personalized seller metrics
 * GET /api/analytics/seller-dashboard
 * Shows: product performance, recent orders, revenue trends
 * Access: Sellers only (type: 'seller' or 'both')
 */
router.get('/seller-dashboard', isAuthenticated, getSellerDashboard);

/**
 * User Activity Analytics - Personal usage patterns
 * GET /api/analytics/my-activity
 * Shows: search history, preference changes, order history
 * Access: Authenticated users (own data only)
 */
router.get('/my-activity', isAuthenticated, getMyActivity);

/**
 * Real-time Analytics Summary
 * GET /api/analytics/realtime
 * Shows: last 5 minutes activity, hourly comparisons
 * Access: Authenticated users (for system health monitoring)
 */
router.get('/realtime', isAuthenticated, getRealtimeAnalytics);

/**
 * Analytics Overview - General platform statistics
 * GET /api/analytics/overview
 * Shows: high-level stats for featured on homepage/dashboard
 * Access: Public (no authentication required)
 */
router.get('/overview', async (req, res) => {
  try {
    const { query } = require('../config/database');
    
    // Public overview stats (last 24 hours)
    const overviewQuery = await query(`
      SELECT 
        COUNT(CASE WHEN event_name = 'search_request' THEN 1 END) as searches_today,
        COUNT(CASE WHEN event_name = 'product_created' THEN 1 END) as products_listed_today,
        COUNT(CASE WHEN event_name = 'order_created' THEN 1 END) as orders_today,
        COUNT(CASE WHEN event_name = 'user_login' THEN 1 END) as active_users_today
      FROM analytics_events 
      WHERE timestamp >= CURRENT_DATE
    `);
    
    // Total platform stats (all time)
    const totalsQuery = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE type IN ('seller', 'both')) as total_sellers,
        (SELECT COUNT(*) FROM users WHERE type IN ('buyer', 'both')) as total_buyers,
        (SELECT COUNT(*) FROM products WHERE status = 'active') as active_products,
        (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'search_request') as total_searches
    `);

    res.json({
      success: true,
      data: {
        today: overviewQuery.rows[0],
        totals: totalsQuery.rows[0],
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics overview'
    });
  }
});

module.exports = router;