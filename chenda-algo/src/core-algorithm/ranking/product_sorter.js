/**
 * Chenda - Product Sorting & Display Module
 * Phase 5: Sorting & Display Logic (Tasks 5.1-5.3)
 * 
 * Purpose: Provide multiple sorting modes for product display
 * - Ranking mode: Sort by combined score (proximity + freshness)
 * - Filter+Sort mode: Apply filters, then sort by price/freshness/distance
 * - Mode toggle: Switch between display modes
 * 
 * Integration:
 * - Uses product_ranker.js for ranking mode
 * - Uses product_filter.js for filtering
 * - Supports custom sort criteria
 */

const { scoreAndRankProducts, rankByScore } = require('./product_ranker');
const { applyFilters } = require('../../product-display/product_filter');

/**
 * Sort products by a specific criterion
 * 
 * @param {Array} products - Products to sort
 * @param {string} sortBy - Sort criterion: 'price', 'distance', 'freshness', 'score', 'expiration'
 * @param {string} order - Sort order: 'asc' or 'desc' (default: 'asc' for price/distance, 'desc' for freshness/score)
 * @returns {Array} Sorted products
 * 
 * @example
 * const sorted = sortProducts(products, 'price', 'asc');
 * // Returns products sorted by price (lowest first)
 * 
 * @example
 * const sorted = sortProducts(products, 'freshness', 'desc');
 * // Returns products sorted by freshness (highest first)
 */
function sortProducts(products, sortBy, order = null) {
  if (!Array.isArray(products)) {
    throw new Error('products must be an array');
  }

  if (products.length === 0) {
    return [];
  }

  // Determine default order based on sort criterion
  let defaultOrder;
  if (sortBy === 'price' || sortBy === 'distance') {
    defaultOrder = 'asc'; // Lower is better
  } else {
    defaultOrder = 'desc'; // Higher is better
  }

  const sortOrder = order || defaultOrder;

  // Validate sortBy
  const validCriteria = ['price', 'distance', 'freshness', 'score', 'expiration'];
  if (!validCriteria.includes(sortBy)) {
    throw new Error(`Invalid sortBy value: ${sortBy}. Must be one of: ${validCriteria.join(', ')}`);
  }

  // Map sortBy to property name
  const propertyMap = {
    'price': 'price',
    'distance': 'distance_km',
    'freshness': 'freshness_percent',
    'score': 'combined_score',
    'expiration': 'expiration_date'
  };

  const property = propertyMap[sortBy];

  // Validate all products have the required property
  const missingProperty = products.find(p => {
    if (sortBy === 'expiration') {
      return !p[property] || !(p[property] instanceof Date);
    }
    return typeof p[property] !== 'number' || isNaN(p[property]);
  });

  if (missingProperty) {
    throw new Error(`All products must have a valid ${property} property for sorting by ${sortBy}`);
  }

  // Sort products
  return [...products].sort((a, b) => {
    let valA = a[property];
    let valB = b[property];

    // Handle dates
    if (sortBy === 'expiration') {
      valA = valA.getTime();
      valB = valB.getTime();
    }

    if (sortOrder === 'asc') {
      return valA - valB;
    } else {
      return valB - valA;
    }
  });
}

/**
 * Ranking mode: Sort by combined score (Phase 4 integration)
 * 
 * @param {Array} products - Products with distance_km and freshness_percent
 * @param {Object} buyer - Buyer with preferences
 * @param {Object} options - Weight configuration
 * @returns {Array} Products sorted by combined_score (highest first)
 * 
 * @example
 * const ranked = rankingMode(products, buyer, {
 *   proximityWeight: 70,
 *   freshnessWeight: 30
 * });
 */
function rankingMode(products, buyer, options = {}) {
  // Use Phase 4 ranking function
  return scoreAndRankProducts(products, buyer, options);
}

/**
 * Filter+Sort mode: Apply filters, then sort by user choice
 * 
 * @param {Array} products - Products with complete metrics
 * @param {Object} buyer - Buyer with preferences
 * @param {Object} options - Configuration
 * @param {string} options.sortBy - Sort criterion: 'price', 'distance', 'freshness', 'score'
 * @param {string} options.order - Sort order: 'asc' or 'desc'
 * @param {boolean} options.applyFilter - Apply filters before sorting (default: true)
 * @returns {Object} { products: Array, summary: Object }
 * 
 * @example
 * const result = filterAndSortMode(products, buyer, {
 *   sortBy: 'price',
 *   order: 'asc',
 *   applyFilter: true
 * });
 * // Returns: { products: [...], summary: { initialCount, finalCount, removed } }
 */
