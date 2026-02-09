/**
 * Chenda - Product Filter Module
 * Phase 3: Filtering Logic (Tasks 3.1, 3.2, 3.3)
 * 
 * Purpose: Filter products based on expiration, proximity, and freshness criteria
 * Integrates with Phase 2 modules and provides complete filtering pipeline
 * 
 * Filter Types:
 * 1. Expiration Filter (Task 3.1) - Remove expired products
 * 2. Proximity Filter (Task 3.2) - Filter by distance radius
 * 3. Freshness Filter (Task 3.3) - Filter by minimum freshness threshold
 */

// Import Phase 2 filter functions
const { filterExpiredProducts, filterByFreshness } = require('../core-algorithm/calculations/shelf-life');

/**
 * Filter products by proximity radius
 * Task 3.2: Remove products beyond max distance
 * 
 * @param {Array<Object>} products - Products with distance_km property
 * @param {number} maxRadiusKm - Maximum distance in kilometers
 * @returns {Array<Object>} Products within radius
 * @throws {Error} If inputs are invalid
 * 
 * @example
 * const products = [
 *   { id: 1, distance_km: 5 },
 *   { id: 2, distance_km: 15 },
 *   { id: 3, distance_km: 25 }
 * ];
 * const nearby = filterByProximity(products, 20);
 * // Returns: [{ id: 1, distance_km: 5 }, { id: 2, distance_km: 15 }]
 */
function filterByProximity(products, maxRadiusKm) {
  // Validate inputs
  if (!Array.isArray(products)) {
    throw new Error('products must be an array');
  }
  
  if (typeof maxRadiusKm !== 'number' || isNaN(maxRadiusKm)) {
    throw new Error('maxRadiusKm must be a number');
  }
  
  if (maxRadiusKm <= 0) {
    throw new Error(`maxRadiusKm must be positive (got ${maxRadiusKm})`);
  }
  
  // Filter products within radius
  return products.filter(product => {
    if (!product || typeof product !== 'object') {
      throw new Error('Each product must be an object');
    }
    
    if (typeof product.distance_km !== 'number') {
      throw new Error(`Product ${product.id || 'unknown'} missing distance_km property`);
    }
    
    if (isNaN(product.distance_km)) {
      throw new Error(`Product ${product.id || 'unknown'} has invalid distance_km (NaN)`);
    }
    
    return product.distance_km <= maxRadiusKm;
  });
}

/**
 * Apply multiple filters in sequence
 * Complete filtering pipeline with configurable options
 * 
 * @param {Array<Object>} products - Products with all required metrics
 * @param {Object} filterConfig - Filter configuration
 * @param {boolean} filterConfig.filterExpired - Apply expiration filter (default: true)
 * @param {number|null} filterConfig.maxRadiusKm - Max distance (null = no filter)
 * @param {number|null} filterConfig.minFreshnessPercent - Min freshness (null = no filter)
 * @param {Date} filterConfig.currentDate - Current date for expiration check
 * @returns {Object} Filtered products and statistics
 * 
 * @example
 * const result = applyFilters(products, {
 *   filterExpired: true,
 *   maxRadiusKm: 30,
 *   minFreshnessPercent: 50,
 *   currentDate: new Date()
 * });
 * // Returns: { filtered: [...], stats: {...} }
 */
function applyFilters(products, filterConfig = {}) {
  // Validate inputs
  if (!Array.isArray(products)) {
    throw new Error('products must be an array');
  }
  
  if (!filterConfig || typeof filterConfig !== 'object') {
    throw new Error('filterConfig must be an object');
  }
  
  // Default configuration
  const config = {
    filterExpired: filterConfig.filterExpired !== false, // Default: true
    maxRadiusKm: filterConfig.maxRadiusKm || null,
    minFreshnessPercent: filterConfig.minFreshnessPercent || null,
    currentDate: filterConfig.currentDate || new Date()
  };
  
  // Track statistics
  const stats = {
    initial: products.length,
    afterExpiration: 0,
    afterProximity: 0,
    afterFreshness: 0,
    final: 0,
    removedExpired: 0,
    removedProximity: 0,
    removedFreshness: 0
  };
  
  let filtered = [...products];
  
  // Step 1: Filter expired products (if enabled)
  if (config.filterExpired) {
    const beforeCount = filtered.length;
    filtered = filterExpiredProducts(filtered, config.currentDate);
    stats.afterExpiration = filtered.length;
    stats.removedExpired = beforeCount - filtered.length;
  } else {
    stats.afterExpiration = filtered.length;
  }
  
  // Step 2: Filter by proximity radius (if configured)
  if (config.maxRadiusKm !== null) {
    const beforeCount = filtered.length;
    filtered = filterByProximity(filtered, config.maxRadiusKm);
    stats.afterProximity = filtered.length;
    stats.removedProximity = beforeCount - filtered.length;
  } else {
    stats.afterProximity = filtered.length;
  }
  
  // Step 3: Filter by minimum freshness (if configured)
  if (config.minFreshnessPercent !== null) {
    const beforeCount = filtered.length;
    filtered = filterByFreshness(filtered, config.minFreshnessPercent);
    stats.afterFreshness = filtered.length;
    stats.removedFreshness = beforeCount - filtered.length;
  } else {
    stats.afterFreshness = filtered.length;
  }
  
  stats.final = filtered.length;
  
  return {
    filtered,
    stats
  };
}

