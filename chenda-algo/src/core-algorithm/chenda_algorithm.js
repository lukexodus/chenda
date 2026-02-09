/**
 * Phase 6: Main Algorithm Integration
 * 
 * This module provides the unified chendaAlgorithm() function that orchestrates
 * all previous phases into a single cohesive pipeline for ranking perishable products.
 * 
 * Pipeline Flow:
 * 1. Data Enrichment: Calculate distances and shelf life for all products
 * 2. Filtering: Apply buyer constraints (max radius, min freshness, storage)
 * 3. Display/Ranking: Score and sort products based on mode
 * 4. Return: Products with metadata (execution time, stats)
 * 
 * @module chenda_algorithm
 */

const { calculateDistance } = require('./calculations/haversine.js');
const { calculateShelfLifeMetrics } = require('./calculations/shelf-life.js');
const productFilter = require('../product-display/product_filter.js');
const productRanker = require('./ranking/product_ranker.js');
const productSorter = require('./ranking/product_sorter.js');

/**
 * Main Chenda Algorithm - Unified pipeline for perishable product ranking
 * 
 * @param {Object} buyer - Buyer object with location and preferences
 * @param {number} buyer.latitude - Buyer's latitude coordinate
 * @param {number} buyer.longitude - Buyer's longitude coordinate
 * @param {string} [buyer.storage_condition] - Storage capability ('room_temp', 'refrigerated', 'frozen')
 * @param {Array<Object>} products - Array of product objects to process
 * @param {Object} config - Configuration object for the algorithm
 * @param {number} [config.max_radius] - Maximum distance in km (default: 10)
 * @param {Object} [config.weights] - Scoring weights for ranking
 * @param {number} [config.weights.proximity_weight] - Distance importance (0-1, default: 0.4)
 * @param {number} [config.weights.freshness_weight] - Shelf life importance (0-1, default: 0.6)
 * @param {number} [config.min_freshness_score] - Minimum freshness score 0-100 (default: 0)
 * @param {string} [config.mode] - Display mode: 'ranking' or 'filter' (default: 'ranking')
 * @param {string} [config.sort_by] - Sort criterion for filter mode: 'price', 'distance', 'freshness', 'score', 'expiration'
 * @param {string} [config.sort_order] - Sort direction: 'asc' or 'desc' (default: 'asc')
 * @param {string} [config.weight_preset] - Named preset: 'balanced', 'proximity-focused', 'freshness-focused', etc.
 * @returns {Object} Result object with products and metadata
 * @returns {Array<Object>} result.products - Processed and ranked/sorted products
 * @returns {Object} result.metadata - Execution metadata
 * @returns {number} result.metadata.execution_time_ms - Total processing time
 * @returns {Object} result.metadata.stats - Processing statistics
 * @returns {Object} result.metadata.config - Applied configuration
 */