function filterAndSortMode(products, buyer, options = {}) {
  const {
    sortBy = 'price',
    order = null,
    applyFilter = true
  } = options;

  if (!Array.isArray(products)) {
    throw new Error('products must be an array');
  }

  if (!buyer || !buyer.preferences) {
    throw new Error('buyer must have preferences object');
  }

  let processedProducts = products;
  let filterSummary = null;

  // Apply filters if enabled
  if (applyFilter) {
    const filterConfig = {
      maxRadiusKm: buyer.preferences.max_radius || buyer.preferences.max_radius_km || 50,
      minFreshnessPercent: buyer.preferences.min_freshness || null
    };

    const filterResult = applyFilters(products, filterConfig);
    
    // Extract filtered products and stats
    processedProducts = filterResult.filtered;
    filterSummary = {
      initialCount: filterResult.stats.initial,
      finalCount: filterResult.stats.final,
      removed: {
        expired: filterResult.stats.removedExpired,
        out_of_range: filterResult.stats.removedProximity,
        not_fresh_enough: filterResult.stats.removedFreshness
      }
    };
  }

  // Sort products
  const sortedProducts = sortProducts(processedProducts, sortBy, order);

  return {
    products: sortedProducts,
    summary: filterSummary
  };
}

/**
 * Display products with specified mode
 * Main entry point for Phase 5
 * 
 * @param {Array} products - Products with complete metrics
 * @param {Object} buyer - Buyer with preferences
 * @param {Object} config - Display configuration
 * @param {string} config.mode - Display mode: 'ranking' or 'filter'
 * @param {string} config.sortBy - Sort criterion (for filter mode)
 * @param {string} config.order - Sort order
 * @param {number} config.proximityWeight - Weight for proximity (ranking mode)
 * @param {number} config.freshnessWeight - Weight for freshness (ranking mode)
 * @returns {Object} { products: Array, mode: string, summary: Object }
 * 
 * @example
 * // Ranking mode
 * const result = displayProducts(products, buyer, {
 *   mode: 'ranking',
 *   proximityWeight: 70,
 *   freshnessWeight: 30
 * });
 * 
 * @example
 * // Filter mode
 * const result = displayProducts(products, buyer, {
 *   mode: 'filter',
 *   sortBy: 'price',
 *   order: 'asc'
 * });
 */
function displayProducts(products, buyer, config = {}) {
  const {
    mode = 'ranking',
    sortBy = 'price',
    order = null,
    proximityWeight = 50,
    freshnessWeight = 50
  } = config;

  // Validate mode
  if (mode !== 'ranking' && mode !== 'filter') {
    throw new Error(`Invalid mode: ${mode}. Must be 'ranking' or 'filter'`);
  }

  if (mode === 'ranking') {
    // Ranking mode: Score and rank by combined score
    const rankedProducts = rankingMode(products, buyer, {
      proximityWeight,
      freshnessWeight
    });

    return {
      products: rankedProducts,
      mode: 'ranking',
      summary: {
        count: rankedProducts.length,
        weights: { proximityWeight, freshnessWeight }
      }
    };
  } else {
    // Filter mode: Filter and sort by user choice
    const result = filterAndSortMode(products, buyer, {
      sortBy,
      order,
      applyFilter: true
    });

    return {
      products: result.products,
      mode: 'filter',
      summary: {
        ...result.summary,
        sortedBy: sortBy,
        sortOrder: order || (sortBy === 'price' || sortBy === 'distance' ? 'asc' : 'desc')
      }
    };
  }
}

/**
 * Toggle between display modes
 * Utility function to switch modes and preserve state
 * 
 * @param {string} currentMode - Current display mode
 * @returns {string} New display mode
 * 
 * @example
 * let mode = 'ranking';
 * mode = toggleMode(mode); // 'filter'
 * mode = toggleMode(mode); // 'ranking'
 */
function toggleMode(currentMode) {
  if (currentMode === 'ranking') {
    return 'filter';
  } else {
    return 'ranking';
  }
}

/**
 * Get available sort options for filter mode
 * 
 * @returns {Array} Array of sort option objects
 * 
 * @example
 * const options = getSortOptions();
 * // Returns: [
 * //   { value: 'price', label: 'Price', defaultOrder: 'asc' },
 * //   { value: 'distance', label: 'Distance', defaultOrder: 'asc' },
 * //   ...
 * // ]
 */
