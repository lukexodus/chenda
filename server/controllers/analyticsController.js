const AnalyticsService = require('../services/analyticsService');
const asyncHandler = require('../middleware/asyncHandler');
const { query } = require('../config/database');

/**
 * Analytics Controller
 * Provides dashboard data for algorithm usage, business metrics, and performance
 */

/**
 * Get algorithm analytics - weight distributions, response times, popular products
 * GET /api/analytics/algorithm?period=7d
 */
const getAlgorithmAnalytics = asyncHandler(async (req, res) => {
  const { period = '7 days' } = req.query;
  
  // Validate period parameter
  const validPeriods = ['1 day', '7 days', '30 days', '90 days'];
  const dateRange = validPeriods.includes(period) ? period : '7 days';
  
  try {
    const analytics = await AnalyticsService.getAlgorithmAnalytics(dateRange);
    
    // Add search volume trends
    const searchVolumeQuery = await query(`
      SELECT 
        DATE_TRUNC('day', timestamp) as date,
        COUNT(*) as searches
      FROM analytics_events 
      WHERE event_name = 'search_request' 
        AND timestamp >= NOW() - INTERVAL '${dateRange}'
      GROUP BY date
      ORDER BY date
    `);
    
    // Add preference change trends  
    const preferenceChangesQuery = await query(`
      SELECT 
        jsonb_array_elements_text(event_properties->'changed_fields') as field_changed,
        COUNT(*) as change_count
      FROM analytics_events 
      WHERE event_name = 'preference_change' 
        AND timestamp >= NOW() - INTERVAL '${dateRange}'
        AND jsonb_typeof(event_properties->'changed_fields') = 'array'
      GROUP BY field_changed
      ORDER BY change_count DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        ...analytics,
        search_volume: searchVolumeQuery.rows,
        preference_changes: preferenceChangesQuery.rows,
        period: dateRange
      }
    });
  } catch (error) {
    console.error('Algorithm analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve algorithm analytics'
    });
  }
});

/**
 * Get business analytics - orders, revenue, popular products
 * GET /api/analytics/business?period=30d
 * Sellers see only their data, admins see aggregate data
 */
const getBusinessAnalytics = asyncHandler(async (req, res) => {
  const { period = '30 days' } = req.query;
  const userId = req.user.id;
  const userType = req.user.type;
  
  // Validate period
  const validPeriods = ['7 days', '30 days', '90 days', '1 year'];
  const dateRange = validPeriods.includes(period) ? period : '30 days';
  
  try {
    // Determine if user should see all data (future admin role) or just their own
    const isAdmin = false; // TODO: Implement admin role check when admin roles are added
    const sellerId = (userType === 'seller' || userType === 'both') && !isAdmin ? userId : null;
    
    const businessMetrics = await AnalyticsService.getSellerAnalytics(sellerId, dateRange);
    
    // Add order volume trends
    const orderVolumeQuery = await query(`
      SELECT 
        DATE_TRUNC('day', timestamp) as date,
        COUNT(*) as orders,
        SUM((event_properties->>'total_amount')::numeric) as revenue
      FROM analytics_events 
      WHERE event_name = 'order_created' 
        AND timestamp >= NOW() - INTERVAL '${dateRange}'
        ${sellerId ? `AND (event_properties->>'seller_id')::integer = ${sellerId}` : ''}
      GROUP BY date
      ORDER BY date
    `);
    
    // Popular product types (for this seller or overall)
    const popularProductsQuery = await query(`
      SELECT 
        pt.name as product_name,
        COUNT(*) as order_count,
        SUM((ae.event_properties->>'total_amount')::numeric) as total_revenue
      FROM analytics_events ae
      JOIN products p ON p.id = (ae.event_properties->>'product_id')::integer
      JOIN product_types pt ON pt.id = p.product_type_id
      WHERE ae.event_name = 'order_created' 
        AND ae.timestamp >= NOW() - INTERVAL '${dateRange}'
        ${sellerId ? `AND (ae.event_properties->>'seller_id')::integer = ${sellerId}` : ''}
      GROUP BY pt.name
      ORDER BY total_revenue DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        ...businessMetrics,
        order_volume: orderVolumeQuery.rows,
        popular_products: popularProductsQuery.rows,
        period: dateRange,
        scope: sellerId ? 'seller' : 'platform'
      }
    });
  } catch (error) {
    console.error('Business analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve business analytics'
    });
  }
});

