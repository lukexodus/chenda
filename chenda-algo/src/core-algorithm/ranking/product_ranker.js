/**
 * Chenda - Product Ranking & Scoring System
 * Phase 4: Scoring & Ranking System (Tasks 4.1-4.4)
 * 
 * Purpose: Complete pipeline for scoring and ranking products based on
 * proximity and freshness with user-adjustable weights
 * 
 * Features:
 * - Score products using normalized proximity and freshness
 * - Apply user-adjustable weights (default: 50/50)
 * - Rank products by combined score (descending)
 * - Support batch processing for efficiency
 * - Provide detailed scoring breakdowns
 * 
 * Integration:
 * - Uses score_normalizer.js for normalization
 * - Uses combined_score_calculator.js for weighted scoring
 * - Prepares for Phase 5 sorting modes
 */

const { 
  normalizeProximityScore, 
  normalizeFreshnessScore 
} = require('../scoring/score-normalizer');

const { 
  calculateCombinedScore,
  calculateCombinedScoresBatch 
} = require('../scoring/combined-score');

/**
 * Score and rank products for a buyer
 * Complete pipeline: normalize scores → calculate combined score → sort by rank
 * 
 * @param {Array} products - Products with distance_km and freshness_percent
 * @param {Object} buyer - Buyer object with preferences
 * @param {Object} options - Optional configuration
 * @param {number} options.proximityWeight - Weight for proximity (0-100, default: 50)
 * @param {number} options.freshnessWeight - Weight for freshness (0-100, default: 50)
 * @param {boolean} options.includeBreakdown - Include score breakdown (default: false)
 * @returns {Array} Products sorted by combined_score (highest first)
 * 
 * @example
 * const rankedProducts = scoreAndRankProducts(products, buyer);
 * // Returns products sorted by score, highest first
 * 
 * @example
 * const rankedProducts = scoreAndRankProducts(products, buyer, {
 *   proximityWeight: 70,
 *   freshnessWeight: 30,
 *   includeBreakdown: true
 * });
 */
function scoreAndRankProducts(products, buyer, options = {}) {
  const {
    proximityWeight = 50,
    freshnessWeight = 50,
    includeBreakdown = false
  } = options;

  // Validate inputs
  if (!Array.isArray(products)) {
    throw new Error('products must be an array');
  }

  if (!buyer || !buyer.preferences) {
    throw new Error('buyer must have preferences object');
  }

  if (products.length === 0) {
    return [];
  }

  // Extract max radius from buyer preferences
  const maxRadius = buyer.preferences.max_radius || buyer.preferences.max_radius_km || 50;

  // First, normalize scores if not already present
  const productsWithScores = products.map(product => {
    // If scores already exist, use them
    if (typeof product.proximity_score === 'number' && 
        typeof product.freshness_score === 'number') {
      return product;
    }

    // Otherwise, calculate scores
    const proximity_score = normalizeProximityScore(
      product.distance_km,
      maxRadius
    );
    const freshness_score = normalizeFreshnessScore(
      product.freshness_percent
    );

    return {
      ...product,
      proximity_score,
      freshness_score
    };
  });

  // Score all products using batch calculator
  const scoredProducts = calculateCombinedScoresBatch(
    productsWithScores,
    proximityWeight,
    freshnessWeight,
    {
      strict: true
    }
  );

  // Sort by combined_score descending (highest score first)
  const rankedProducts = scoredProducts.sort((a, b) => 
    b.combined_score - a.combined_score
  );

  return rankedProducts;
}

/**
 * Rank products by combined score
 * Simple sorting function for products already scored
 * 
 * @param {Array} products - Products with combined_score property
 * @param {string} order - Sort order: 'desc' (default) or 'asc'
 * @returns {Array} Sorted products
 * 
 * @example
 * const ranked = rankByScore(scoredProducts);
 * // Returns products sorted highest to lowest score
 * 
 * @example
 * const ranked = rankByScore(scoredProducts, 'asc');
 * // Returns products sorted lowest to highest score
 */
function rankByScore(products, order = 'desc') {
  if (!Array.isArray(products)) {
    throw new Error('products must be an array');
  }

  if (products.length === 0) {
    return [];
  }

  // Validate all products have combined_score
  const missingScore = products.find(p => 
    typeof p.combined_score !== 'number' || isNaN(p.combined_score)
  );

  if (missingScore) {
    throw new Error('All products must have a valid combined_score property');
  }

  // Sort by combined_score
  const sorted = [...products].sort((a, b) => {
    if (order === 'asc') {
      return a.combined_score - b.combined_score;
    } else {
      return b.combined_score - a.combined_score;
    }
  });

  return sorted;
}