function getSortOptions() {
  return [
    { value: 'price', label: 'Price', defaultOrder: 'asc', description: 'Sort by price (lowest first)' },
    { value: 'distance', label: 'Distance', defaultOrder: 'asc', description: 'Sort by distance (nearest first)' },
    { value: 'freshness', label: 'Freshness', defaultOrder: 'desc', description: 'Sort by freshness (freshest first)' },
    { value: 'score', label: 'Combined Score', defaultOrder: 'desc', description: 'Sort by combined score (highest first)' },
    { value: 'expiration', label: 'Expiration Date', defaultOrder: 'asc', description: 'Sort by expiration (expires soonest first)' }
  ];
}

/**
 * Get mode description
 * 
 * @param {string} mode - Display mode
 * @returns {Object} Mode information
 * 
 * @example
 * const info = getModeDescription('ranking');
 * // Returns: { name: 'Ranking Mode', description: '...' }
 */
function getModeDescription(mode) {
  const descriptions = {
    'ranking': {
      name: 'Ranking Mode',
      description: 'Products ranked by combined proximity and freshness scores with adjustable weights',
      sortedBy: 'Combined Score',
      userControl: 'Adjust weight preferences'
    },
    'filter': {
      name: 'Filter & Sort Mode',
      description: 'Products filtered by preferences and sorted by your choice (price, distance, freshness)',
      sortedBy: 'User-selected criterion',
      userControl: 'Choose sort option'
    }
  };

  return descriptions[mode] || {
    name: 'Unknown Mode',
    description: 'Invalid mode'
  };
}

/**
 * Create display configuration object
 * Helper to build valid config
 * 
 * @param {string} mode - Display mode
 * @param {Object} options - Mode-specific options
 * @returns {Object} Display configuration
 * 
 * @example
 * const config = createDisplayConfig('ranking', {
 *   proximityWeight: 70,
 *   freshnessWeight: 30
 * });
 * 
 * @example
 * const config = createDisplayConfig('filter', {
 *   sortBy: 'price',
 *   order: 'asc'
 * });
 */
function createDisplayConfig(mode, options = {}) {
  const baseConfig = { mode };

  if (mode === 'ranking') {
    return {
      ...baseConfig,
      proximityWeight: options.proximityWeight || 50,
      freshnessWeight: options.freshnessWeight || 50
    };
  } else {
    return {
      ...baseConfig,
      sortBy: options.sortBy || 'price',
      order: options.order || null
    };
  }
}

// ============================================================================
// UNIT TESTS
// ============================================================================