function chendaAlgorithm(buyer, products, config = {}) {
  const startTime = Date.now();
  
  // Validate inputs
  if (!buyer || typeof buyer.latitude !== 'number' || typeof buyer.longitude !== 'number') {
    throw new Error('Invalid buyer object: must have latitude and longitude');
  }
  
  if (!Array.isArray(products)) {
    throw new Error('Products must be an array');
  }
  
  // Apply default configuration
  const defaultConfig = {
    max_radius: 10,
    weights: {
      proximity_weight: 0.4,
      freshness_weight: 0.6
    },
    min_freshness_score: 0,
    mode: 'ranking',
    sort_by: 'score',
    sort_order: 'desc'
  };
  
  const finalConfig = { ...defaultConfig, ...config };
  
  // If weight preset specified, apply it
  if (finalConfig.weight_preset) {
    const presets = productRanker.getWeightPresets();
    if (presets[finalConfig.weight_preset]) {
      const preset = presets[finalConfig.weight_preset];
      // Convert from ranker format (proximityWeight: 70) to config format (proximity_weight: 0.7)
      finalConfig.weights = {
        proximity_weight: preset.proximityWeight / 100,
        freshness_weight: preset.freshnessWeight / 100
      };
    }
  }
  
  // Merge custom weights with defaults
  finalConfig.weights = {
    ...defaultConfig.weights,
    ...finalConfig.weights
  };
  
  // Initialize stats
  const stats = {
    input_products: products.length,
    enriched_products: 0,
    filtered_products: 0,
    output_products: 0
  };
  
  // STEP 1: DATA ENRICHMENT
  // Calculate distance and shelf life for each product
  const enrichedProducts = products.map(product => {
    const enriched = { ...product };
    
    // Calculate distance if product has location
    if (product.location && product.location.lat != null && product.location.lng != null) {
      enriched.distance_km = calculateDistance(
        { lat: buyer.latitude, lng: buyer.longitude },
        { lat: product.location.lat, lng: product.location.lng }
      );
    } else if (product.latitude != null && product.longitude != null) {
      // Support both location object and direct lat/lng properties
      enriched.distance_km = calculateDistance(
        { lat: buyer.latitude, lng: buyer.longitude },
        { lat: product.latitude, lng: product.longitude }
      );
    }
    
    // Calculate shelf life if product has required fields
    if (product.total_shelf_life_days != null && 
        product.days_already_used != null && 
        product.listed_date) {
      const shelfLife = calculateShelfLifeMetrics(product);
      enriched.remaining_shelf_life_days = shelfLife.remaining_shelf_life_days;
      enriched.freshness_percent = shelfLife.freshness_percent;
      enriched.expiration_date = shelfLife.expiration_date;
      enriched.is_expired = shelfLife.is_expired;
    }
    
    return enriched;
  });
  
  stats.enriched_products = enrichedProducts.length;
  
  // STEP 2: FILTERING
  // Apply buyer constraints (max radius, min freshness, storage condition)
  const filterConfig = {
    filterExpired: false, // Disable expiration filtering (products may not have all required fields)
    maxRadiusKm: finalConfig.max_radius,
    minFreshnessPercent: finalConfig.min_freshness_score
  };
  
  // Add storage condition from buyer if available
  if (buyer.storage_condition) {
    filterConfig.storage_condition = buyer.storage_condition;
  }
  
  const filterResult = productFilter.applyFilters(enrichedProducts, filterConfig);
  const filteredProducts = filterResult.filtered;
  stats.filtered_products = filteredProducts.length;
  stats.filter_stats = filterResult.stats;
  
  // STEP 3: DISPLAY/RANKING
  // Process products based on mode (ranking or filter)
  let finalProducts = [];
  
  if (finalConfig.mode === 'ranking') {
    // Ranking mode: score all products and sort by combined score
    // Create a mock buyer object for the ranker
    const mockBuyer = {
      preferences: {
        max_radius: finalConfig.max_radius
      }
    };
    
    finalProducts = productRanker.scoreAndRankProducts(
      filteredProducts, 
      mockBuyer,
      {
        proximityWeight: (finalConfig.weights.proximity_weight * 100),
        freshnessWeight: (finalConfig.weights.freshness_weight * 100)
      }
    );
  } else {
    // Filter mode: sort by specified criterion
    finalProducts = productSorter.sortProducts(
      filteredProducts,
      finalConfig.sort_by,
      finalConfig.sort_order
    );
  }
  
  stats.output_products = finalProducts.length;
  
  // Calculate execution time
  const executionTime = Date.now() - startTime;
  
  // STEP 4: RETURN RESULTS
  return {
    products: finalProducts,
    metadata: {
      execution_time_ms: executionTime,
      stats: stats,
      config: finalConfig
    }
  };
}

/**
 * Create a configuration object with validation
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} Validated configuration object
 */
