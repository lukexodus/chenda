const { query } = require('../config/database');

/**
 * Analytics Service for Chenda Platform
 * Tracks algorithm usage, performance metrics, and business events
 */
class AnalyticsService {
  
  /**
   * Track any event to analytics_events table
   * @param {Object} params
   * @param {number} [params.userId] - User ID (optional for anonymous events)
   * @param {string} params.eventName - Event name (e.g., 'search_request', 'preference_change')
   * @param {Object} [params.properties] - Event properties as JSON object
   * @param {string} [params.sessionId] - Session ID
   * @param {string} [params.userAgent] - User agent string
   * @param {string} [params.ipAddress] - IP address
   */
  static async trackEvent({ userId = null, eventName, properties = {}, sessionId = null, userAgent = null, ipAddress = null }) {
    try {
      const result = await query(
        `INSERT INTO analytics_events 
         (user_id, event_name, event_properties, session_id, user_agent, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [userId, eventName, JSON.stringify(properties), sessionId, userAgent, ipAddress]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Don't throw - analytics failures shouldn't break user experience
      return null;
    }
  }

  // =====================================================
  // ALGORITHM-SPECIFIC TRACKING METHODS
  // =====================================================

  /**
   * Track search request with algorithm parameters
   */
  static async trackSearchRequest(userId, searchParams, results, responseTime, req) {
    const properties = {
      // Buyer location
      buyer_lat: searchParams.buyer?.latitude || searchParams.buyer?.lat,
      buyer_lng: searchParams.buyer?.longitude || searchParams.buyer?.lng,
      
      // Algorithm configuration
      proximity_weight: searchParams.config?.proximity_weight || searchParams.config?.proximityWeight,
      shelf_life_weight: searchParams.config?.shelf_life_weight || searchParams.config?.shelfLifeWeight,
      max_radius: searchParams.config?.max_radius || searchParams.config?.maxRadius,
      min_freshness: searchParams.config?.min_freshness || searchParams.config?.minFreshness,
      sort_by: searchParams.config?.sort_by || searchParams.config?.sortBy,
      sort_order: searchParams.config?.sort_order || searchParams.config?.sortOrder,
      display_mode: searchParams.config?.display_mode || searchParams.config?.displayMode,
      storage_conditions: searchParams.config?.storage_conditions,
      
      // Results
      results_count: results?.length || 0,
      top_product_id: results?.[0]?.id,
      top_product_score: results?.[0]?.combined_score,
      
      // Performance
      response_time_ms: responseTime,
      
      // Additional context
      endpoint: req?.originalUrl || req?.url,
      method: req?.method
    };

    return await this.trackEvent({
      userId,
      eventName: 'search_request',
      properties,
      sessionId: req?.sessionID,
      userAgent: req?.get('User-Agent'),
      ipAddress: req?.ip || req?.connection?.remoteAddress
    });
  }

  /**
   * Track preference changes
   */
  static async trackPreferenceChange(userId, oldPreferences, newPreferences, req) {
    const properties = {
      // Changes in weights
      proximity_weight_before: oldPreferences?.proximity_weight,
      proximity_weight_after: newPreferences?.proximity_weight,
      shelf_life_weight_before: oldPreferences?.shelf_life_weight,
      shelf_life_weight_after: newPreferences?.shelf_life_weight,
      
      // Changes in other settings
      max_radius_before: oldPreferences?.max_radius_km,
      max_radius_after: newPreferences?.max_radius_km,
      min_freshness_before: oldPreferences?.min_freshness_percent,
      min_freshness_after: newPreferences?.min_freshness_percent,
      display_mode_before: oldPreferences?.display_mode,
      display_mode_after: newPreferences?.display_mode,
      
      // What changed (for easy querying)
      changed_fields: this._getChangedFields(oldPreferences, newPreferences)
    };

    return await this.trackEvent({
      userId,
      eventName: 'preference_change',
      properties,
      sessionId: req?.sessionID,
      userAgent: req?.get('User-Agent'),
      ipAddress: req?.ip
    });
  }

  /**
   * Track algorithm performance metrics
   */
  static async trackAlgorithmPerformance({ userId = null, responseTime, productCount, algorithmTime, queryTime, req }) {
    const properties = {
      total_response_time_ms: responseTime,
      algorithm_execution_time_ms: algorithmTime,
      database_query_time_ms: queryTime,
      products_processed: productCount,
      efficiency_ratio: algorithmTime > 0 ? (productCount / algorithmTime) : 0
    };

    return await this.trackEvent({
      userId,
      eventName: 'algorithm_performance',
      properties,
      sessionId: req?.sessionID,
      userAgent: req?.get('User-Agent'),
      ipAddress: req?.ip
    });
  }

  // =====================================================
  // BUSINESS METRICS TRACKING
  // =====================================================

  /**
   * Track product creation
   */
  static async trackProductCreated(userId, product, req) {
    const properties = {
      product_id: product.id,
      product_type_id: product.product_type_id,
      price: product.price,
      quantity: product.quantity,
      days_already_used: product.days_already_used,
      storage_condition: product.storage_condition,
      has_image: !!product.image_url
    };

    return await this.trackEvent({
      userId,
      eventName: 'product_created',
      properties,  
      sessionId: req?.sessionID,
      userAgent: req?.get('User-Agent'),
      ipAddress: req?.ip
    });
  }

  /**
   * Track product views
   */
  static async trackProductViewed(userId, productId, req) {
    const properties = {
      product_id: productId,
      view_source: req?.get('Referer') ? 'search_results' : 'direct'
    };

    return await this.trackEvent({
      userId,
      eventName: 'product_viewed',
      properties,
      sessionId: req?.sessionID,
      userAgent: req?.get('User-Agent'),
      ipAddress: req?.ip
    });
  }

  /**
   * Track order events
   */
  static async trackOrderCreated(userId, order, req) {
    const properties = {
      order_id: order.id,
      product_id: order.product_id,
      seller_id: order.seller_id,
      quantity: order.quantity,
      total_amount: order.total_amount,
      payment_method: order.payment_method
    };

    return await this.trackEvent({
      userId,
      eventName: 'order_created',
      properties,
      sessionId: req?.sessionID,
      userAgent: req?.get('User-Agent'),
      ipAddress: req?.ip
    });
  }

  /**
   * Track login/logout events
   */
  static async trackUserLogin(userId, req) {
    const properties = {
      login_method: 'email_password'
    };

    return await this.trackEvent({
      userId,
      eventName: 'user_login',
      properties,
      sessionId: req?.sessionID,
      userAgent: req?.get('User-Agent'),
      ipAddress: req?.ip
    });
  }

  static async trackUserLogout(userId, req) {
    return await this.trackEvent({
      userId,
      eventName: 'user_logout',
      properties: {},
      sessionId: req?.sessionID,
      userAgent: req?.get('User-Agent'),
      ipAddress: req?.ip
    });
  }

  // =====================================================
  // ANALYTICS QUERY METHODS
  // =====================================================

  /**
   * Get algorithm analytics (most common weight presets, average response time, etc.)
   */
  static async getAlgorithmAnalytics(dateRange = '7 days') {
    try {
      // Most common weight presets
      const weightPresetsQuery = await query(`
        SELECT 
          (event_properties->>'proximity_weight')::integer as proximity_weight,
          (event_properties->>'shelf_life_weight')::integer as shelf_life_weight,
          COUNT(*) as usage_count
        FROM analytics_events 
        WHERE event_name = 'search_request' 
          AND timestamp >= NOW() - INTERVAL '${dateRange}'
          AND event_properties->>'proximity_weight' IS NOT NULL
        GROUP BY proximity_weight, shelf_life_weight
        ORDER BY usage_count DESC
        LIMIT 10
      `);

      // Average response time
      const performanceQuery = await query(`
        SELECT 
          AVG((event_properties->>'response_time_ms')::numeric) as avg_response_time,
          AVG((event_properties->>'results_count')::numeric) as avg_results_count,
          COUNT(*) as total_searches
        FROM analytics_events 
        WHERE event_name = 'search_request' 
          AND timestamp >= NOW() - INTERVAL '${dateRange}'
      `);

      // Popular product types in search results
      const productTypesQuery = await query(`
        SELECT 
          pt.name as product_type,
          COUNT(*) as search_appearances
        FROM analytics_events ae
        JOIN products p ON p.id = (ae.event_properties->>'top_product_id')::integer
        JOIN product_types pt ON pt.id = p.product_type_id
        WHERE ae.event_name = 'search_request' 
          AND ae.timestamp >= NOW() - INTERVAL '${dateRange}'
          AND ae.event_properties->>'top_product_id' IS NOT NULL
        GROUP BY pt.name
        ORDER BY search_appearances DESC
        LIMIT 10
      `);

      return {
        weight_presets: weightPresetsQuery.rows,
        performance: performanceQuery.rows[0],
        popular_product_types: productTypesQuery.rows
      };
    } catch (error) {
      console.error('Analytics query error:', error);
      throw error;
    }
  }

  /**
   * Get business analytics for a specific seller (or all if admin)
   */
  static async getSellerAnalytics(sellerId = null, dateRange = '30 days') {
    try {
      const userFilter = sellerId ? `AND user_id = ${sellerId}` : '';
      
      // Product creation stats
      const productStatsQuery = await query(`
        SELECT 
          COUNT(*) as total_products_created,
          AVG((event_properties->>'price')::numeric) as avg_price,
          AVG((event_properties->>'days_already_used')::integer) as avg_days_used
        FROM analytics_events 
        WHERE event_name = 'product_created' 
          AND timestamp >= NOW() - INTERVAL '${dateRange}'
          ${userFilter}
      `);

      // Order statistics
      const orderStatsQuery = await query(`
        SELECT 
          COUNT(*) as total_orders,
          SUM((event_properties->>'total_amount')::numeric) as total_revenue
        FROM analytics_events 
        WHERE event_name = 'order_created' 
          AND timestamp >= NOW() - INTERVAL '${dateRange}'
          ${sellerId ? `AND (event_properties->>'seller_id')::integer = ${sellerId}` : ''}
      `);

      return {
        products: productStatsQuery.rows[0],
        orders: orderStatsQuery.rows[0]
      };
    } catch (error) {
      console.error('Seller analytics query error:', error);
      throw error;
    }
  }

  /**
   * Get system performance analytics
   */
  static async getSystemPerformance(dateRange = '24 hours') {
    try {
      const performanceQuery = await query(`
        SELECT 
          AVG((event_properties->>'total_response_time_ms')::numeric) as avg_response_time,
          AVG((event_properties->>'algorithm_execution_time_ms')::numeric) as avg_algorithm_time,
          AVG((event_properties->>'database_query_time_ms')::numeric) as avg_query_time,
          AVG((event_properties->>'products_processed')::numeric) as avg_products_processed
        FROM analytics_events 
        WHERE event_name = 'algorithm_performance' 
          AND timestamp >= NOW() - INTERVAL '${dateRange}'
      `);

      // Request volume by hour
      const volumeQuery = await query(`
        SELECT 
          DATE_TRUNC('hour', timestamp) as hour,
          COUNT(*) as request_count
        FROM analytics_events 
        WHERE event_name = 'search_request' 
          AND timestamp >= NOW() - INTERVAL '${dateRange}'
        GROUP BY hour
        ORDER BY hour
      `);

      return {
        performance: performanceQuery.rows[0],
        hourly_volume: volumeQuery.rows
      };
    } catch (error) {
      console.error('Performance analytics query error:', error);
      throw error;
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Compare two preference objects and return list of changed fields
   */
  static _getChangedFields(oldPrefs, newPrefs) {
    const changes = [];
    const fieldsToCheck = [
      'proximity_weight', 'shelf_life_weight', 'max_radius_km', 
      'min_freshness_percent', 'display_mode', 'storage_condition'
    ];

    for (const field of fieldsToCheck) {
      if (oldPrefs[field] !== newPrefs[field]) {
        changes.push(field);
      }
    }

    return changes;
  }

  /**
   * Calculate percentage change
   */
  static _percentageChange(oldValue, newValue) {
    if (!oldValue || oldValue === 0) return null;
    return ((newValue - oldValue) / oldValue) * 100;
  }
}

module.exports = AnalyticsService;