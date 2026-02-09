/**
 * Chenda - Combined Score Calculator
 * Task 2.4: Calculate weighted combination of proximity and freshness scores
 * 
 * Purpose: Combine normalized scores (0-100) using user-defined weights
 * to produce a final ranking score
 * 
 * Formula: combined_score = (proximity_weight × proximity_score + freshness_weight × freshness_score) / 100
 * 
 * Weight Validation:
 * - Each weight must be 0-100
 * - Weights should typically sum to 100 (enforced with strict mode)
 * - Default: 50/50 split (equal priority)
 */

/**
 * Calculate combined score from normalized proximity and freshness scores
 * 
 * @param {number} proximity_score - Normalized proximity score (0-100)
 * @param {number} freshness_score - Normalized freshness score (0-100)
 * @param {number} proximity_weight - Weight for proximity (0-100)
 * @param {number} freshness_weight - Weight for freshness (0-100)
 * @param {Object} options - Optional configuration
 * @param {boolean} options.strict - If true, weights must sum to exactly 100 (default: true)
 * @param {number} options.decimals - Decimal places for result (default: 2)
 * @returns {number} Combined score (0-100)
 * @throws {Error} If inputs are invalid
 * 
 * @example
 * // Equal weights (50/50)
 * const score1 = calculateCombinedScore(80, 90, 50, 50);
 * // Returns: 85.00 (halfway between 80 and 90)
 * 
 * // Prioritize proximity (70/30)
 * const score2 = calculateCombinedScore(80, 90, 70, 30);
 * // Returns: 83.00 (closer to proximity score)
 * 
 * // Prioritize freshness (30/70)
 * const score3 = calculateCombinedScore(80, 90, 30, 70);
 * // Returns: 87.00 (closer to freshness score)
 */
function calculateCombinedScore(
  proximity_score, 
  freshness_score, 
  proximity_weight, 
  freshness_weight,
  options = {}
) {
  const { strict = true, decimals = 2 } = options;
  
  // Validate scores
  validateScore(proximity_score, 'proximity_score');
  validateScore(freshness_score, 'freshness_score');
  
  // Validate weights
  validateWeight(proximity_weight, 'proximity_weight');
  validateWeight(freshness_weight, 'freshness_weight');
  
  // Validate weight sum (if strict mode)
  if (strict) {
    const sum = proximity_weight + freshness_weight;
    if (sum !== 100) {
      throw new Error(
        `Weights must sum to 100 in strict mode (got ${proximity_weight} + ${freshness_weight} = ${sum}). ` +
        `Set strict=false to allow other sums.`
      );
    }
  }
  
  // Calculate weighted combination
  // Formula: (w1×s1 + w2×s2) / 100
  const combined = (proximity_weight * proximity_score + freshness_weight * freshness_score) / 100;
  
  // Round to specified decimals
  return Number(combined.toFixed(decimals));
}

/**
 * Calculate combined score with percentage weights
 * Alternative interface that accepts weights as percentages (0-1)
 * 
 * @param {number} proximity_score - Normalized proximity score (0-100)
 * @param {number} freshness_score - Normalized freshness score (0-100)
 * @param {number} proximity_weight_pct - Weight for proximity (0-1, e.g., 0.6 = 60%)
 * @param {number} freshness_weight_pct - Weight for freshness (0-1, e.g., 0.4 = 40%)
 * @param {Object} options - Optional configuration
 * @returns {number} Combined score (0-100)
 * 
 * @example
 * const score = calculateCombinedScorePercent(80, 90, 0.5, 0.5);
 * // Returns: 85.00 (same as 50/50 integer weights)
 */
function calculateCombinedScorePercent(
  proximity_score,
  freshness_score,
  proximity_weight_pct,
  freshness_weight_pct,
  options = {}
) {
  // Convert percentages to 0-100 scale
  const proximity_weight = proximity_weight_pct * 100;
  const freshness_weight = freshness_weight_pct * 100;
  
  return calculateCombinedScore(
    proximity_score,
    freshness_score,
    proximity_weight,
    freshness_weight,
    options
  );
}

