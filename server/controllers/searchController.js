/**
 * Search Controller
 * Integrates Product model with Chenda algorithm for product search
 */

const Product = require('../models/Product');
const { chendaAlgorithm } = require('../algorithm/chenda_algorithm');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * POST /api/products/search
 * Search for products using Chenda algorithm
 * 
 * Request body:
 * {
 *   "location": { "lat": number, "lng": number },
 *   "config": {
 *     "max_radius": number,        // km (default: buyer preference or 50)
 *     "mode": "ranking|filter",     // default: "ranking"
 *     "weights": {
 *       "proximity_weight": 0-1,    // default: 0.6
 *       "freshness_weight": 0-1    // default: 0.4
 *     },
 *     "min_freshness_score": 0-100, // default: buyer preference or 0
 *     "sort_by": "price|distance|freshness|score", // for filter mode
 *     "sort_order": "asc|desc",
 *     "limit": number               // max results (default: no limit)
 *   }
 * }
 */
const searchProducts =  asyncHandler(async (req, res, next) => {
  // Get buyer location from request or authenticated user
  let buyerLocation;
  
  if (req.body.location) {
    // Location provided in request body
    buyerLocation = req.body.location;
  } else if (req.user && req.user.location) {
    // Use authenticated user's location
    buyerLocation = {
      lat: req.user.location.coordinates[1],
      lng: req.user.location.coordinates[0]
    };
  } else {
    return res.status(400).json({
      success: false,
      message: 'Location is required. Provide location in request body or login.'
    });
  }

  // Validate location
  if (typeof buyerLocation.lat !== 'number' || typeof buyerLocation.lng !== 'number') {
    return res.status(400).json({
      success: false,
      message: 'Invalid location format. Expected: { lat: number, lng: number }'
    });
  }

  if (buyerLocation.lat < -90 || buyerLocation.lat > 90) {
    return res.status(400).json({
      success: false,
      message: 'Invalid latitude. Must be between -90 and 90.'
    });
  }

  if (buyerLocation.lng < -180 || buyerLocation.lng > 180) {
    return res.status(400).json({
      success: false,
      message: 'Invalid longitude. Must be between -180 and 180.'
    });
  }

  // Get algorithm configuration from request or user preferences
  const config = req.body.config || {};
  
  // Apply user preferences if authenticated
  if (req.user && req.user.preferences) {
    config.max_radius = config.max_radius || req.user.preferences.max_radius_km || 50;
    config.min_freshness_score = config.min_freshness_score !== undefined 
      ? config.min_freshness_score 
      : config.min_freshness !== undefined
        ? config.min_freshness
        : req.user.preferences.min_freshness_percent || 0;
    
    // Apply weight preferences (convert from 0-100 to 0-1 if needed)
    if (!config.weights && req.user.preferences) {
      const proximityWeight = req.user.preferences.proximity_weight || 60;
      const shelfLifeWeight = req.user.preferences.shelf_life_weight || 40;
      
      config.weights = {
        proximity_weight: proximityWeight / 100,
        freshness_weight: shelfLifeWeight / 100
      };
    }
    
    // Apply display mode preference
    config.mode = config.mode || req.user.preferences.display_mode || 'ranking';
  } else {
    // Default config for unauthenticated users
    config.max_radius = config.max_radius || 50;
    config.min_freshness_score = config.min_freshness_score !== undefined 
      ? config.min_freshness_score 
      : config.min_freshness !== undefined
        ? config.min_freshness
        : 0;
    config.mode = config.mode || 'ranking';
  }

  // Get filters from request
  const filters = {
    max_radius_km: config.max_radius,
    seller_id: config.seller_id || null,
    product_type_id: config.product_type_id || null,
    available_only: true
  };

  try {
    // Step 1: Get products from database with metrics
    const products = await Product.getProductsWithMetrics(buyerLocation, filters);

    if (products.length === 0) {
      // Track empty search results
      if (req.analytics) {
        req.analytics.trackSearch(
          {
            buyer: buyerLocation,
            config: config
          },
          [] // empty results
        ).catch(err => console.error('Search analytics error:', err));
      }
      
      return res.status(200).json({
        success: true,
        message: 'No products found matching your criteria',
        results: [],
        config: {
          mode: config.mode,
          max_radius: config.max_radius,
          min_freshness_score: config.min_freshness_score,
          proximity_weight: Math.round((config.weights?.proximity_weight || 0.4) * 100),
          freshness_weight: Math.round((config.weights?.freshness_weight || 0.6) * 100)
        },
        metadata: {
          config,
          stats: { input_products: 0, output_products: 0 }
        }
      });
    }

    // Step 2: Create buyer object for algorithm
    const buyer = {
      latitude: buyerLocation.lat,
      longitude: buyerLocation.lng,
      preferences: {
        max_radius: config.max_radius
      }
    };

    // Step 3: Run Chenda algorithm
    const algorithmResult = chendaAlgorithm(buyer, products, config);

    // Step 4: Apply limit if specified
    let finalProducts = algorithmResult.products;
    if (config.limit && config.limit > 0) {
      finalProducts = finalProducts.slice(0, config.limit);
    }

    // Step 5: Track search analytics
    if (req.analytics) {
      req.analytics.trackSearch(
        {
          buyer: buyerLocation,
          config: config
        },
        finalProducts
      ).catch(err => console.error('Search analytics error:', err));
    }

    // Step 6: Return results
    res.status(200).json({
      success: true,
      count: finalProducts.length,
      results: finalProducts,
      config: {
        mode: config.mode,
        max_radius: config.max_radius,
        min_freshness_score: config.min_freshness_score,
        proximity_weight: Math.round((config.weights?.proximity_weight || 0.4) * 100),
        freshness_weight: Math.round((config.weights?.freshness_weight || 0.6) * 100)
      },
      metadata: {
        ...algorithmResult.metadata,
        buyer_location: buyerLocation,
        applied_config: config
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: error.message
    });
  }
});

/**
 * GET /api/products/nearby
 * Quick search for nearby products (simplified endpoint)
 * 
 * Query params:
 * - lat: latitude
 * - lng: longitude
 * - radius: max distance in km (default: 10)
 * - limit: max results (default: 10)
 */
const getNearbyProducts = asyncHandler(async (req, res, next) => {
  // Get location from query params or authenticated user
  let lat, lng;
  
  if (req.query.lat && req.query.lng) {
    lat = parseFloat(req.query.lat);
    lng = parseFloat(req.query.lng);
  } else if (req.user && req.user.location) {
    lat = req.user.location.coordinates[1];
    lng = req.user.location.coordinates[0];
  } else {
    return res.status(400).json({
      success: false,
      message: 'Location is required. Provide lat/lng query params or login.'
    });
  }

  const radius = parseFloat(req.query.radius) || 10;
  const limit = parseInt(req.query.limit) || 10;

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid lat/lng values'
    });
  }

  // Validate coordinate ranges
  if (lat < -90 || lat > 90) {
    return res.status(400).json({
      success: false,
      message: 'Invalid latitude. Must be between -90 and 90.'
    });
  }

  if (lng < -180 || lng > 180) {
    return res.status(400).json({
      success: false,
      message: 'Invalid longitude. Must be between -180 and 180.'
    });
  }

  const buyerLocation = { lat, lng };
  const filters = {
    max_radius_km: radius,
    available_only: true
  };

  try {
    const products = await Product.getProductsWithMetrics(buyerLocation, filters);

    // Simple distance sorting (no algorithm processing)
    const limitedProducts = products.slice(0, limit);

    res.status(200).json({
      success: true,
      count: limitedProducts.length,
      products: limitedProducts,
      metadata: {
        buyer_location: buyerLocation,
        radius_km: radius,
        total_found: products.length
      }
    });

  } catch (error) {
    console.error('Nearby products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching nearby products',
      error: error.message
    });
  }
});