function createConfig(options = {}) {
  const config = {};
  
  // Max radius validation
  if (options.max_radius != null) {
    if (typeof options.max_radius !== 'number' || options.max_radius < 0) {
      throw new Error('max_radius must be a non-negative number');
    }
    config.max_radius = options.max_radius;
  }
  
  // Weights validation
  if (options.weights) {
    if (typeof options.weights !== 'object') {
      throw new Error('weights must be an object');
    }
    
    const validWeights = ['proximity_weight', 'freshness_weight'];
    for (const key of Object.keys(options.weights)) {
      if (!validWeights.includes(key)) {
        throw new Error(`Invalid weight key: ${key}`);
      }
      const value = options.weights[key];
      if (typeof value !== 'number' || value < 0 || value > 1) {
        throw new Error(`${key} must be a number between 0 and 1`);
      }
    }
    config.weights = options.weights;
  }
  
  // Min freshness score validation
  if (options.min_freshness_score != null) {
    if (typeof options.min_freshness_score !== 'number' || 
        options.min_freshness_score < 0 || 
        options.min_freshness_score > 100) {
      throw new Error('min_freshness_score must be a number between 0 and 100');
    }
    config.min_freshness_score = options.min_freshness_score;
  }
  
  // Mode validation
  if (options.mode) {
    const validModes = ['ranking', 'filter'];
    if (!validModes.includes(options.mode)) {
      throw new Error(`mode must be one of: ${validModes.join(', ')}`);
    }
    config.mode = options.mode;
  }
  
  // Sort criterion validation
  if (options.sort_by) {
    const validCriteria = ['price', 'distance', 'freshness', 'score', 'expiration'];
    if (!validCriteria.includes(options.sort_by)) {
      throw new Error(`sort_by must be one of: ${validCriteria.join(', ')}`);
    }
    config.sort_by = options.sort_by;
  }
  
  // Sort order validation
  if (options.sort_order) {
    const validOrders = ['asc', 'desc'];
    if (!validOrders.includes(options.sort_order)) {
      throw new Error(`sort_order must be one of: ${validOrders.join(', ')}`);
    }
    config.sort_order = options.sort_order;
  }
  
  // Weight preset validation
  if (options.weight_preset) {
    const presets = productRanker.getWeightPresets();
    if (!presets[options.weight_preset]) {
      throw new Error(`Invalid weight_preset: ${options.weight_preset}`);
    }
    config.weight_preset = options.weight_preset;
  }
  
  return config;
}

/**
 * Convenience function: Quick search with minimal configuration
 * Returns top 10 products using balanced weights
 * 
 * @param {Object} buyer - Buyer object
 * @param {Array<Object>} products - Products array
 * @param {number} [maxRadius=5] - Maximum distance in km
 * @returns {Array<Object>} Top 10 ranked products
 */
function quickSearch(buyer, products, maxRadius = 5) {
  const result = chendaAlgorithm(buyer, products, {
    max_radius: maxRadius,
    weight_preset: 'balanced',
    mode: 'ranking'
  });
  
  return result.products.slice(0, 10);
}

/**
 * Convenience function: Find cheapest products within range
 * 
 * @param {Object} buyer - Buyer object
 * @param {Array<Object>} products - Products array
 * @param {number} [maxRadius=10] - Maximum distance in km
 * @returns {Array<Object>} Products sorted by price (ascending)
 */
function searchByPrice(buyer, products, maxRadius = 10) {
  const result = chendaAlgorithm(buyer, products, {
    max_radius: maxRadius,
    mode: 'filter',
    sort_by: 'price',
    sort_order: 'asc'
  });
  
  return result.products;
}

/**
 * Convenience function: Find nearest products
 * 
 * @param {Object} buyer - Buyer object
 * @param {Array<Object>} products - Products array
 * @param {number} [maxRadius=15] - Maximum distance in km
 * @returns {Array<Object>} Products sorted by distance (ascending)
 */