/**
 * Create weight configuration object
 * Validates and normalizes weight settings
 * 
 * @param {number} proximityWeight - Weight for proximity (0-100)
 * @param {number} freshnessWeight - Weight for freshness (0-100)
 * @param {Object} options - Optional settings
 * @param {boolean} options.strict - Weights must sum to 100 (default: true)
 * @param {boolean} options.normalize - Auto-normalize to sum to 100 (default: false)
 * @returns {Object} Validated weight configuration
 * @throws {Error} If weights are invalid
 * 
 * @example
 * const weights = createWeightConfig(60, 40);
 * // Returns: { proximityWeight: 60, freshnessWeight: 40 }
 * 
 * @example
 * const weights = createWeightConfig(70, 40, { normalize: true });
 * // Returns: { proximityWeight: 63.64, freshnessWeight: 36.36 }
 */
function createWeightConfig(proximityWeight, freshnessWeight, options = {}) {
  const { strict = true, normalize = false } = options;

  // Validate types
  if (typeof proximityWeight !== 'number' || typeof freshnessWeight !== 'number') {
    throw new Error('Weights must be numbers');
  }

  // Validate range
  if (proximityWeight < 0 || proximityWeight > 100) {
    throw new Error(`proximityWeight must be 0-100 (got ${proximityWeight})`);
  }

  if (freshnessWeight < 0 || freshnessWeight > 100) {
    throw new Error(`freshnessWeight must be 0-100 (got ${freshnessWeight})`);
  }

  let finalProximityWeight = proximityWeight;
  let finalFreshnessWeight = freshnessWeight;

  const sum = proximityWeight + freshnessWeight;

  // Normalize weights if requested
  if (normalize && sum !== 100 && sum > 0) {
    finalProximityWeight = Number(((proximityWeight / sum) * 100).toFixed(2));
    finalFreshnessWeight = Number(((freshnessWeight / sum) * 100).toFixed(2));
  } else if (strict && sum !== 100) {
    throw new Error(
      `Weights must sum to 100 (got ${sum}). ` +
      `Set strict=false or normalize=true to allow other values.`
    );
  }

  return {
    proximityWeight: finalProximityWeight,
    freshnessWeight: finalFreshnessWeight
  };
}

/**
 * Get default weight configuration
 * Returns standard 50/50 balanced weights
 * 
 * @returns {Object} Default weight configuration
 * 
 * @example
 * const weights = getDefaultWeights();
 * // Returns: { proximityWeight: 50, freshnessWeight: 50 }
 */
function getDefaultWeights() {
  return {
    proximityWeight: 50,
    freshnessWeight: 50
  };
}

/**
 * Get preset weight configurations
 * Common weight combinations for different buyer preferences
 * 
 * @returns {Object} Preset configurations
 * 
 * @example
 * const presets = getWeightPresets();
 * const balanced = presets.balanced;    // 50/50
 * const proximity = presets.proximity;  // 70/30
 * const freshness = presets.freshness;  // 30/70
 */
function getWeightPresets() {
  return {
    balanced: { proximityWeight: 50, freshnessWeight: 50 },
    proximity_focused: { proximityWeight: 70, freshnessWeight: 30 },
    freshness_focused: { proximityWeight: 30, freshnessWeight: 70 },
    extreme_proximity: { proximityWeight: 90, freshnessWeight: 10 },
    extreme_freshness: { proximityWeight: 10, freshnessWeight: 90 },
    convenience: { proximityWeight: 80, freshnessWeight: 20 },
    quality: { proximityWeight: 20, freshnessWeight: 80 }
  };
}

/**
 * Add rank positions to scored products
 * Adds rank (1, 2, 3...) based on combined_score
 * 
 * @param {Array} products - Products with combined_score
 * @returns {Array} Products with rank property added
 * 
 * @example
 * const ranked = addRankPositions(scoredProducts);
 * // Returns products with rank: 1, 2, 3, etc.
 */
function addRankPositions(products) {
  if (!Array.isArray(products)) {
    throw new Error('products must be an array');
  }

  if (products.length === 0) {
    return [];
  }

  // Sort by score descending
  const sorted = rankByScore(products, 'desc');

  // Add rank property
  return sorted.map((product, index) => ({
    ...product,
    rank: index + 1
  }));
}

/**
 * Get top N products by score
 * Returns the highest-scoring products
 * 
 * @param {Array} products - Products with combined_score
 * @param {number} limit - Number of products to return (default: 10)
 * @returns {Array} Top N products
 * 
 * @example
 * const top10 = getTopProducts(rankedProducts, 10);
 */