/**
 * Calculate combined scores for a single product
 * Convenience function that takes a product object with all metrics
 * 
 * @param {Object} product - Product with proximity_score and freshness_score
 * @param {number} proximity_weight - Weight for proximity (0-100)
 * @param {number} freshness_weight - Weight for freshness (0-100)
 * @param {Object} options - Optional configuration
 * @returns {Object} Product enriched with combined_score
 * 
 * @example
 * const product = { id: 1, proximity_score: 80, freshness_score: 90 };
 * const enriched = calculateProductScore(product, 50, 50);
 * // Returns: { id: 1, proximity_score: 80, freshness_score: 90, combined_score: 85.00 }
 */
function calculateProductScore(product, proximity_weight, freshness_weight, options = {}) {
  if (!product || typeof product !== 'object') {
    throw new Error('product must be an object');
  }
  
  if (typeof product.proximity_score !== 'number') {
    throw new Error(`product.proximity_score must be a number (got ${typeof product.proximity_score})`);
  }
  
  if (typeof product.freshness_score !== 'number') {
    throw new Error(`product.freshness_score must be a number (got ${typeof product.freshness_score})`);
  }
  
  const combined_score = calculateCombinedScore(
    product.proximity_score,
    product.freshness_score,
    proximity_weight,
    freshness_weight,
    options
  );
  
  return {
    ...product,
    combined_score
  };
}

/**
 * Calculate combined scores for multiple products in batch
 * Efficient batch processing with consistent weights
 * 
 * @param {Array<Object>} products - Array of products with proximity_score and freshness_score
 * @param {number} proximity_weight - Weight for proximity (0-100)
 * @param {number} freshness_weight - Weight for freshness (0-100)
 * @param {Object} options - Optional configuration
 * @returns {Array<Object>} Products enriched with combined_score
 * @throws {Error} If inputs are invalid
 * 
 * @example
 * const products = [
 *   { id: 1, proximity_score: 80, freshness_score: 90 },
 *   { id: 2, proximity_score: 60, freshness_score: 70 }
 * ];
 * const enriched = calculateCombinedScoresBatch(products, 50, 50);
 * // Returns: [
 * //   { id: 1, proximity_score: 80, freshness_score: 90, combined_score: 85.00 },
 * //   { id: 2, proximity_score: 60, freshness_score: 70, combined_score: 65.00 }
 * // ]
 */
function calculateCombinedScoresBatch(products, proximity_weight, freshness_weight, options = {}) {
  if (!Array.isArray(products)) {
    throw new Error('products must be an array');
  }
  
  // Validate weights once (not per product)
  validateWeight(proximity_weight, 'proximity_weight');
  validateWeight(freshness_weight, 'freshness_weight');
  
  const { strict = true } = options;
  if (strict && proximity_weight + freshness_weight !== 100) {
    throw new Error(
      `Weights must sum to 100 in strict mode (got ${proximity_weight} + ${freshness_weight} = ${proximity_weight + freshness_weight})`
    );
  }
  
  return products.map(product => 
    calculateProductScore(product, proximity_weight, freshness_weight, options)
  );
}

/**
 * Sort products by combined score (descending)
 * Returns products ranked from highest to lowest score
 * 
 * @param {Array<Object>} products - Array of products with combined_score
 * @param {Object} options - Optional configuration
 * @param {boolean} options.descending - Sort descending (default: true)
 * @returns {Array<Object>} Sorted products
 * 
 * @example
 * const products = [
 *   { id: 1, combined_score: 75 },
 *   { id: 2, combined_score: 85 }
 * ];
 * const ranked = sortByCombinedScore(products);
 * // Returns: [{ id: 2, combined_score: 85 }, { id: 1, combined_score: 75 }]
 */
function sortByCombinedScore(products, options = {}) {
  const { descending = true } = options;
  
  if (!Array.isArray(products)) {
    throw new Error('products must be an array');
  }
  
  return [...products].sort((a, b) => {
    if (typeof a.combined_score !== 'number' || typeof b.combined_score !== 'number') {
      throw new Error('All products must have a numeric combined_score property');
    }
    
    return descending 
      ? b.combined_score - a.combined_score  // High to low
      : a.combined_score - b.combined_score; // Low to high
  });
}