/**
 * Create filter configuration from buyer preferences
 * Convenience function to convert buyer object to filter config
 * 
 * @param {Object} buyer - Buyer object with preferences
 * @param {Date} currentDate - Current date for expiration check
 * @returns {Object} Filter configuration
 * 
 * @example
 * const buyer = {
 *   preferences: {
 *     max_radius_km: 30,
 *     min_freshness_percent: 50
 *   }
 * };
 * const config = createFilterConfig(buyer);
 * // Returns: { filterExpired: true, maxRadiusKm: 30, minFreshnessPercent: 50, currentDate: ... }
 */
function createFilterConfig(buyer, currentDate = new Date()) {
  if (!buyer || typeof buyer !== 'object') {
    throw new Error('buyer must be an object');
  }
  
  if (!buyer.preferences || typeof buyer.preferences !== 'object') {
    throw new Error('buyer must have a preferences object');
  }
  
  return {
    filterExpired: true, // Always filter expired
    maxRadiusKm: buyer.preferences.max_radius_km || null,
    minFreshnessPercent: buyer.preferences.min_freshness_percent || null,
    currentDate
  };
}

/**
 * Filter products based on buyer preferences
 * High-level function combining buyer preferences with filtering
 * 
 * @param {Array<Object>} products - Products with all required metrics
 * @param {Object} buyer - Buyer object with preferences
 * @param {Date} currentDate - Current date for expiration check
 * @returns {Object} Filtered products and statistics
 * 
 * @example
 * const result = filterForBuyer(products, buyer);
 * console.log(`${result.filtered.length} products match buyer preferences`);
 */
function filterForBuyer(products, buyer, currentDate = new Date()) {
  const config = createFilterConfig(buyer, currentDate);
  return applyFilters(products, config);
}

/**
 * Get filter summary statistics
 * Human-readable summary of filtering results
 * 
 * @param {Object} stats - Statistics object from applyFilters
 * @returns {Object} Summary with percentages and descriptions
 * 
 * @example
 * const summary = getFilterSummary(stats);
 * console.log(summary.message);
 * // "Filtered 100 products → 45 results (55% removed)"
 */
function getFilterSummary(stats) {
  const totalRemoved = stats.initial - stats.final;
  const removalRate = stats.initial > 0 ? ((totalRemoved / stats.initial) * 100).toFixed(1) : 0;
  const retentionRate = stats.initial > 0 ? ((stats.final / stats.initial) * 100).toFixed(1) : 0;
  
  return {
    message: `Filtered ${stats.initial} products → ${stats.final} results (${totalRemoved} removed, ${removalRate}% removal rate)`,
    totalRemoved,
    removalRate: parseFloat(removalRate),
    retentionRate: parseFloat(retentionRate),
    breakdown: {
      expired: `${stats.removedExpired} expired (${stats.initial > 0 ? ((stats.removedExpired / stats.initial) * 100).toFixed(1) : 0}%)`,
      proximity: `${stats.removedProximity} out of range (${stats.initial > 0 ? ((stats.removedProximity / stats.initial) * 100).toFixed(1) : 0}%)`,
      freshness: `${stats.removedFreshness} not fresh enough (${stats.initial > 0 ? ((stats.removedFreshness / stats.initial) * 100).toFixed(1) : 0}%)`
    }
  };
}

/**
 * Check if product passes all filters (without filtering array)
 * Useful for single product validation
 * 
 * @param {Object} product - Product with all required metrics
 * @param {Object} filterConfig - Filter configuration
 * @returns {Object} Pass/fail result with reasons
 * 
 * @example
 * const result = checkProductFilters(product, config);
 * if (!result.passes) {
 *   console.log(`Rejected: ${result.reasons.join(', ')}`);
 * }
 */