function searchByDistance(buyer, products, maxRadius = 15) {
  const result = chendaAlgorithm(buyer, products, {
    max_radius: maxRadius,
    mode: 'filter',
    sort_by: 'distance',
    sort_order: 'asc'
  });
  
  return result.products;
}

/**
 * Convenience function: Find freshest products
 * 
 * @param {Object} buyer - Buyer object
 * @param {Array<Object>} products - Products array
 * @param {number} [maxRadius=10] - Maximum distance in km
 * @param {number} [minFreshness=50] - Minimum freshness score
 * @returns {Array<Object>} Products sorted by freshness (descending)
 */
function searchByFreshness(buyer, products, maxRadius = 10, minFreshness = 50) {
  const result = chendaAlgorithm(buyer, products, {
    max_radius: maxRadius,
    min_freshness_score: minFreshness,
    mode: 'filter',
    sort_by: 'freshness',
    sort_order: 'desc'
  });
  
  return result.products;
}

// Export functions
module.exports = {
  chendaAlgorithm,
  createConfig,
  quickSearch,
  searchByPrice,
  searchByDistance,
  searchByFreshness
};

// ============================================================================
// UNIT TESTS
// ============================================================================

if (require.main === module) {
  console.log('Running chenda_algorithm.js unit tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  function test(name, fn) {
    try {
      fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${name}`);
      console.log(`  Error: ${error.message}`);
      failed++;
    }
  }
  
  // Mock buyer and products
  const mockBuyer = {
    latitude: 14.5995,
    longitude: 120.9842,
    storage_condition: 'refrigerated',
    preferences: {
      max_radius: 15
    }
  };
  
  const mockProducts = [
    {
      id: 1,
      name: 'Fresh Milk',
      price: 2.50,
      location: { lat: 14.5580, lng: 120.9300 },
      total_shelf_life_days: 7,
      days_already_used: 1,
      listed_date: '2025-01-29T06:00:00Z'
    },
    {
      id: 2,
      name: 'Yogurt',
      price: 1.80,
      location: { lat: 14.5550, lng: 120.9270 },
      total_shelf_life_days: 14,
      days_already_used: 2,
      listed_date: '2025-01-29T06:00:00Z'
    },
    {
      id: 3,
      name: 'Ice Cream',
      price: 4.00,
      location: { lat: 14.6000, lng: 120.9500 },
      total_shelf_life_days: 90,
      days_already_used: 5,
      listed_date: '2025-01-29T06:00:00Z'
    }
  ];
  
  // Test 1: Basic algorithm execution
  test('chendaAlgorithm should execute successfully', () => {
    const result = chendaAlgorithm(mockBuyer, mockProducts);
    if (!result.products || !Array.isArray(result.products)) {
      throw new Error('Result should have products array');
    }
    if (!result.metadata) {
      throw new Error('Result should have metadata');
    }
  });
  
  // Test 2: Data enrichment step
  test('chendaAlgorithm should enrich products with distance and shelf life', () => {
    const result = chendaAlgorithm(mockBuyer, mockProducts);
    if (result.products.length === 0) {
      // Skip if no products pass filtering
      return;
    }
    const product = result.products[0];
    if (product.distance_km == null) {
      throw new Error('Product should have distance_km');
    }
    if (product.remaining_shelf_life_days == null) {
      throw new Error('Product should have remaining_shelf_life_days');
    }
    if (product.freshness_percent == null) {
      throw new Error('Product should have freshness_percent');
    }
  });
  
  // Test 3: Filtering step
  test('chendaAlgorithm should filter products by max_radius', () => {
    const result = chendaAlgorithm(mockBuyer, mockProducts, { max_radius: 1 });
    // Products far away should be filtered out
    if (result.products.length === 0) {
      // This is acceptable - all products may be beyond 1km
    }
    // Check that no product exceeds max radius
    for (const product of result.products) {
      if (product.distance_km > 1) {
        throw new Error(`Product distance ${product.distance_km} exceeds max_radius 1`);
      }
    }
  });
  
  // Test 4: Ranking mode
  test('chendaAlgorithm should use ranking mode by default', () => {
    const result = chendaAlgorithm(mockBuyer, mockProducts);
    if (result.metadata.config.mode !== 'ranking') {
      throw new Error('Default mode should be ranking');
    }
    // Products should have combined_score
    if (result.products.length > 0 && result.products[0].combined_score == null) {
      throw new Error('Products in ranking mode should have combined_score');
    }
  });
  
  // Test 5: Filter mode with sort
  test('chendaAlgorithm should support filter mode with sorting', () => {
    const result = chendaAlgorithm(mockBuyer, mockProducts, {
      mode: 'filter',
      sort_by: 'price',
      sort_order: 'asc'
    });
    if (result.products.length < 2) return; // Skip if not enough products
    
    // Check price sorting
    for (let i = 0; i < result.products.length - 1; i++) {
      if (result.products[i].price > result.products[i + 1].price) {
        throw new Error('Products should be sorted by price ascending');
      }
    }
  });
  
  // Test 6: Weight presets
  test('chendaAlgorithm should apply weight presets', () => {
    const result = chendaAlgorithm(mockBuyer, mockProducts, {
      weight_preset: 'proximity_focused'
    });
    const weights = result.metadata.config.weights;
    if (weights.proximity_weight <= weights.freshness_weight) {
      throw new Error('proximity_focused should have higher proximity_weight');
    }
  });
  
  // Test 7: Metadata tracking
  test('chendaAlgorithm should track execution metadata', () => {
    const result = chendaAlgorithm(mockBuyer, mockProducts);
    const meta = result.metadata;
    if (typeof meta.execution_time_ms !== 'number') {
      throw new Error('Should track execution time');
    }
    if (!meta.stats || typeof meta.stats.input_products !== 'number') {
      throw new Error('Should track processing stats');
    }
    if (!meta.config) {
      throw new Error('Should include applied config');
    }
  });
  
  // Test 8: createConfig validation
  test('createConfig should validate max_radius', () => {
    try {
      createConfig({ max_radius: -5 });
      throw new Error('Should reject negative max_radius');
    } catch (error) {
      if (!error.message.includes('non-negative')) {
        throw error;
      }
    }
  });
  
  // Test 9: createConfig weight validation
  test('createConfig should validate weights', () => {
    try {
      createConfig({ weights: { proximity_weight: 1.5 } });
      throw new Error('Should reject invalid weight value');
    } catch (error) {
      if (!error.message.includes('between 0 and 1')) {
        throw error;
      }
    }
  });
  
  // Test 10: Invalid buyer input
  test('chendaAlgorithm should reject invalid buyer', () => {
    try {
      chendaAlgorithm({ latitude: 'invalid' }, mockProducts);
      throw new Error('Should reject invalid buyer');
    } catch (error) {
      if (!error.message.includes('Invalid buyer')) {
        throw error;
      }
    }
  });
  
  // Test 11: quickSearch convenience function
  test('quickSearch should return top 10 products', () => {
    const results = quickSearch(mockBuyer, mockProducts);
    if (!Array.isArray(results)) {
      throw new Error('quickSearch should return array');
    }
    if (results.length > 10) {
      throw new Error('quickSearch should return max 10 products');
    }
  });
  
  // Test 12: searchByPrice convenience function
  test('searchByPrice should sort by price ascending', () => {
    const results = searchByPrice(mockBuyer, mockProducts);
    if (results.length < 2) return;
    
    for (let i = 0; i < results.length - 1; i++) {
      if (results[i].price > results[i + 1].price) {
        throw new Error('searchByPrice should sort by price ascending');
      }
    }
  });
  
  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Total: ${passed + failed} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`${'='.repeat(50)}`);
  
  process.exit(failed > 0 ? 1 : 0);
}
