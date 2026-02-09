/**
 * Chenda - Product Ranker Integration Tests
 * Phase 4: Complete pipeline testing with real data
 * 
 * Tests the full ranking system with:
 * - Real mock products (30 perishable items)
 * - Real buyer personas (different preferences)
 * - Multiple weight configurations
 * - Complete enrichment → scoring → ranking pipeline
 */

const { 
  scoreAndRankProducts,
  rankByScore,
  createWeightConfig,
  getDefaultWeights,
  getWeightPresets,
  addRankPositions,
  getTopProducts,
  getRankingStatistics,
  compareWeightConfigs
} = require('./product_ranker');

const { calculateDistance } = require('../calculations/haversine');
const { 
  calculateShelfLifeMetrics
} = require('../calculations/shelf-life');
const { mockProducts, mockUsers } = require('../../product-display/mock_data');
const productTypes = require('../../product-management/product-types.json');

console.log('🧪 Product Ranker Integration Test\n');
console.log('='.repeat(80));

// ============================================================================
// SETUP: Enrich products with complete metrics
// ============================================================================

const currentDate = new Date('2026-02-06T12:00:00Z');
console.log(`Current date: ${currentDate.toISOString()}\n`);

// Select a buyer for testing
const testBuyer = mockUsers.find(u => u.name === 'Maria Santos') || mockUsers[0];
console.log('🔧 Setup: Enriching products with complete metrics...');

// Enrich all products with distance, shelf life, and scores
const fullyEnrichedProducts = mockProducts.map(product => {
  // Calculate distance
  const distance_km = calculateDistance(
    testBuyer.location,
    product.location
  );

  // Look up product type
  const productType = productTypes.find(pt => pt.id === product.product_type_id);

  // Calculate shelf life metrics
  const shelfLifeData = calculateShelfLifeMetrics({
    total_shelf_life_days: productType.default_shelf_life_days,
    days_already_used: product.days_already_used,
    listed_date: product.listed_date
  }, currentDate);

  return {
    ...product,
    name: productType.name,
    distance_km,
    ...shelfLifeData
  };
});

console.log(`✓ Enriched ${fullyEnrichedProducts.length} products\n`);

// ============================================================================
// SCENARIO 1: Basic Ranking with Default Weights (50/50)
// ============================================================================

console.log('📊 SCENARIO 1: Basic Ranking with Default Weights');
console.log('-'.repeat(80));

const basicRanked = scoreAndRankProducts(fullyEnrichedProducts, testBuyer, {
  includeBreakdown: true
});

console.log(`\nBuyer: ${testBuyer.name}`);
console.log(`Max radius: ${testBuyer.preferences.max_radius} km`);
console.log(`Weights: 50% proximity, 50% freshness (balanced)\n`);

console.log('Top 10 Products:');
console.log('Rank | Product              | Distance | Fresh% | ProxScore | FreshScore | Combined');
console.log('-'.repeat(90));

basicRanked.slice(0, 10).forEach((product, index) => {
  console.log(
    `${String(index + 1).padStart(4)} | ` +
    `${product.name.padEnd(20)} | ` +
    `${product.distance_km.toFixed(2).padStart(7)} km | ` +
    `${product.freshness_percent.toFixed(1).padStart(5)}% | ` +
    `${product.proximity_score.toFixed(2).padStart(9)} | ` +
    `${product.freshness_score.toFixed(2).padStart(10)} | ` +
    `${product.combined_score.toFixed(2).padStart(8)}`
  );
});

const stats1 = getRankingStatistics(basicRanked);
console.log(`\nStatistics:`);
console.log(`  Total products: ${stats1.count}`);
console.log(`  Average score: ${stats1.avgScore}`);
console.log(`  Max score: ${stats1.maxScore}`);
console.log(`  Min score: ${stats1.minScore}`);
console.log(`  Median score: ${stats1.medianScore}\n`);

// ============================================================================
// SCENARIO 2: Proximity-Focused Ranking (70/30)
// ============================================================================

console.log('📍 SCENARIO 2: Proximity-Focused Ranking (70/30)');
console.log('-'.repeat(80));

const proximityRanked = scoreAndRankProducts(fullyEnrichedProducts, testBuyer, {
  proximityWeight: 70,
  freshnessWeight: 30,
  includeBreakdown: true
});

console.log('\nWeights: 70% proximity, 30% freshness (convenience-focused)\n');

console.log('Top 10 Products:');
console.log('Rank | Product              | Distance | Fresh% | ProxScore | FreshScore | Combined');
console.log('-'.repeat(90));