/**
 * GET /api/search/public
 * Public search endpoint using query parameters
 * 
 * Query parameters:
 * - lat, lng: buyer location
 * - radius: search radius in km (default: 50)
 * - proximity_weight: 0-100 (default: 50)
 * - freshness_weight: 0-100 (default: 50)
 * - min_freshness: 0-100 (default: 0)
 * - mode: "ranking" | "filter" (default: "ranking")
 * - sort_by: "score" | "price" | "distance" | "freshness" (default: "score")
 * - sort_order: "asc" | "desc" (default: "desc")
 * - limit: max results (default: no limit)
 */
const publicSearch = asyncHandler(async (req, res, next) => {
  // Extract location from query parameters
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({
      success: false,
      message: 'Valid lat and lng query parameters are required'
    });
  }

  // Validate coordinate ranges
  if (lat < -90 || lat > 90) {
    return res.status(400).json({
      success: false,
      message: 'Invalid latitude. Must be between -90 and 90.'
    });
  }

  if (lng < -180 || lng > 180) {
    return res.status(400).json({
      success: false,
      message: 'Invalid longitude. Must be between -180 and 180.'
    });
  }

  const buyerLocation = { lat, lng };

  // Build config from query parameters with defaults
  const proximity_weight_raw = parseFloat(req.query.proximity_weight) || 50;
  const freshness_weight_raw = parseFloat(req.query.freshness_weight) || 50;
  
  // Handle both decimal (0-1) and percentage (0-100) formats
  const proximity_weight = proximity_weight_raw <= 1 ? proximity_weight_raw : proximity_weight_raw / 100;
  const freshness_weight = freshness_weight_raw <= 1 ? freshness_weight_raw : freshness_weight_raw / 100;
  
  const config = {
    max_radius: parseFloat(req.query.radius) || 50,
    mode: req.query.mode || 'ranking',
    weights: {
      proximity_weight,
      freshness_weight
    },
    min_freshness_score: parseFloat(req.query.min_freshness) || 0,
    sort_by: req.query.sort_by || 'score',
    sort_order: req.query.sort_order || 'desc',
    limit: req.query.limit ? parseInt(req.query.limit) : undefined
  };

  // Validate weights sum to 1
  const totalWeight = config.weights.proximity_weight + config.weights.freshness_weight;
  if (Math.abs(totalWeight - 1.0) > 0.01) {
    return res.status(400).json({
      success: false,
      message: 'Proximity and freshness weights must sum to 100%'
    });
  }

  // Get products with location/distance metrics
  const filters = {
    max_radius_km: config.max_radius,
    min_freshness_percent: config.min_freshness_score,
    available_only: true
  };

  try {
    const products = await Product.getProductsWithMetrics(buyerLocation, filters);

    if (products.length === 0) {
      return res.json({
        success: true,
        count: 0,
        results: [],
        config: {
          ...config,
          proximity_weight: Math.round(config.weights.proximity_weight * 100),
          freshness_weight: Math.round(config.weights.freshness_weight * 100)
        },
        metadata: {
          buyer_location: buyerLocation,
          radius_km: config.max_radius,
          algorithm_mode: config.mode
        }
      });
    }

    // Create buyer object for algorithm with correct property names
    const buyer = {
      latitude: buyerLocation.lat,
      longitude: buyerLocation.lng
    };

    // Run algorithm with correct parameter order
    const algorithmResult = chendaAlgorithm(buyer, products, config);
    
    // Apply limit if specified
    let finalProducts = algorithmResult.products;
    if (config.limit && config.limit > 0) {
      finalProducts = finalProducts.slice(0, config.limit);
    }

    return res.json({
      success: true,
      count: finalProducts.length,
      results: finalProducts,
      config: {
        ...config,
        proximity_weight: Math.round(config.weights.proximity_weight * 100),
        freshness_weight: Math.round(config.weights.freshness_weight * 100)
      },
      metadata: {
        ...algorithmResult.metadata,
        buyer_location: buyerLocation
      }
    });

  } catch (error) {
    console.error('Public search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: error.message
    });
  }
});

module.exports = {
  searchProducts,
  getNearbyProducts,
  publicSearch
};
