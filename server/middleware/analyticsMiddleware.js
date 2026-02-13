const AnalyticsService = require('../services/analyticsService');

/**
 * Analytics Middleware for automatic event tracking
 * Measures response times and provides tracking utilities
 */

/**
 * Middleware to track API response times and performance
 */
const responseTimeTracker = (req, res, next) => {
  const startTime = Date.now();

  // Add analytics helper to request object
  req.analytics = {
    startTime,
    
    // Helper method to track events from controllers
    track: (eventName, properties = {}, userId = null) => {
      return AnalyticsService.trackEvent({
        userId: userId || req.user?.id || null,
        eventName,
        properties,
        sessionId: req.sessionID,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip || req.connection?.remoteAddress
      });
    },
    
    // Helper for search tracking
    trackSearch: (searchParams, results, algorithmTime = null) => {
      const responseTime = Date.now() - startTime;
      return AnalyticsService.trackSearchRequest(
        req.user?.id || null,
        searchParams,
        results,
        responseTime,
        req,
        algorithmTime
      );
    },
    
    // Helper for performance tracking
    trackPerformance: (productCount, algorithmTime = null, queryTime = null) => {
      const responseTime = Date.now() - startTime;
      return AnalyticsService.trackAlgorithmPerformance({
        userId: req.user?.id || null,
        responseTime,
        productCount,
        algorithmTime,
        queryTime,
        req
      });
    }
  };

  // Override res.json to capture response time
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Add response time to response headers (for debugging)
    res.set('X-Response-Time', `${responseTime}ms`);
    
    // Track API performance for key endpoints
    if (shouldTrackEndpoint(req.originalUrl)) {
      AnalyticsService.trackEvent({
        userId: req.user?.id || null,
        eventName: 'api_request',
        properties: {
          endpoint: req.originalUrl,
          method: req.method,
          response_time_ms: responseTime,
          status_code: res.statusCode,
          user_type: req.user?.type || 'anonymous'
        },
        sessionId: req.sessionID,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }).catch(err => {
        // Log analytics errors but don't affect user experience
        console.error('Analytics tracking error:', err);
      });
    }
    
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Helper function to determine if endpoint should be tracked
 */
function shouldTrackEndpoint(url) {
  // Track important API endpoints, exclude health checks and static files
  const trackablePatterns = [
    '/api/products/search',
    '/api/products/',
    '/api/auth/',
    '/api/users/',
    '/api/orders/'
  ];
  
  const excludePatterns = [
    '/api/health',
    '/uploads/',
    '/favicon.ico'
  ];
  
  // Don't track excluded patterns
  if (excludePatterns.some(pattern => url.includes(pattern))) {
    return false;
  }
  
  // Track if matches trackable patterns
  return trackablePatterns.some(pattern => url.includes(pattern));
}

/**
 * Middleware specifically for search endpoints to track search patterns
 */
const searchAnalyticsMiddleware = (req, res, next) => {
  // Store search start time for performance tracking
  req.searchStartTime = Date.now();
  
  // Override res.json for search endpoints to auto-track
  const originalJson = res.json;
  res.json = function(data) {
    // Auto-track search if this is a successful search response
    if (res.statusCode === 200 && data.success && data.products) {
      const searchTime = Date.now() - req.searchStartTime;
      
      // Track the search request
      req.analytics?.trackSearch(
        req.body, // search parameters
        data.products, // results
        data.algorithm_time || null // algorithm execution time
      ).catch(err => {
        console.error('Search analytics error:', err);
      });
    }
    
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware to track user login/logout events
 */
const authAnalyticsMiddleware = (req, res, next) => {
  // Store original res.json
  const originalJson = res.json;
  
  res.json = function(data) {
    // Track successful login
    if (req.originalUrl.includes('/login') && res.statusCode === 200 && data.success) {
      AnalyticsService.trackUserLogin(data.user?.id, req).catch(err => {
        console.error('Login analytics error:', err);
      });
    }
    
    // Track logout (successful logout returns success: true)
    if (req.originalUrl.includes('/logout') && res.statusCode === 200 && data.success) {
      AnalyticsService.trackUserLogout(req.user?.id, req).catch(err => {
        console.error('Logout analytics error:', err);
      });
    }
    
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware to track preference changes
 */
const preferenceAnalyticsMiddleware = (req, res, next) => {
  // Store original preferences before update
  if (req.originalUrl.includes('/preferences') && req.method === 'PUT') {
    // Get current user preferences before the update
    req.originalPreferences = req.user?.preferences || {};
  }
  
  const originalJson = res.json;
  res.json = function(data) {
    // Track preference changes
    if (req.originalUrl.includes('/preferences') && 
        req.method === 'PUT' && 
        res.statusCode === 200 && 
        data.success) {
      
      AnalyticsService.trackPreferenceChange(
        req.user?.id,
        req.originalPreferences,
        req.body, // new preferences
        req
      ).catch(err => {
        console.error('Preference analytics error:', err);
      });
    }
    
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Weight distribution tracker - tracks the most common weight combinations
 */
const trackWeightDistribution = async (proximityWeight, shelfLifeWeight, userId = null) => {
  // Categorize weight preferences
  let category = 'balanced';
  if (proximityWeight > 70) category = 'proximity_focused';
  if (shelfLifeWeight > 70) category = 'freshness_focused';
  
  return AnalyticsService.trackEvent({
    userId,
    eventName: 'weight_distribution',
    properties: {
      proximity_weight: proximityWeight,
      shelf_life_weight: shelfLifeWeight,
      category
    }
  });
};

/**
 * Performance monitoring - track slow queries
 */
const performanceMonitor = {
  /**
   * Track database query performance
   */
  trackQuery: async (queryName, executionTime, userId = null) => {
    // Only track slow queries (> 100ms)
    if (executionTime > 100) {
      return AnalyticsService.trackEvent({
        userId,
        eventName: 'slow_query',
        properties: {
          query_name: queryName,
          execution_time_ms: executionTime
        }
      });
    }
  },

  /**
   * Track memory usage
   */
  trackMemoryUsage: async () => {
    const memUsage = process.memoryUsage();
    return AnalyticsService.trackEvent({
      userId: null,
      eventName: 'memory_usage',
      properties: {
        rss_mb: Math.round(memUsage.rss / 1024 / 1024),
        heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
        external_mb: Math.round(memUsage.external / 1024 / 1024)
      }
    });
  }
};

/**
 * Error tracking middleware
 */
const errorAnalyticsMiddleware = (err, req, res, next) => {
  // Track errors (but don't track 404s as errors)
  if (res.statusCode >= 500) {
    AnalyticsService.trackEvent({
      userId: req.user?.id || null,
      eventName: 'server_error',
      properties: {
        error_message: err.message,
        error_stack: err.stack?.substring(0, 500), // Truncate stack trace
        endpoint: req.originalUrl,
        method: req.method,
        status_code: res.statusCode
      },
      sessionId: req.sessionID,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    }).catch(analyticsErr => {
      console.error('Error analytics tracking failed:', analyticsErr);
    });
  }

  next(err);
};

module.exports = {
  responseTimeTracker,
  searchAnalyticsMiddleware,
  authAnalyticsMiddleware,
  preferenceAnalyticsMiddleware,
  trackWeightDistribution,
  performanceMonitor,
  errorAnalyticsMiddleware
};