proximityRanked.slice(0, 10).forEach((product, index) => {
  console.log(
    `${String(index + 1).padStart(4)} | ` +
    `${product.name.padEnd(20)} | ` +
    `${product.distance_km.toFixed(2).padStart(7)} km | ` +
    `${product.freshness_percent.toFixed(1).padStart(5)}% | ` +
    `${product.proximity_score.toFixed(2).padStart(9)} | ` +
    `${product.freshness_score.toFixed(2).padStart(10)} | ` +
    `${product.combined_score.toFixed(2).padStart(8)}`
  );
});

console.log('\n');

// ============================================================================
// SCENARIO 3: Freshness-Focused Ranking (30/70)
// ============================================================================

console.log('🌿 SCENARIO 3: Freshness-Focused Ranking (30/70)');
console.log('-'.repeat(80));

const freshnessRanked = scoreAndRankProducts(fullyEnrichedProducts, testBuyer, {
  proximityWeight: 30,
  freshnessWeight: 70,
  includeBreakdown: true
});

console.log('\nWeights: 30% proximity, 70% freshness (quality-focused)\n');

console.log('Top 10 Products:');
console.log('Rank | Product              | Distance | Fresh% | ProxScore | FreshScore | Combined');
console.log('-'.repeat(90));

freshnessRanked.slice(0, 10).forEach((product, index) => {
  console.log(
    `${String(index + 1).padStart(4)} | ` +
    `${product.name.padEnd(20)} | ` +
    `${product.distance_km.toFixed(2).padStart(7)} km | ` +
    `${product.freshness_percent.toFixed(1).padStart(5)}% | ` +
    `${product.proximity_score.toFixed(2).padStart(9)} | ` +
    `${product.freshness_score.toFixed(2).padStart(10)} | ` +
    `${product.combined_score.toFixed(2).padStart(8)}`
  );
});

console.log('\n');

// ============================================================================
// SCENARIO 4: Weight Presets Comparison
// ============================================================================

console.log('⚖️  SCENARIO 4: Weight Presets Comparison');
console.log('-'.repeat(80));

const presets = getWeightPresets();
const presetComparison = compareWeightConfigs(fullyEnrichedProducts, testBuyer, [
  presets.balanced,
  presets.proximity_focused,
  presets.freshness_focused,
  presets.extreme_proximity,
  presets.extreme_freshness
]);

console.log('\nPreset Configuration Results:\n');

presetComparison.forEach((result, index) => {
  const presetNames = ['Balanced', 'Proximity-Focused', 'Freshness-Focused', 'Extreme Proximity', 'Extreme Freshness'];
  console.log(`${presetNames[index]} (${result.weights.proximityWeight}/${result.weights.freshnessWeight}):`);
  console.log(`  Avg score: ${result.statistics.avgScore}`);
  console.log(`  Top product: ${result.top5[0].name} (${result.top5[0].combined_score.toFixed(2)})`);
  console.log(`  Score range: ${result.statistics.minScore} - ${result.statistics.maxScore}\n`);
});

// ============================================================================
// SCENARIO 5: Rank Position Assignment
// ============================================================================

console.log('🏆 SCENARIO 5: Rank Position Assignment');
console.log('-'.repeat(80));

const rankedWithPositions = addRankPositions(basicRanked);

console.log('\nProducts with assigned rank positions:\n');
console.log('Rank | Product              | Combined Score');
console.log('-'.repeat(60));

rankedWithPositions.slice(0, 10).forEach(product => {
  console.log(
    `${String(product.rank).padStart(4)} | ` +
    `${product.name.padEnd(20)} | ` +
    `${product.combined_score.toFixed(2).padStart(14)}`
  );
});

console.log('\n');

// ============================================================================
// SCENARIO 6: Top N Products Selection
// ============================================================================

console.log('🔝 SCENARIO 6: Top N Products Selection');
console.log('-'.repeat(80));

const top5 = getTopProducts(basicRanked, 5);
const top10 = getTopProducts(basicRanked, 10);
const top20 = getTopProducts(basicRanked, 20);

