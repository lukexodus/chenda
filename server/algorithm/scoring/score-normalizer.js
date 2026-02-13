/**
 * Chenda - Score Normalization Module
 * Task 2.3: Normalize proximity and freshness metrics to 0-100 scores
 * 
 * Purpose: Convert distance (km) and freshness (%) to comparable 0-100 scores
 * for the ranking algorithm
 * 
 * Normalization Rules:
 * - Proximity: 0 km = 100 score, max_radius km = 0 score (linear inverse)
 * - Freshness: Already 0-100%, may apply curve adjustments if needed
 */

/**
 * Normalize proximity distance to 0-100 score
 * Closer products get higher scores
 * 
 * @param {number} distance_km - Distance in kilometers
 * @param {number} max_radius_km - Maximum search radius in kilometers
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Score from 0-100 (100 = closest, 0 = at max radius)
 * @throws {Error} If inputs are invalid
 * 
 * @example
 * const score1 = normalizeProximityScore(0, 50);    // 100.00 (same location)
 * const score2 = normalizeProximityScore(25, 50);   // 50.00 (halfway)
 * const score3 = normalizeProximityScore(50, 50);   // 0.00 (at max radius)
 * const score4 = normalizeProximityScore(10, 50);   // 80.00 (very close)
 */
function normalizeProximityScore(distance_km, max_radius_km, decimals = 2) {
  // Validate inputs
  if (typeof distance_km !== 'number' || typeof max_radius_km !== 'number') {
    throw new Error('distance_km and max_radius_km must be numbers');
  }
  
  if (isNaN(distance_km) || isNaN(max_radius_km)) {
    throw new Error('distance_km and max_radius_km cannot be NaN');
  }
  
  if (distance_km < 0) {
    throw new Error(`distance_km cannot be negative (got ${distance_km})`);
  }
  
  if (max_radius_km <= 0) {
    throw new Error(`max_radius_km must be positive (got ${max_radius_km})`);
  }
  
  // Products beyond max radius get 0 score
  if (distance_km >= max_radius_km) {
    return 0;
  }
  
  // Linear inverse normalization: score = 100 * (1 - distance/max_radius)
  // 0 km → 100 score
  // max_radius/2 → 50 score
  // max_radius → 0 score
  const score = 100 * (1 - (distance_km / max_radius_km));
  
  // Round to specified decimals
  return Number(score.toFixed(decimals));
}

/**
 * Normalize freshness percentage to 0-100 score
 * Currently a pass-through since freshness is already 0-100%
 * Function exists for consistency and future enhancements (e.g., curves)
 * 
 * @param {number} freshness_percent - Freshness percentage (0-100)
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Score from 0-100
 * @throws {Error} If inputs are invalid
 * 
 * @example
 * const score1 = normalizeFreshnessScore(100);   // 100.00 (perfect)
 * const score2 = normalizeFreshnessScore(82.14); // 82.14 (good)
 * const score3 = normalizeFreshnessScore(50);    // 50.00 (fair)
 * const score4 = normalizeFreshnessScore(10);    // 10.00 (near expiry)
 */
function normalizeFreshnessScore(freshness_percent, decimals = 2) {
  // Validate inputs
  if (typeof freshness_percent !== 'number') {
    throw new Error('freshness_percent must be a number');
  }
  
  if (isNaN(freshness_percent)) {
    throw new Error('freshness_percent cannot be NaN');
  }
  
  if (freshness_percent < 0 || freshness_percent > 100) {
    throw new Error(`freshness_percent must be between 0-100 (got ${freshness_percent})`);
  }
  
  // Currently pass-through (already 0-100)
  // Future enhancement: could apply curves (e.g., exponential decay near expiration)
  const score = freshness_percent;
  
  // Round to specified decimals
  return Number(score.toFixed(decimals));
}

/**
 * Normalize both proximity and freshness scores for a product
 * Convenience function to normalize both metrics at once
 * 
 * @param {Object} params - Parameters object
 * @param {number} params.distance_km - Distance in kilometers
 * @param {number} params.freshness_percent - Freshness percentage
 * @param {number} params.max_radius_km - Maximum search radius
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {Object} Normalized scores {proximity_score, freshness_score}
 * @throws {Error} If inputs are invalid
 * 
 * @example
 * const scores = normalizeScores({
 *   distance_km: 10,
 *   freshness_percent: 82.14,
 *   max_radius_km: 50
 * });
 * // Returns: { proximity_score: 80.00, freshness_score: 82.14 }
 */
function normalizeScores(params, decimals = 2) {
  if (!params || typeof params !== 'object') {
    throw new Error('params must be an object');
  }
  
  const { distance_km, freshness_percent, max_radius_km } = params;
  
  return {
    proximity_score: normalizeProximityScore(distance_km, max_radius_km, decimals),
    freshness_score: normalizeFreshnessScore(freshness_percent, decimals)
  };
}

/**
 * Normalize scores for multiple products in batch
 * Efficient processing of arrays
 * 
 * @param {Array<Object>} products - Array of products with distance_km and freshness_percent
 * @param {number} max_radius_km - Maximum search radius
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {Array<Object>} Products enriched with proximity_score and freshness_score
 * @throws {Error} If inputs are invalid
 * 
 * @example
 * const enriched = normalizeScoresBatch([
 *   { id: 1, distance_km: 5, freshness_percent: 90 },
 *   { id: 2, distance_km: 15, freshness_percent: 75 }
 * ], 50);
 * // Returns: [
 * //   { id: 1, distance_km: 5, freshness_percent: 90, proximity_score: 90.00, freshness_score: 90.00 },
 * //   { id: 2, distance_km: 15, freshness_percent: 75, proximity_score: 70.00, freshness_score: 75.00 }
 * // ]
 */