function getTopProducts(products, limit = 10) {
  if (!Array.isArray(products)) {
    throw new Error('products must be an array');
  }

  if (typeof limit !== 'number' || limit < 1) {
    throw new Error('limit must be a positive number');
  }

  const ranked = rankByScore(products, 'desc');
  return ranked.slice(0, limit);
}

/**
 * Get ranking statistics
 * Provides insights into score distribution
 * 
 * @param {Array} products - Products with combined_score
 * @returns {Object} Statistics object
 * 
 * @example
 * const stats = getRankingStatistics(rankedProducts);
 * // Returns: { count, avgScore, maxScore, minScore, medianScore }
 */
function getRankingStatistics(products) {
  if (!Array.isArray(products)) {
    throw new Error('products must be an array');
  }

  if (products.length === 0) {
    return {
      count: 0,
      avgScore: 0,
      maxScore: 0,
      minScore: 0,
      medianScore: 0
    };
  }

  const scores = products.map(p => p.combined_score).filter(s => typeof s === 'number');

  if (scores.length === 0) {
    throw new Error('No valid combined_score values found');
  }

  const sum = scores.reduce((acc, score) => acc + score, 0);
  const avg = sum / scores.length;
  const max = Math.max(...scores);
  const min = Math.min(...scores);

  // Calculate median
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  return {
    count: scores.length,
    avgScore: Number(avg.toFixed(2)),
    maxScore: Number(max.toFixed(2)),
    minScore: Number(min.toFixed(2)),
    medianScore: Number(median.toFixed(2))
  };
}

/**
 * Compare ranking results with different weight configurations
 * Useful for showing buyers how weight changes affect results
 * 
 * @param {Array} products - Products with distance_km and freshness_percent
 * @param {Object} buyer - Buyer object
 * @param {Array} weightConfigs - Array of weight configurations to compare
 * @returns {Array} Results for each configuration
 * 
 * @example
 * const comparison = compareWeightConfigs(products, buyer, [
 *   { proximityWeight: 50, freshnessWeight: 50 },
 *   { proximityWeight: 70, freshnessWeight: 30 },
 *   { proximityWeight: 30, freshnessWeight: 70 }
 * ]);
 */
function compareWeightConfigs(products, buyer, weightConfigs) {
  if (!Array.isArray(products) || !Array.isArray(weightConfigs)) {
    throw new Error('products and weightConfigs must be arrays');
  }

  return weightConfigs.map(config => {
    const ranked = scoreAndRankProducts(products, buyer, config);
    const stats = getRankingStatistics(ranked);

    return {
      weights: config,
      products: ranked,
      statistics: stats,
      top5: ranked.slice(0, 5).map(p => ({
        name: p.name,
        combined_score: p.combined_score
      }))
    };
  });
}

// ============================================================================
// UNIT TESTS
// ============================================================================