console.log(`\nTop 5 products: ${top5.length} items`);
top5.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.name} - Score: ${p.combined_score.toFixed(2)}`);
});

console.log(`\nTop 10 products: ${top10.length} items`);
console.log(`Top 20 products: ${top20.length} items\n`);

// ============================================================================
// SCENARIO 7: Multiple Buyers - Different Preferences
// ============================================================================

console.log('👥 SCENARIO 7: Multiple Buyers with Different Preferences');
console.log('-'.repeat(80));

// Test with different buyers
const buyersToTest = mockUsers.slice(0, 3);

console.log('\nRanking results for different buyers:\n');

buyersToTest.forEach(buyer => {
  // Enrich products for this buyer
  const buyerProducts = mockProducts.map(product => {
    const distance_km = calculateDistance(buyer.location, product.location);
    const productType = productTypes.find(pt => pt.id === product.product_type_id);
    const shelfLifeData = calculateShelfLifeMetrics({
      total_shelf_life_days: productType.default_shelf_life_days,
      days_already_used: product.days_already_used,
      listed_date: product.listed_date
    }, currentDate);
    return {
      ...product,
      name: productType.name,
      distance_km,
      ...shelfLifeData
    };
  });

  const ranked = scoreAndRankProducts(buyerProducts, buyer);
  const top3 = ranked.slice(0, 3);
  const stats = getRankingStatistics(ranked);

  console.log(`${buyer.name} (${buyer.preferences.max_radius || 50}km radius):`);
  console.log(`  Avg score: ${stats.avgScore}`);
  console.log(`  Top 3: ${top3.map(p => p.name).join(', ')}`);
  console.log('');
});

// ============================================================================
// SCENARIO 8: Ranking Order Validation
// ============================================================================

console.log('✅ SCENARIO 8: Ranking Order Validation');
console.log('-'.repeat(80));

const descendingRank = rankByScore(basicRanked, 'desc');
const ascendingRank = rankByScore(basicRanked, 'asc');

console.log('\nDescending order (highest to lowest):');
console.log(`  First: ${descendingRank[0].name} (${descendingRank[0].combined_score.toFixed(2)})`);
console.log(`  Last: ${descendingRank[descendingRank.length - 1].name} (${descendingRank[descendingRank.length - 1].combined_score.toFixed(2)})`);

console.log('\nAscending order (lowest to highest):');
console.log(`  First: ${ascendingRank[0].name} (${ascendingRank[0].combined_score.toFixed(2)})`);
console.log(`  Last: ${ascendingRank[ascendingRank.length - 1].name} (${ascendingRank[ascendingRank.length - 1].combined_score.toFixed(2)})`);

// Validate order
const isDescendingValid = descendingRank.every((p, i, arr) => 
  i === 0 || arr[i - 1].combined_score >= p.combined_score
);
const isAscendingValid = ascendingRank.every((p, i, arr) => 
  i === 0 || arr[i - 1].combined_score <= p.combined_score
);

console.log(`\nDescending order valid: ${isDescendingValid ? '✅' : '❌'}`);
console.log(`Ascending order valid: ${isAscendingValid ? '✅' : '❌'}\n`);

// ============================================================================
// SCENARIO 9: Weight Configuration Validation
// ============================================================================

console.log('⚙️  SCENARIO 9: Weight Configuration Validation');
console.log('-'.repeat(80));

console.log('\nTesting weight configurations:\n');

// Valid configurations
try {
  const config1 = createWeightConfig(50, 50);
  console.log('✅ Valid: 50/50 (sum=100)');
} catch (e) {
  console.log('❌ Failed: 50/50');
}

try {
  const config2 = createWeightConfig(70, 30);
  console.log('✅ Valid: 70/30 (sum=100)');
} catch (e) {
  console.log('❌ Failed: 70/30');
}

try {
  const config3 = createWeightConfig(100, 0);
  console.log('✅ Valid: 100/0 (sum=100)');
} catch (e) {
  console.log('❌ Failed: 100/0');
}

// Invalid configuration (should fail in strict mode)
try {
  const config4 = createWeightConfig(60, 50);
  console.log('❌ Should have failed: 60/50 (sum=110)');
} catch (e) {
  console.log('✅ Correctly rejected: 60/50 (sum=110)');
}

// Valid with normalize
try {
  const config5 = createWeightConfig(60, 50, { normalize: true });
  console.log(`✅ Valid with normalize: 60/50 → ${config5.proximityWeight}/${config5.freshnessWeight}`);
} catch (e) {
  console.log('❌ Failed with normalize: 60/50');
}

console.log('\n');

// ============================================================================
// SCENARIO 10: Complete Pipeline Performance
// ============================================================================

console.log('⚡ SCENARIO 10: Complete Pipeline Performance');
console.log('-'.repeat(80));

console.log('\nBenchmarking complete ranking pipeline...\n');

const iterations = 1000;
const startTime = Date.now();

for (let i = 0; i < iterations; i++) {
  scoreAndRankProducts(fullyEnrichedProducts, testBuyer);
}

const endTime = Date.now();
const totalTime = endTime - startTime;
const avgTime = totalTime / iterations;
const avgPerProduct = avgTime / fullyEnrichedProducts.length;

console.log(`Ranked ${fullyEnrichedProducts.length} products ${iterations} times`);
console.log(`Total time: ${totalTime}ms`);
console.log(`Average per iteration: ${avgTime.toFixed(3)}ms`);
console.log(`Average per product: ${avgPerProduct.toFixed(4)}ms\n`);

// ============================================================================
// SCENARIO 11: Score Distribution Analysis
// ============================================================================

console.log('📈 SCENARIO 11: Score Distribution Analysis');
console.log('-'.repeat(80));

const allStats = getRankingStatistics(basicRanked);

console.log('\nScore distribution for balanced weights (50/50):\n');
console.log(`  Count: ${allStats.count} products`);
console.log(`  Average: ${allStats.avgScore}`);
console.log(`  Median: ${allStats.medianScore}`);
console.log(`  Range: ${allStats.minScore} - ${allStats.maxScore}`);
console.log(`  Spread: ${(allStats.maxScore - allStats.minScore).toFixed(2)}`);

// Calculate score ranges
const scoreRanges = {
  excellent: basicRanked.filter(p => p.combined_score >= 80).length,
  good: basicRanked.filter(p => p.combined_score >= 60 && p.combined_score < 80).length,
  fair: basicRanked.filter(p => p.combined_score >= 40 && p.combined_score < 60).length,
  poor: basicRanked.filter(p => p.combined_score < 40).length
};

console.log('\nScore categories:');
console.log(`  Excellent (80-100): ${scoreRanges.excellent} products`);
console.log(`  Good (60-79): ${scoreRanges.good} products`);
console.log(`  Fair (40-59): ${scoreRanges.fair} products`);
console.log(`  Poor (<40): ${scoreRanges.poor} products\n`);

// ============================================================================
// SCENARIO 12: Edge Cases
// ============================================================================

console.log('🔧 SCENARIO 12: Edge Cases');
console.log('-'.repeat(80));

console.log('\nTesting edge cases:\n');

// Empty array
try {
  const emptyRank = rankByScore([]);
  console.log(`✅ Empty array: Returns ${emptyRank.length} products`);
} catch (e) {
  console.log(`❌ Empty array: ${e.message}`);
}

// Single product
try {
  const singleProduct = [basicRanked[0]];
  const singleRank = rankByScore(singleProduct);
  console.log(`✅ Single product: Returns ${singleRank.length} product`);
} catch (e) {
  console.log(`❌ Single product: ${e.message}`);
}

// All same score
try {
  const sameScoreProducts = basicRanked.slice(0, 3).map(p => ({
    ...p,
    combined_score: 75
  }));
  const sameRank = rankByScore(sameScoreProducts);
  console.log(`✅ Same scores: Returns ${sameRank.length} products`);
} catch (e) {
  console.log(`❌ Same scores: ${e.message}`);
}

console.log('\n');

// ============================================================================
// FINAL SUMMARY
// ============================================================================

console.log('='.repeat(80));
console.log('📋 INTEGRATION TEST SUMMARY');
console.log('='.repeat(80));

console.log('\n✅ Completed Scenarios:');
console.log('  1. Basic ranking with default weights (50/50)');
console.log('  2. Proximity-focused ranking (70/30)');
console.log('  3. Freshness-focused ranking (30/70)');
console.log('  4. Weight presets comparison');
console.log('  5. Rank position assignment');
console.log('  6. Top N products selection');
console.log('  7. Multiple buyers with different preferences');
console.log('  8. Ranking order validation');
console.log('  9. Weight configuration validation');
console.log('  10. Complete pipeline performance benchmark');
console.log('  11. Score distribution analysis');
console.log('  12. Edge cases testing');

console.log('\n📊 Key Metrics:');
console.log(`  Products tested: ${fullyEnrichedProducts.length}`);
console.log(`  Buyers tested: ${buyersToTest.length}`);
console.log(`  Weight configurations tested: ${presetComparison.length}`);
console.log(`  Average ranking time: ${avgTime.toFixed(3)}ms`);

console.log('\n💡 Insights:');
console.log('  - Weight adjustments significantly impact ranking order');
console.log('  - Proximity-focused weights favor nearby products');
console.log('  - Freshness-focused weights favor fresher products');
console.log('  - Complete pipeline: enrich → score → rank → sort');
console.log(`  - Performance: ${avgTime.toFixed(3)}ms for ${fullyEnrichedProducts.length} products`);

console.log('\n✅ Phase 4 Integration Test Complete!');
console.log('='.repeat(80));