function normalizeScoresBatch(products, max_radius_km, decimals = 2) {
  if (!Array.isArray(products)) {
    throw new Error('products must be an array');
  }
  
  if (typeof max_radius_km !== 'number' || max_radius_km <= 0) {
    throw new Error('max_radius_km must be a positive number');
  }
  
  return products.map(product => {
    // Validate each product has required fields
    if (!product || typeof product !== 'object') {
      throw new Error('Each product must be an object');
    }
    
    if (typeof product.distance_km !== 'number') {
      throw new Error(`Product missing distance_km: ${JSON.stringify(product)}`);
    }
    
    if (typeof product.freshness_percent !== 'number') {
      throw new Error(`Product missing freshness_percent: ${JSON.stringify(product)}`);
    }
    
    const scores = normalizeScores({
      distance_km: product.distance_km,
      freshness_percent: product.freshness_percent,
      max_radius_km
    }, decimals);
    
    return {
      ...product,
      proximity_score: scores.proximity_score,
      freshness_score: scores.freshness_score
    };
  });
}

// Export functions
module.exports = {
  normalizeProximityScore,
  normalizeFreshnessScore,
  normalizeScores,
  normalizeScoresBatch
};

// Run unit tests if executed directly
if (require.main === module) {
  console.log('🧪 Running Score Normalization Unit Tests...\n');
  
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
  
  // Test 1: Proximity normalization - same location
  test('Proximity: 0 km distance → 100 score', () => {
    const score = normalizeProximityScore(0, 50);
    if (score !== 100) throw new Error(`Expected 100, got ${score}`);
  });
  
  // Test 2: Proximity normalization - halfway
  test('Proximity: Halfway distance → 50 score', () => {
    const score = normalizeProximityScore(25, 50);
    if (score !== 50) throw new Error(`Expected 50, got ${score}`);
  });
  
  // Test 3: Proximity normalization - at max radius
  test('Proximity: Max radius distance → 0 score', () => {
    const score = normalizeProximityScore(50, 50);
    if (score !== 0) throw new Error(`Expected 0, got ${score}`);
  });
  
  // Test 4: Proximity normalization - beyond max radius
  test('Proximity: Beyond max radius → 0 score', () => {
    const score = normalizeProximityScore(60, 50);
    if (score !== 0) throw new Error(`Expected 0, got ${score}`);
  });
  
  // Test 5: Proximity normalization - very close
  test('Proximity: 10% of max radius → 90 score', () => {
    const score = normalizeProximityScore(5, 50);
    if (score !== 90) throw new Error(`Expected 90, got ${score}`);
  });
  
  // Test 6: Freshness normalization - perfect
  test('Freshness: 100% fresh → 100 score', () => {
    const score = normalizeFreshnessScore(100);
    if (score !== 100) throw new Error(`Expected 100, got ${score}`);
  });
  
  // Test 7: Freshness normalization - good
  test('Freshness: 82.14% fresh → 82.14 score', () => {
    const score = normalizeFreshnessScore(82.14);
    if (score !== 82.14) throw new Error(`Expected 82.14, got ${score}`);
  });
  
  // Test 8: Freshness normalization - near expiry
  test('Freshness: 10% fresh → 10 score', () => {
    const score = normalizeFreshnessScore(10);
    if (score !== 10) throw new Error(`Expected 10, got ${score}`);
  });
  
  // Test 9: Combined normalization
  test('Normalize both scores together', () => {
    const scores = normalizeScores({
      distance_km: 10,
      freshness_percent: 82.14,
      max_radius_km: 50
    });
    if (scores.proximity_score !== 80 || scores.freshness_score !== 82.14) {
      throw new Error(`Expected {80, 82.14}, got {${scores.proximity_score}, ${scores.freshness_score}}`);
    }
  });
  
  // Test 10: Batch normalization
  test('Normalize batch of products', () => {
    const products = [
      { id: 1, distance_km: 5, freshness_percent: 90 },
      { id: 2, distance_km: 25, freshness_percent: 50 }
    ];
    const enriched = normalizeScoresBatch(products, 50);
    if (enriched.length !== 2) throw new Error('Should return 2 products');
    if (enriched[0].proximity_score !== 90) throw new Error('First product proximity_score should be 90');
    if (enriched[1].freshness_score !== 50) throw new Error('Second product freshness_score should be 50');
  });
  
  // Test 11: Error handling - negative distance
  test('Error: Negative distance throws error', () => {
    try {
      normalizeProximityScore(-5, 50);
      throw new Error('Should have thrown error');
    } catch (e) {
      if (!e.message.includes('cannot be negative')) throw e;
    }
  });
  
  // Test 12: Error handling - invalid freshness
  test('Error: Freshness > 100 throws error', () => {
    try {
      normalizeFreshnessScore(150);
      throw new Error('Should have thrown error');
    } catch (e) {
      if (!e.message.includes('must be between 0-100')) throw e;
    }
  });
  
  // Test 13: Error handling - zero max radius
  test('Error: Zero max_radius throws error', () => {
    try {
      normalizeProximityScore(10, 0);
      throw new Error('Should have thrown error');
    } catch (e) {
      if (!e.message.includes('must be positive')) throw e;
    }
  });
  
  // Test 14: Decimal precision
  test('Decimal precision control', () => {
    const score = normalizeProximityScore(33.333, 50, 4);
    if (score !== 33.3340) throw new Error(`Expected 33.3340, got ${score}`);
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}