function checkProductFilters(product, filterConfig = {}) {
  const config = {
    filterExpired: filterConfig.filterExpired !== false,
    maxRadiusKm: filterConfig.maxRadiusKm || null,
    minFreshnessPercent: filterConfig.minFreshnessPercent || null,
    currentDate: filterConfig.currentDate || new Date()
  };
  
  const reasons = [];
  let passes = true;
  
  // Check expiration
  if (config.filterExpired && product.is_expired) {
    reasons.push('Product has expired');
    passes = false;
  }
  
  // Check proximity
  if (config.maxRadiusKm !== null && product.distance_km > config.maxRadiusKm) {
    reasons.push(`Beyond max radius (${product.distance_km}km > ${config.maxRadiusKm}km)`);
    passes = false;
  }
  
  // Check freshness
  if (config.minFreshnessPercent !== null && product.freshness_percent < config.minFreshnessPercent) {
    reasons.push(`Below min freshness (${product.freshness_percent.toFixed(1)}% < ${config.minFreshnessPercent}%)`);
    passes = false;
  }
  
  return {
    passes,
    reasons,
    productId: product.id
  };
}

// Export functions
module.exports = {
  // Core filters
  filterByProximity,
  filterExpiredProducts,  // Re-export from shelf_life_calculator
  filterByFreshness,      // Re-export from shelf_life_calculator
  
  // Pipeline functions
  applyFilters,
  filterForBuyer,
  
  // Utility functions
  createFilterConfig,
  getFilterSummary,
  checkProductFilters
};