function runTests() {
  console.log('🧪 Product Ranker Unit Tests\n');
  
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

  // Mock data for testing
  const mockBuyer = {
    id: 1,
    name: 'Test Buyer',
    preferences: {
      max_radius: 50,
      max_radius_km: 50
    }
  };

  const mockProducts = [
    {
      id: 1,
      name: 'Product A',
      distance_km: 5,
      freshness_percent: 90,
      proximity_score: 90,
      freshness_score: 90,
      combined_score: 90
    },
    {
      id: 2,
      name: 'Product B',
      distance_km: 10,
      freshness_percent: 80,
      proximity_score: 80,
      freshness_score: 80,
      combined_score: 80
    },
    {
      id: 3,
      name: 'Product C',
      distance_km: 15,
      freshness_percent: 70,
      proximity_score: 70,
      freshness_score: 70,
      combined_score: 70
    }
  ];

  // Test 1: Rank by score (descending)
  test('Test 1: Rank by score - descending order', () => {
    const ranked = rankByScore(mockProducts, 'desc');
    if (ranked[0].combined_score !== 90) throw new Error('First product should have highest score');
    if (ranked[2].combined_score !== 70) throw new Error('Last product should have lowest score');
  });

  // Test 2: Rank by score (ascending)
  test('Test 2: Rank by score - ascending order', () => {
    const ranked = rankByScore(mockProducts, 'asc');
    if (ranked[0].combined_score !== 70) throw new Error('First product should have lowest score');
    if (ranked[2].combined_score !== 90) throw new Error('Last product should have highest score');
  });

  // Test 3: Empty array handling
  test('Test 3: Rank by score - empty array', () => {
    const ranked = rankByScore([]);
    if (ranked.length !== 0) throw new Error('Should return empty array');
  });

  // Test 4: Create weight config (valid)
  test('Test 4: Create weight config - valid 50/50', () => {
    const config = createWeightConfig(50, 50);
    if (config.proximityWeight !== 50) throw new Error('proximityWeight should be 50');
    if (config.freshnessWeight !== 50) throw new Error('freshnessWeight should be 50');
  });

  // Test 5: Create weight config (valid 70/30)
  test('Test 5: Create weight config - valid 70/30', () => {
    const config = createWeightConfig(70, 30);
    if (config.proximityWeight !== 70) throw new Error('proximityWeight should be 70');
    if (config.freshnessWeight !== 30) throw new Error('freshnessWeight should be 30');
  });

  // Test 6: Create weight config (invalid sum)
  test('Test 6: Create weight config - invalid sum (strict mode)', () => {
    try {
      createWeightConfig(60, 50); // Sum = 110
      throw new Error('Should throw error for invalid sum');
    } catch (error) {
      if (!error.message.includes('must sum to 100')) {
        throw new Error('Wrong error message');
      }
    }
  });

  // Test 7: Create weight config (normalize)
  test('Test 7: Create weight config - normalize weights', () => {
    const config = createWeightConfig(60, 40, { normalize: true });
    if (config.proximityWeight !== 60) throw new Error('Should not normalize when sum=100');
    
    const config2 = createWeightConfig(80, 40, { normalize: true });
    // 80/(80+40)*100 = 66.67, 40/(80+40)*100 = 33.33
    if (Math.abs(config2.proximityWeight - 66.67) > 0.1) throw new Error('Normalization failed');
    if (Math.abs(config2.freshnessWeight - 33.33) > 0.1) throw new Error('Normalization failed');
  });

  // Test 8: Get default weights
  test('Test 8: Get default weights', () => {
    const defaults = getDefaultWeights();
    if (defaults.proximityWeight !== 50) throw new Error('Default proximity should be 50');
    if (defaults.freshnessWeight !== 50) throw new Error('Default freshness should be 50');
  });

  // Test 9: Get weight presets
  test('Test 9: Get weight presets', () => {
    const presets = getWeightPresets();
    if (presets.balanced.proximityWeight !== 50) throw new Error('Balanced preset incorrect');
    if (presets.proximity_focused.proximityWeight !== 70) throw new Error('Proximity preset incorrect');
    if (presets.freshness_focused.freshnessWeight !== 70) throw new Error('Freshness preset incorrect');
  });

  // Test 10: Add rank positions
  test('Test 10: Add rank positions', () => {
    const ranked = addRankPositions(mockProducts);
    if (ranked[0].rank !== 1) throw new Error('First product should be rank 1');
    if (ranked[1].rank !== 2) throw new Error('Second product should be rank 2');
    if (ranked[2].rank !== 3) throw new Error('Third product should be rank 3');
  });

  // Test 11: Get top products
  test('Test 11: Get top products - limit 2', () => {
    const top = getTopProducts(mockProducts, 2);
    if (top.length !== 2) throw new Error('Should return 2 products');
    if (top[0].combined_score !== 90) throw new Error('First should be highest score');
  });

  // Test 12: Get top products - limit exceeds array
  test('Test 12: Get top products - limit exceeds array size', () => {
    const top = getTopProducts(mockProducts, 10);
    if (top.length !== 3) throw new Error('Should return all 3 products');
  });

  // Test 13: Get ranking statistics
  test('Test 13: Get ranking statistics', () => {
    const stats = getRankingStatistics(mockProducts);
    if (stats.count !== 3) throw new Error('Count should be 3');
    if (stats.maxScore !== 90) throw new Error('Max score should be 90');
    if (stats.minScore !== 70) throw new Error('Min score should be 70');
    if (stats.avgScore !== 80) throw new Error('Avg score should be 80');
    if (stats.medianScore !== 80) throw new Error('Median score should be 80');
  });

  // Test 14: Get ranking statistics (empty)
  test('Test 14: Get ranking statistics - empty array', () => {
    const stats = getRankingStatistics([]);
    if (stats.count !== 0) throw new Error('Count should be 0');
    if (stats.avgScore !== 0) throw new Error('Avg should be 0');
  });

  // Test 15: Invalid input handling
  test('Test 15: Rank by score - missing combined_score', () => {
    const invalid = [{ id: 1, name: 'Test' }];
    try {
      rankByScore(invalid);
      throw new Error('Should throw error for missing combined_score');
    } catch (error) {
      if (!error.message.includes('combined_score')) {
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
  scoreAndRankProducts,
  rankByScore,
  createWeightConfig,
  getDefaultWeights,
  getWeightPresets,
  addRankPositions,
  getTopProducts,
  getRankingStatistics,
  compareWeightConfigs
};

// Run tests if executed directly
if (require.main === module) {
  runTests();
}