/**
 * Get performance analytics - response times, system health
 * GET /api/analytics/performance?period=24h
 * Admin only (for now, everyone can see performance metrics)
 */
const getPerformanceAnalytics = asyncHandler(async (req, res) => {
  const { period = '24 hours' } = req.query;
  
  // Validate period
  const validPeriods = ['1 hour', '24 hours', '7 days'];
  const dateRange = validPeriods.includes(period) ? period : '24 hours';
  
  try {
    const performance = await AnalyticsService.getSystemPerformance(dateRange);
    
    // Add error rate analysis
    const errorRateQuery = await query(`
      SELECT 
        DATE_TRUNC('hour', timestamp) as hour,
        SUM(CASE WHEN event_name = 'server_error' THEN 1 ELSE 0 END) * 100.0 / 
          NULLIF(SUM(CASE WHEN event_name = 'api_request' THEN 1 ELSE 0 END), 0) as error_rate_percent
      FROM analytics_events 
      WHERE timestamp >= NOW() - INTERVAL '${dateRange}'
        AND event_name IN ('api_request', 'server_error')
      GROUP BY hour
      ORDER BY hour
    `);
    
    // Slowest endpoints
    const slowEndpointsQuery = await query(`
      SELECT 
        event_properties->>'endpoint' as endpoint,
        AVG((event_properties->>'response_time_ms')::numeric) as avg_response_time,
        COUNT(*) as request_count
      FROM analytics_events 
      WHERE event_name = 'api_request' 
        AND timestamp >= NOW() - INTERVAL '${dateRange}'
        AND event_properties->>'response_time_ms' IS NOT NULL
      GROUP BY endpoint
      HAVING COUNT(*) > 5
      ORDER BY avg_response_time DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        ...performance,
        error_rates: errorRateQuery.rows,
        slow_endpoints: slowEndpointsQuery.rows,
        period: dateRange
      }
    });
  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance analytics'
    });
  }
});

/**
 * Get seller dashboard analytics - personalized metrics
 * GET /api/analytics/seller-dashboard
 */
const getSellerDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.type;
  
  // Only sellers and 'both' type users can access
  if (userType !== 'seller' && userType !== 'both') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Seller account required.'
    });
  }
  
  try {
    // Get seller's product performance
    const productPerformanceQuery = await query(`
      SELECT 
        p.id,
        pt.name as product_name,
        p.price,
        p.status,
        p.created_at,
        COALESCE(order_count, 0) as order_count,
        COALESCE(total_revenue, 0) as total_revenue,
        COALESCE(view_count, 0) as view_count
      FROM products p
      JOIN product_types pt ON pt.id = p.product_type_id
      LEFT JOIN (
        SELECT 
          (event_properties->>'product_id')::integer as product_id,
          COUNT(*) as order_count,
          SUM((event_properties->>'total_amount')::numeric) as total_revenue
        FROM analytics_events 
        WHERE event_name = 'order_created'
        GROUP BY product_id
      ) orders ON orders.product_id = p.id
      LEFT JOIN (
        SELECT 
          (event_properties->>'product_id')::integer as product_id,
          COUNT(*) as view_count
        FROM analytics_events 
        WHERE event_name = 'product_viewed'
        GROUP BY product_id
      ) views ON views.product_id = p.id
      WHERE p.seller_id = $1
      ORDER BY p.created_at DESC
      LIMIT 20
    `, [userId]);
    
    // Recent activity
    const recentActivityQuery = await query(`
      SELECT 
        event_name,
        event_properties,
        timestamp
      FROM analytics_events 
      WHERE user_id = $1 
        OR (event_name = 'order_created' AND (event_properties->>'seller_id')::integer = $1)
      ORDER BY timestamp DESC
      LIMIT 20
    `, [userId]);
    
    // Weekly summary
    const weeklySummaryQuery = await query(`
      SELECT 
        COUNT(CASE WHEN event_name = 'product_created' THEN 1 END) as products_created,
        COUNT(CASE WHEN event_name = 'order_created' THEN 1 END) as orders_received,
        SUM(CASE 
          WHEN event_name = 'order_created' 
          THEN (event_properties->>'total_amount')::numeric 
          ELSE 0 
        END) as revenue_this_week
      FROM analytics_events 
      WHERE timestamp >= NOW() - INTERVAL '7 days'
        AND (
          (user_id = $1 AND event_name = 'product_created') 
          OR 
          (event_name = 'order_created' AND (event_properties->>'seller_id')::integer = $1)
        )
    `, [userId]);

    res.json({
      success: true,
      data: {
        product_performance: productPerformanceQuery.rows,
        recent_activity: recentActivityQuery.rows,
        weekly_summary: weeklySummaryQuery.rows[0],
        seller_id: userId
      }
    });
  } catch (error) {
    console.error('Seller dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve seller dashboard'
    });
  }
});

/**
 * Get user activity analytics - search patterns, preferences
 * GET /api/analytics/my-activity
 */
const getMyActivity = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  try {
    // Search history and patterns
    const searchPatternQuery = await query(`
      SELECT 
        (event_properties->>'proximity_weight')::integer as proximity_weight,
        (event_properties->>'shelf_life_weight')::integer as shelf_life_weight,
        (event_properties->>'max_radius')::integer as max_radius,
        (event_properties->>'results_count')::integer as results_count,
        timestamp
      FROM analytics_events 
      WHERE event_name = 'search_request' 
        AND user_id = $1
        AND timestamp >= NOW() - INTERVAL '30 days'
      ORDER BY timestamp DESC
      LIMIT 50
    `, [userId]);
    
    // Preference change history
    const preferenceHistoryQuery = await query(`
      SELECT 
        event_properties->'changed_fields' as changed_fields,
        event_properties->>'proximity_weight_after' as proximity_weight,
        event_properties->>'shelf_life_weight_after' as shelf_life_weight,
        timestamp
      FROM analytics_events 
      WHERE event_name = 'preference_change' 
        AND user_id = $1
      ORDER BY timestamp DESC
      LIMIT 10
    `, [userId]);
    
    // Activity summary
    const activitySummaryQuery = await query(`
      SELECT 
        COUNT(CASE WHEN event_name = 'search_request' THEN 1 END) as total_searches,
        COUNT(CASE WHEN event_name = 'product_viewed' THEN 1 END) as products_viewed,
        COUNT(CASE WHEN event_name = 'order_created' THEN 1 END) as orders_placed,
        COUNT(CASE WHEN event_name = 'preference_change' THEN 1 END) as preference_changes
      FROM analytics_events 
      WHERE user_id = $1
        AND timestamp >= NOW() - INTERVAL '30 days'
    `, [userId]);

    res.json({
      success: true,
      data: {
        search_patterns: searchPatternQuery.rows,
        preference_history: preferenceHistoryQuery.rows,
        activity_summary: activitySummaryQuery.rows[0],
        user_id: userId
      }
    });
  } catch (error) {
    console.error('User activity analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user activity'
    });
  }
});

/**
 * Get real-time analytics summary
 * GET /api/analytics/realtime
 */
const getRealtimeAnalytics = asyncHandler(async (req, res) => {
  try {
    // Last 5 minutes activity
    const realtimeQuery = await query(`
      SELECT 
        COUNT(CASE WHEN event_name = 'search_request' THEN 1 END) as searches_5min,
        COUNT(CASE WHEN event_name = 'product_viewed' THEN 1 END) as views_5min,
        COUNT(CASE WHEN event_name = 'order_created' THEN 1 END) as orders_5min,
        COUNT(CASE WHEN event_name = 'user_login' THEN 1 END) as logins_5min,
        COUNT(DISTINCT user_id) as active_users_5min
      FROM analytics_events 
      WHERE timestamp >= NOW() - INTERVAL '5 minutes'
    `);
    
    // Current hour vs previous hour comparison
    const hourlyComparisonQuery = await query(`
      SELECT 
        SUM(CASE 
          WHEN timestamp >= DATE_TRUNC('hour', NOW()) 
          THEN 1 ELSE 0 
        END) as current_hour_events,
        SUM(CASE 
          WHEN timestamp >= DATE_TRUNC('hour', NOW()) - INTERVAL '1 hour' 
            AND timestamp < DATE_TRUNC('hour', NOW())
          THEN 1 ELSE 0 
        END) as previous_hour_events
      FROM analytics_events 
      WHERE timestamp >= DATE_TRUNC('hour', NOW()) - INTERVAL '1 hour'
    `);

    res.json({
      success: true,
      data: {
        last_5_minutes: realtimeQuery.rows[0],
        hourly_comparison: hourlyComparisonQuery.rows[0],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Realtime analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve realtime analytics'
    });
  }
});

module.exports = {
  getAlgorithmAnalytics,
  getBusinessAnalytics,
  getPerformanceAnalytics,
  getSellerDashboard,
  getMyActivity,
  getRealtimeAnalytics
};