// Run unit tests if executed directly
if (require.main === module) {
  console.log('🧪 Running Product Filter Unit Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  function test(description, fn) {
    try {
      fn();
      console.log(`✓ ${description}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${description}`);
      console.log(`  Error: ${error.message}`);
      failed++;
    }
  }
  
  // Test 1: Proximity filter - within radius
  test('Proximity filter: Keep products within radius', () => {
    const products = [
      { id: 1, distance_km: 5 },
      { id: 2, distance_km: 15 },
      { id: 3, distance_km: 25 }
    ];
    const filtered = filterByProximity(products, 20);
    if (filtered.length !== 2) throw new Error(`Expected 2, got ${filtered.length}`);
    if (filtered[0].id !== 1 || filtered[1].id !== 2) throw new Error('Wrong products filtered');
  });
  
  // Test 2: Proximity filter - all within
  test('Proximity filter: All products within radius', () => {
    const products = [
      { id: 1, distance_km: 5 },
      { id: 2, distance_km: 10 }
    ];
    const filtered = filterByProximity(products, 50);
    if (filtered.length !== 2) throw new Error(`Expected 2, got ${filtered.length}`);
  });
  
  // Test 3: Proximity filter - all beyond
  test('Proximity filter: All products beyond radius', () => {
    const products = [
      { id: 1, distance_km: 25 },
      { id: 2, distance_km: 35 }
    ];
    const filtered = filterByProximity(products, 20);
    if (filtered.length !== 0) throw new Error(`Expected 0, got ${filtered.length}`);
  });
  
  // Test 4: Proximity filter - edge case (exactly at radius)
  test('Proximity filter: Product exactly at max radius (inclusive)', () => {
    const products = [{ id: 1, distance_km: 20 }];
    const filtered = filterByProximity(products, 20);
    if (filtered.length !== 1) throw new Error('Should include product at exact radius');
  });
  
  // Test 5: Complete filter pipeline - all filters
  test('Filter pipeline: Apply all filters', () => {
    const futureDate = new Date('2026-12-31');
    const pastDate = new Date('2025-01-01');
    const currentDate = new Date('2026-02-06');
    
    const products = [
      { id: 1, distance_km: 5, freshness_percent: 80, expiration_date: futureDate },
      { id: 2, distance_km: 15, freshness_percent: 60, expiration_date: futureDate },
      { id: 3, distance_km: 25, freshness_percent: 90, expiration_date: futureDate },
      { id: 4, distance_km: 5, freshness_percent: 40, expiration_date: futureDate },
      { id: 5, distance_km: 10, freshness_percent: 80, expiration_date: pastDate }
    ];
    
    const result = applyFilters(products, {
      filterExpired: true,
      maxRadiusKm: 20,
      minFreshnessPercent: 50,
      currentDate
    });
    
    // Should keep: id 1 (close, fresh), id 2 (within range, fresh enough)
    // Should remove: id 3 (too far), id 4 (not fresh enough), id 5 (expired)
    if (result.filtered.length !== 2) throw new Error(`Expected 2, got ${result.filtered.length}`);
    if (result.stats.removedExpired !== 1) throw new Error('Should remove 1 expired');
    if (result.stats.removedProximity !== 1) throw new Error('Should remove 1 by proximity');
    if (result.stats.removedFreshness !== 1) throw new Error('Should remove 1 by freshness');
  });
  
  // Test 6: Filter pipeline - no filters applied
  test('Filter pipeline: No filters (all pass through)', () => {
    const futureDate = new Date('2026-12-31');
    const products = [
      { id: 1, distance_km: 5, freshness_percent: 80, expiration_date: futureDate },
      { id: 2, distance_km: 15, freshness_percent: 60, expiration_date: futureDate }
    ];
    
    const result = applyFilters(products, {
      filterExpired: false,
      maxRadiusKm: null,
      minFreshnessPercent: null
    });
    
    if (result.filtered.length !== 2) throw new Error('All should pass');
  });
  
  // Test 7: Filter pipeline - only expiration filter
  test('Filter pipeline: Only expiration filter', () => {
    const futureDate = new Date('2026-12-31');
    const pastDate = new Date('2025-01-01');
    const products = [
      { id: 1, distance_km: 5, freshness_percent: 80, expiration_date: futureDate },
      { id: 2, distance_km: 15, freshness_percent: 60, expiration_date: pastDate }
    ];
    
    const result = applyFilters(products, {
      filterExpired: true,
      maxRadiusKm: null,
      minFreshnessPercent: null
    });
    
    if (result.filtered.length !== 1) throw new Error(`Expected 1, got ${result.filtered.length}`);
    if (result.stats.removedExpired !== 1) throw new Error('Should remove 1 expired');
  });
  
  // Test 8: Create filter config from buyer
  test('Create filter config from buyer preferences', () => {
    const buyer = {
      preferences: {
        max_radius_km: 30,
        min_freshness_percent: 50
      }
    };
    
    const config = createFilterConfig(buyer);
    if (config.maxRadiusKm !== 30) throw new Error('Max radius not set correctly');
    if (config.minFreshnessPercent !== 50) throw new Error('Min freshness not set correctly');
    if (!config.filterExpired) throw new Error('Should filter expired by default');
  });
  
  // Test 9: Filter for buyer
  test('Filter for buyer: High-level function', () => {
    const futureDate = new Date('2026-12-31');
    const products = [
      { id: 1, distance_km: 5, freshness_percent: 80, expiration_date: futureDate },
      { id: 2, distance_km: 35, freshness_percent: 90, expiration_date: futureDate },
      { id: 3, distance_km: 10, freshness_percent: 40, expiration_date: futureDate }
    ];
    
    const buyer = {
      preferences: {
        max_radius_km: 30,
        min_freshness_percent: 50
      }
    };
    
    const result = filterForBuyer(products, buyer);
    if (result.filtered.length !== 1) throw new Error(`Expected 1, got ${result.filtered.length}`);
    if (result.filtered[0].id !== 1) throw new Error('Should keep product 1 only');
  });
  
  // Test 10: Filter summary
  test('Get filter summary statistics', () => {
    const stats = {
      initial: 100,
      final: 45,
      removedExpired: 10,
      removedProximity: 30,
      removedFreshness: 15
    };
    
    const summary = getFilterSummary(stats);
    if (summary.totalRemoved !== 55) throw new Error('Wrong total removed');
    if (summary.removalRate !== 55.0) throw new Error('Wrong removal rate');
    if (summary.retentionRate !== 45.0) throw new Error('Wrong retention rate');
  });
  
  // Test 11: Check single product filters
  test('Check product filters: Passes all', () => {
    const product = {
      id: 1,
      distance_km: 10,
      freshness_percent: 80,
      is_expired: false
    };
    
    const result = checkProductFilters(product, {
      maxRadiusKm: 30,
      minFreshnessPercent: 50
    });
    
    if (!result.passes) throw new Error('Should pass all filters');
    if (result.reasons.length !== 0) throw new Error('Should have no rejection reasons');
  });
  
  // Test 12: Check single product filters - fails multiple
  test('Check product filters: Fails multiple filters', () => {
    const product = {
      id: 1,
      distance_km: 35,
      freshness_percent: 40,
      is_expired: true
    };
    
    const result = checkProductFilters(product, {
      maxRadiusKm: 30,
      minFreshnessPercent: 50
    });
    
    if (result.passes) throw new Error('Should fail filters');
    if (result.reasons.length !== 3) throw new Error(`Should have 3 reasons, got ${result.reasons.length}`);
  });
  
  // Test 13: Error handling - invalid max radius
  test('Error: Invalid max radius (negative)', () => {
    try {
      filterByProximity([{ id: 1, distance_km: 5 }], -10);
      throw new Error('Should have thrown error');
    } catch (e) {
      if (!e.message.includes('must be positive')) throw e;
    }
  });
  
  // Test 14: Error handling - products not array
  test('Error: Products not an array', () => {
    try {
      filterByProximity({}, 30);
      throw new Error('Should have thrown error');
    } catch (e) {
      if (!e.message.includes('must be an array')) throw e;
    }
  });
  
  // Test 15: Error handling - missing distance_km
  test('Error: Product missing distance_km', () => {
    try {
      filterByProximity([{ id: 1 }], 30);
      throw new Error('Should have thrown error');
    } catch (e) {
      if (!e.message.includes('missing distance_km')) throw e;
    }
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}