/**
 * Complete pipeline: calculate scores and rank products
 * One-shot function for full score calculation and ranking
 * 
 * @param {Array<Object>} products - Products with proximity_score and freshness_score
 * @param {number} proximity_weight - Weight for proximity (0-100)
 * @param {number} freshness_weight - Weight for freshness (0-100)
 * @param {Object} options - Optional configuration
 * @returns {Array<Object>} Ranked products with combined_score
 * 
 * @example
 * const ranked = calculateAndRank([
 *   { id: 1, proximity_score: 80, freshness_score: 90 },
 *   { id: 2, proximity_score: 90, freshness_score: 70 }
 * ], 50, 50);
 * // Returns ranked products sorted by combined score
 */
function calculateAndRank(products, proximity_weight, freshness_weight, options = {}) {
  const withScores = calculateCombinedScoresBatch(products, proximity_weight, freshness_weight, options);
  return sortByCombinedScore(withScores, options);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate a score value (must be 0-100)
 * @private
 */
function validateScore(score, paramName) {
  if (typeof score !== 'number') {
    throw new Error(`${paramName} must be a number (got ${typeof score})`);
  }
  
  if (isNaN(score)) {
    throw new Error(`${paramName} cannot be NaN`);
  }
  
  if (score < 0 || score > 100) {
    throw new Error(`${paramName} must be between 0-100 (got ${score})`);
  }
}

/**
 * Validate a weight value (must be 0-100)
 * @private
 */
function validateWeight(weight, paramName) {
  if (typeof weight !== 'number') {
    throw new Error(`${paramName} must be a number (got ${typeof weight})`);
  }
  
  if (isNaN(weight)) {
    throw new Error(`${paramName} cannot be NaN`);
  }
  
  if (weight < 0 || weight > 100) {
    throw new Error(`${paramName} must be between 0-100 (got ${weight})`);
  }
}

// Export functions
module.exports = {
  calculateCombinedScore,
  calculateCombinedScorePercent,
  calculateProductScore,
  calculateCombinedScoresBatch,
  sortByCombinedScore,
  calculateAndRank
};

// Run unit tests if executed directly
if (require.main === module) {
  console.log('🧪 Running Combined Score Calculator Unit Tests...\n');
  
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
  
  // Test 1: Equal weights (50/50)
  test('Combined score: 50/50 weights (equal priority)', () => {
    const score = calculateCombinedScore(80, 90, 50, 50);
    if (score !== 85) throw new Error(`Expected 85, got ${score}`);
  });
  
  // Test 2: Proximity priority (70/30)
  test('Combined score: 70/30 weights (proximity priority)', () => {
    const score = calculateCombinedScore(80, 90, 70, 30);
    if (score !== 83) throw new Error(`Expected 83, got ${score}`);
  });
  
  // Test 3: Freshness priority (30/70)
  test('Combined score: 30/70 weights (freshness priority)', () => {
    const score = calculateCombinedScore(80, 90, 30, 70);
    if (score !== 87) throw new Error(`Expected 87, got ${score}`);
  });
  
  // Test 4: 100% proximity (100/0)
  test('Combined score: 100/0 weights (proximity only)', () => {
    const score = calculateCombinedScore(80, 90, 100, 0);
    if (score !== 80) throw new Error(`Expected 80, got ${score}`);
  });
  
  // Test 5: 100% freshness (0/100)
  test('Combined score: 0/100 weights (freshness only)', () => {
    const score = calculateCombinedScore(80, 90, 0, 100);
    if (score !== 90) throw new Error(`Expected 90, got ${score}`);
  });
  
  // Test 6: Both scores same (weight doesn't matter)
  test('Combined score: Same input scores → same output', () => {
    const score = calculateCombinedScore(75, 75, 60, 40);
    if (score !== 75) throw new Error(`Expected 75, got ${score}`);
  });
  
  // Test 7: Edge case - zero scores
  test('Combined score: Zero scores with any weights → 0', () => {
    const score = calculateCombinedScore(0, 0, 50, 50);
    if (score !== 0) throw new Error(`Expected 0, got ${score}`);
  });
  
  // Test 8: Edge case - perfect scores
  test('Combined score: Perfect scores (100) → 100', () => {
    const score = calculateCombinedScore(100, 100, 50, 50);
    if (score !== 100) throw new Error(`Expected 100, got ${score}`);
  });
  
  // Test 9: Percentage weights
  test('Percentage weights: 0.5/0.5 same as 50/50', () => {
    const score = calculateCombinedScorePercent(80, 90, 0.5, 0.5);
    if (score !== 85) throw new Error(`Expected 85, got ${score}`);
  });
  
  // Test 10: Product enrichment
  test('Product enrichment: Add combined_score to object', () => {
    const product = { id: 1, proximity_score: 80, freshness_score: 90 };
    const enriched = calculateProductScore(product, 50, 50);
    if (enriched.combined_score !== 85) throw new Error(`Expected 85, got ${enriched.combined_score}`);
    if (enriched.id !== 1) throw new Error('Should preserve original fields');
  });
  
  // Test 11: Batch calculation
  test('Batch calculation: Process array of products', () => {
    const products = [
      { id: 1, proximity_score: 80, freshness_score: 90 },
      { id: 2, proximity_score: 60, freshness_score: 70 }
    ];
    const enriched = calculateCombinedScoresBatch(products, 50, 50);
    if (enriched.length !== 2) throw new Error('Should return 2 products');
    if (enriched[0].combined_score !== 85) throw new Error('First product should be 85');
    if (enriched[1].combined_score !== 65) throw new Error('Second product should be 65');
  });
  
  // Test 12: Sorting by combined score
  test('Sorting: Descending order (highest first)', () => {
    const products = [
      { id: 1, combined_score: 75 },
      { id: 2, combined_score: 85 },
      { id: 3, combined_score: 65 }
    ];
    const sorted = sortByCombinedScore(products);
    if (sorted[0].id !== 2) throw new Error('Highest should be first');
    if (sorted[2].id !== 3) throw new Error('Lowest should be last');
  });
  
  // Test 13: Complete pipeline
  test('Complete pipeline: Calculate and rank', () => {
    const products = [
      { id: 1, proximity_score: 80, freshness_score: 90 },
      { id: 2, proximity_score: 90, freshness_score: 70 }
    ];
    const ranked = calculateAndRank(products, 50, 50);
    if (ranked[0].id !== 1) throw new Error('Product 1 should rank first (85)');
    if (ranked[0].combined_score !== 85) throw new Error('Score should be 85');
  });
  
  // Test 14: Error - weights don't sum to 100 (strict mode)
  test('Error: Weights sum validation (strict mode)', () => {
    try {
      calculateCombinedScore(80, 90, 60, 60);
      throw new Error('Should have thrown error');
    } catch (e) {
      if (!e.message.includes('must sum to 100')) throw e;
    }
  });
  
  // Test 15: Non-strict mode allows any weight sum
  test('Non-strict mode: Allows weights not summing to 100', () => {
    const score = calculateCombinedScore(80, 90, 60, 60, { strict: false });
    if (typeof score !== 'number') throw new Error('Should return a number');
  });
  
  // Test 16: Error - score out of range
  test('Error: Score out of range (>100)', () => {
    try {
      calculateCombinedScore(120, 90, 50, 50);
      throw new Error('Should have thrown error');
    } catch (e) {
      if (!e.message.includes('must be between 0-100')) throw e;
    }
  });
  
  // Test 17: Error - weight out of range
  test('Error: Weight out of range (>100)', () => {
    try {
      calculateCombinedScore(80, 90, 150, 50);
      throw new Error('Should have thrown error');
    } catch (e) {
      if (!e.message.includes('must be between 0-100')) throw e;
    }
  });
  
  // Test 18: Decimal precision
  test('Decimal precision: Control output decimals', () => {
    const score = calculateCombinedScore(83.333, 76.667, 50, 50, { decimals: 4 });
    if (score !== 80.0000) throw new Error(`Expected 80.0000, got ${score}`);
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}