function runTests() {
  console.log('🧪 Product Sorter Unit Tests\n');
  
  let passed = 0;
  let failed = 0;

  // Test helper
  function test(name, fn) {
    try {
      fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }

  // Mock data
  const mockProducts = [
    { id: 1, name: 'A', price: 100, distance_km: 5, freshness_percent: 80, combined_score: 85, expiration_date: new Date('2026-02-10') },
    { id: 2, name: 'B', price: 50, distance_km: 10, freshness_percent: 90, combined_score: 75, expiration_date: new Date('2026-02-15') },
    { id: 3, name: 'C', price: 75, distance_km: 3, freshness_percent: 70, combined_score: 90, expiration_date: new Date('2026-02-08') }
  ];

  const mockBuyer = {
    preferences: {
      max_radius: 50,
      min_freshness: 50
    }
  };

  // Test 1: Sort by price ascending
  test('Test 1: Sort by price - ascending', () => {
    const sorted = sortProducts(mockProducts, 'price', 'asc');
    if (sorted[0].price !== 50) throw new Error('First product should have lowest price');
    if (sorted[2].price !== 100) throw new Error('Last product should have highest price');
  });

  // Test 2: Sort by price descending
  test('Test 2: Sort by price - descending', () => {
    const sorted = sortProducts(mockProducts, 'price', 'desc');
    if (sorted[0].price !== 100) throw new Error('First product should have highest price');
    if (sorted[2].price !== 50) throw new Error('Last product should have lowest price');
  });

  // Test 3: Sort by distance ascending
  test('Test 3: Sort by distance - ascending (nearest first)', () => {
    const sorted = sortProducts(mockProducts, 'distance', 'asc');
    if (sorted[0].distance_km !== 3) throw new Error('First product should be nearest');
    if (sorted[2].distance_km !== 10) throw new Error('Last product should be farthest');
  });

  // Test 4: Sort by freshness descending
  test('Test 4: Sort by freshness - descending (freshest first)', () => {
    const sorted = sortProducts(mockProducts, 'freshness', 'desc');
    if (sorted[0].freshness_percent !== 90) throw new Error('First product should be freshest');
    if (sorted[2].freshness_percent !== 70) throw new Error('Last product should be least fresh');
  });

  // Test 5: Sort by combined score
  test('Test 5: Sort by score - descending (highest first)', () => {
    const sorted = sortProducts(mockProducts, 'score', 'desc');
    if (sorted[0].combined_score !== 90) throw new Error('First product should have highest score');
    if (sorted[2].combined_score !== 75) throw new Error('Last product should have lowest score');
  });

  // Test 6: Sort by expiration date
  test('Test 6: Sort by expiration - ascending (expires soonest first)', () => {
    const sorted = sortProducts(mockProducts, 'expiration', 'asc');
    if (sorted[0].expiration_date.getTime() !== new Date('2026-02-08').getTime()) {
      throw new Error('First product should expire soonest');
    }
  });

  // Test 7: Default order for price
  test('Test 7: Sort by price - default order (asc)', () => {
    const sorted = sortProducts(mockProducts, 'price');
    if (sorted[0].price !== 50) throw new Error('Default order for price should be ascending');
  });

  // Test 8: Default order for freshness
  test('Test 8: Sort by freshness - default order (desc)', () => {
    const sorted = sortProducts(mockProducts, 'freshness');
    if (sorted[0].freshness_percent !== 90) throw new Error('Default order for freshness should be descending');
  });

  // Test 9: Toggle mode
  test('Test 9: Toggle mode - ranking to filter', () => {
    const newMode = toggleMode('ranking');
    if (newMode !== 'filter') throw new Error('Should toggle to filter mode');
  });

  // Test 10: Toggle mode - filter to ranking
  test('Test 10: Toggle mode - filter to ranking', () => {
    const newMode = toggleMode('filter');
    if (newMode !== 'ranking') throw new Error('Should toggle to ranking mode');
  });

  // Test 11: Get sort options
  test('Test 11: Get sort options', () => {
    const options = getSortOptions();
    if (options.length !== 5) throw new Error('Should return 5 sort options');
    if (options[0].value !== 'price') throw new Error('First option should be price');
  });

  // Test 12: Get mode description
  test('Test 12: Get mode description - ranking', () => {
    const desc = getModeDescription('ranking');
    if (desc.name !== 'Ranking Mode') throw new Error('Wrong mode name');
  });

  // Test 13: Get mode description - filter
  test('Test 13: Get mode description - filter', () => {
    const desc = getModeDescription('filter');
    if (desc.name !== 'Filter & Sort Mode') throw new Error('Wrong mode name');
  });

  // Test 14: Create display config - ranking
  test('Test 14: Create display config - ranking mode', () => {
    const config = createDisplayConfig('ranking', { proximityWeight: 70, freshnessWeight: 30 });
    if (config.mode !== 'ranking') throw new Error('Mode should be ranking');
    if (config.proximityWeight !== 70) throw new Error('proximityWeight should be 70');
  });

  // Test 15: Create display config - filter
  test('Test 15: Create display config - filter mode', () => {
    const config = createDisplayConfig('filter', { sortBy: 'price', order: 'asc' });
    if (config.mode !== 'filter') throw new Error('Mode should be filter');
    if (config.sortBy !== 'price') throw new Error('sortBy should be price');
  });

  // Test 16: Empty array handling
  test('Test 16: Sort empty array', () => {
    const sorted = sortProducts([], 'price', 'asc');
    if (sorted.length !== 0) throw new Error('Should return empty array');
  });

  // Test 17: Invalid sort criterion
  test('Test 17: Invalid sort criterion', () => {
    try {
      sortProducts(mockProducts, 'invalid', 'asc');
      throw new Error('Should throw error for invalid criterion');
    } catch (error) {
      if (!error.message.includes('Invalid sortBy')) {
        throw new Error('Wrong error message');
      }
    }
  });

  // Test 18: Invalid mode
  test('Test 18: Display products - invalid mode', () => {
    try {
      displayProducts(mockProducts, mockBuyer, { mode: 'invalid' });
      throw new Error('Should throw error for invalid mode');
    } catch (error) {
      if (!error.message.includes('Invalid mode')) {
        throw new Error('Wrong error message');
      }
    }
  });

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`✅ ${passed} passed, ❌ ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log(`❌ ${failed} test(s) failed`);
  }
  
  return failed === 0;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  sortProducts,
  rankingMode,
  filterAndSortMode,
  displayProducts,
  toggleMode,
  getSortOptions,
  getModeDescription,
  createDisplayConfig
};

// Run tests if executed directly
if (require.main === module) {
  runTests();
}
