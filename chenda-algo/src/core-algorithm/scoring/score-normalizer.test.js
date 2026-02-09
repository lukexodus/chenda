/**
 * Chenda - Score Normalization Integration Test
 * Task 2.3: Test score normalization with real mock data
 * 
 * Tests:
 * 1. Calculate scores for all products from one buyer's perspective
 * 2. Compare proximity vs freshness score distributions
 * 3. Test with different buyer preferences (max_radius variations)
 * 4. Analyze score ranges and patterns
 * 5. Simulate complete enrichment pipeline (distance + freshness + scores)
 */

const { 
  normalizeProximityScore,
  normalizeFreshnessScore,
  normalizeScores,
  normalizeScoresBatch
} = require('./score-normalizer.js');

const { calculateDistance, calculateDistanceBatch } = require('../calculations/haversine.js');
const { calculateShelfLifeMetricsBatch, calculateShelfLifeMetrics } = require('../calculations/shelf-life.js');
const mockData = require('../../product-display/mock_data.js');
const productTypes = require('../../product-management/product-types.json');

console.log('🧪 Score Normalization Integration Test\n');
console.log('=' .repeat(80));

// ============================================================================
// SCENARIO 1: Calculate normalized scores for buyer's product search
// ============================================================================
console.log('\n📍 SCENARIO 1: Buyer Product Search - Score Normalization');
console.log('-'.repeat(80));

const buyer = mockData.mockUsers.find(u => u.id === 1); // Maria Santos (Quezon City)
const products = mockData.mockProducts;

console.log(`Buyer: ${buyer.name} (${buyer.location.address})`);
console.log(`Preferences: ${buyer.preferences.proximity_weight}% proximity, ${buyer.preferences.shelf_life_weight}% freshness`);
console.log(`Max radius: ${buyer.preferences.max_radius_km} km`);
console.log(`Products analyzed: ${products.length}\n`);

// Step 1: Calculate distances
const productsWithDistance = products.map(product => {
  const distance_km = calculateDistance(buyer.location, product.location);
  return {
    ...product,
    distance_km: Number(distance_km.toFixed(2))
  };
});

// Step 2: Calculate shelf life metrics
const enrichedProducts = productsWithDistance.map(product => {
  const productType = productTypes.find(pt => pt.id === product.product_type_id);
  
  const metrics = calculateShelfLifeMetrics({
    total_shelf_life_days: productType.default_shelf_life_days,
    days_already_used: product.days_already_used,
    listed_date: product.listed_date
  });
  
  return {
    ...product,
    product_name: productType.name,
    total_shelf_life_days: productType.default_shelf_life_days,
    freshness_percent: metrics.freshness_percent,
    remaining_days: metrics.remaining_shelf_life_days
  };
});

// Step 3: Normalize scores
const withScores = normalizeScoresBatch(enrichedProducts, buyer.preferences.max_radius_km);

// Display sample results
console.log('Sample Normalized Scores (first 10 products):');
console.log('ID | Product              | Distance | Fresh% | ProxScore | FreshScore');
console.log('-'.repeat(80));
withScores.slice(0, 10).forEach(p => {
  console.log(
    `${String(p.id).padEnd(2)} | ` +
    `${p.product_name.substring(0, 20).padEnd(20)} | ` +
    `${String(p.distance_km).padStart(6)} km | ` +
    `${String(p.freshness_percent).padStart(5)}% | ` +
    `${String(p.proximity_score).padStart(9)} | ` +
    `${String(p.freshness_score).padStart(10)}`
  );
});

// ============================================================================
// SCENARIO 2: Score Distribution Analysis
// ============================================================================
console.log('\n\n📊 SCENARIO 2: Score Distribution Analysis');
console.log('-'.repeat(80));

// Proximity score distribution
const proximityScores = withScores.map(p => p.proximity_score).sort((a, b) => b - a);
const avgProximityScore = proximityScores.reduce((sum, s) => sum + s, 0) / proximityScores.length;
const maxProximityScore = Math.max(...proximityScores);
const minProximityScore = Math.min(...proximityScores);

console.log('\nProximity Score Distribution:');
console.log(`  Average: ${avgProximityScore.toFixed(2)}`);
console.log(`  Max: ${maxProximityScore.toFixed(2)} (closest product)`);
console.log(`  Min: ${minProximityScore.toFixed(2)} (farthest product)`);

// Proximity score ranges
const proxRanges = {
  '90-100': withScores.filter(p => p.proximity_score >= 90).length,
  '70-89': withScores.filter(p => p.proximity_score >= 70 && p.proximity_score < 90).length,
  '50-69': withScores.filter(p => p.proximity_score >= 50 && p.proximity_score < 70).length,
  '30-49': withScores.filter(p => p.proximity_score >= 30 && p.proximity_score < 50).length,
  '0-29': withScores.filter(p => p.proximity_score < 30).length
};

console.log('\nProximity Score Ranges:');
Object.entries(proxRanges).forEach(([range, count]) => {
  const pct = ((count / withScores.length) * 100).toFixed(1);
  console.log(`  ${range}: ${count} products (${pct}%)`);
});

// Freshness score distribution
const freshnessScores = withScores.map(p => p.freshness_score).sort((a, b) => b - a);
const avgFreshnessScore = freshnessScores.reduce((sum, s) => sum + s, 0) / freshnessScores.length;
const maxFreshnessScore = Math.max(...freshnessScores);
const minFreshnessScore = Math.min(...freshnessScores);

console.log('\n\nFreshness Score Distribution:');
console.log(`  Average: ${avgFreshnessScore.toFixed(2)}`);
console.log(`  Max: ${maxFreshnessScore.toFixed(2)} (freshest product)`);
console.log(`  Min: ${minFreshnessScore.toFixed(2)} (least fresh product)`);

// Freshness score ranges
const freshRanges = {
  '90-100': withScores.filter(p => p.freshness_score >= 90).length,
  '70-89': withScores.filter(p => p.freshness_score >= 70 && p.freshness_score < 90).length,
  '50-69': withScores.filter(p => p.freshness_score >= 50 && p.freshness_score < 70).length,
  '30-49': withScores.filter(p => p.freshness_score >= 30 && p.freshness_score < 50).length,
  '0-29': withScores.filter(p => p.freshness_score < 30).length
};

console.log('\nFreshness Score Ranges:');
Object.entries(freshRanges).forEach(([range, count]) => {
  const pct = ((count / withScores.length) * 100).toFixed(1);
  console.log(`  ${range}: ${count} products (${pct}%)`);
});

// ============================================================================
// SCENARIO 3: Comparison Across Different Max Radius Settings
// ============================================================================
console.log('\n\n🔍 SCENARIO 3: Impact of Max Radius on Proximity Scores');
console.log('-'.repeat(80));

const testRadii = [20, 30, 40, 50];
const sampleProduct = productsWithDistance[0]; // First product for testing

console.log(`Sample Product: ${enrichedProducts[0].product_name} at ${sampleProduct.distance_km} km\n`);
console.log('Max Radius | Proximity Score | Interpretation');
console.log('-'.repeat(80));

testRadii.forEach(radius => {
  const score = normalizeProximityScore(sampleProduct.distance_km, radius);
  let interpretation = '';
  if (score >= 80) interpretation = '⭐ Excellent';
  else if (score >= 60) interpretation = '✓ Good';
  else if (score >= 40) interpretation = '○ Fair';
  else if (score >= 20) interpretation = '△ Poor';
  else interpretation = '✗ Very poor';
  
  console.log(`${String(radius).padStart(10)} km | ${String(score).padStart(15)} | ${interpretation}`);
});

// ============================================================================
// SCENARIO 4: Top Scored Products (Proximity vs Freshness)
// ============================================================================
console.log('\n\n🏆 SCENARIO 4: Top 5 Products by Score Type');
console.log('-'.repeat(80));

// Top by proximity
const topProximity = [...withScores]
  .sort((a, b) => b.proximity_score - a.proximity_score)
  .slice(0, 5);

console.log('\nTop 5 by Proximity Score (Closest):');
console.log('Rank | Product              | Distance | Proximity Score');
console.log('-'.repeat(80));
topProximity.forEach((p, idx) => {
  console.log(
    `${String(idx + 1).padStart(4)} | ` +
    `${p.product_name.substring(0, 20).padEnd(20)} | ` +
    `${String(p.distance_km).padStart(6)} km | ` +
    `${String(p.proximity_score).padStart(15)}`
  );
});

// Top by freshness
const topFreshness = [...withScores]
  .sort((a, b) => b.freshness_score - a.freshness_score)
  .slice(0, 5);

console.log('\n\nTop 5 by Freshness Score (Most Fresh):');
console.log('Rank | Product              | Fresh% | Freshness Score');
console.log('-'.repeat(80));
topFreshness.forEach((p, idx) => {
  console.log(
    `${String(idx + 1).padStart(4)} | ` +
    `${p.product_name.substring(0, 20).padEnd(20)} | ` +
    `${String(p.freshness_percent).padStart(6)}% | ` +
    `${String(p.freshness_score).padStart(15)}`
  );
});

// ============================================================================
// SCENARIO 5: Balance Analysis - Proximity vs Freshness Trade-offs
// ============================================================================
console.log('\n\n⚖️  SCENARIO 5: Balance Analysis - Finding Products with Both High Scores');
console.log('-'.repeat(80));

// Products with both scores >= 70
const balanced = withScores.filter(p => p.proximity_score >= 70 && p.freshness_score >= 70);

console.log(`\nProducts with BOTH proximity ≥70 AND freshness ≥70: ${balanced.length}/${withScores.length}`);

if (balanced.length > 0) {
  console.log('\nBalanced Products (Good proximity AND good freshness):');
  console.log('Product              | Distance | Fresh% | ProxScore | FreshScore');
  console.log('-'.repeat(80));
  balanced.slice(0, 5).forEach(p => {
    console.log(
      `${p.product_name.substring(0, 20).padEnd(20)} | ` +
      `${String(p.distance_km).padStart(6)} km | ` +
      `${String(p.freshness_percent).padStart(5)}% | ` +
      `${String(p.proximity_score).padStart(9)} | ` +
      `${String(p.freshness_score).padStart(10)}`
    );
  });
}

// Products with trade-offs
const closeButStale = withScores.filter(p => p.proximity_score >= 80 && p.freshness_score < 60);
const farButFresh = withScores.filter(p => p.proximity_score < 40 && p.freshness_score >= 80);

console.log(`\n\nTrade-off Analysis:`);
console.log(`  Close but less fresh (prox≥80, fresh<60): ${closeButStale.length} products`);
console.log(`  Far but very fresh (prox<40, fresh≥80): ${farButFresh.length} products`);

// ============================================================================
// SCENARIO 6: Multi-Buyer Comparison
// ============================================================================
console.log('\n\n👥 SCENARIO 6: Score Comparison Across Different Buyers');
console.log('-'.repeat(80));

const sampleProductForComparison = enrichedProducts[10]; // Pick one product
const buyers = mockData.mockUsers.filter(u => u.type === 'buyer' || u.type === 'both');

console.log(`Sample Product: ${sampleProductForComparison.product_name}`);
console.log(`Location: ${sampleProductForComparison.location.address}`);
console.log(`Freshness: ${sampleProductForComparison.freshness_percent.toFixed(2)}%\n`);

console.log('Buyer              | Distance | Max Radius | ProxScore | FreshScore');
console.log('-'.repeat(80));

buyers.slice(0, 5).forEach(b => {
  const distance = calculateDistance(b.location, sampleProductForComparison.location);
  const distance_km = Number(distance.toFixed(2));
  const proximity_score = normalizeProximityScore(distance_km, b.preferences.max_radius_km);
  const freshness_score = normalizeFreshnessScore(sampleProductForComparison.freshness_percent);
  
  console.log(
    `${b.name.substring(0, 18).padEnd(18)} | ` +
    `${String(distance_km).padStart(6)} km | ` +
    `${String(b.preferences.max_radius_km).padStart(10)} km | ` +
    `${String(proximity_score).padStart(9)} | ` +
    `${String(freshness_score).padStart(10)}`
  );
});

// ============================================================================
// SCENARIO 7: Performance Test - Batch Processing
// ============================================================================
console.log('\n\n⚡ SCENARIO 7: Performance Test - Batch Score Normalization');
console.log('-'.repeat(80));

const startTime = Date.now();
const batchResult = normalizeScoresBatch(enrichedProducts, 50);
const endTime = Date.now();

console.log(`\nBatch normalized ${batchResult.length} products in ${endTime - startTime}ms`);
console.log(`Average: ${((endTime - startTime) / batchResult.length).toFixed(2)}ms per product`);

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n\n' + '='.repeat(80));
console.log('📋 INTEGRATION TEST SUMMARY');
console.log('='.repeat(80));

console.log('\n✅ Completed Scenarios:');
console.log('  1. Buyer product search with normalized scores');
console.log('  2. Score distribution analysis (proximity & freshness)');
console.log('  3. Max radius impact on proximity scores');
console.log('  4. Top products by score type');
console.log('  5. Balance analysis (trade-offs between proximity & freshness)');
console.log('  6. Multi-buyer score comparison');
console.log('  7. Performance test (batch processing)');

console.log('\n📊 Key Statistics:');
console.log(`  Total products analyzed: ${withScores.length}`);
console.log(`  Average proximity score: ${avgProximityScore.toFixed(2)}/100`);
console.log(`  Average freshness score: ${avgFreshnessScore.toFixed(2)}/100`);
console.log(`  Products with both scores ≥70: ${balanced.length} (${((balanced.length/withScores.length)*100).toFixed(1)}%)`);

console.log('\n💡 Insights:');
console.log('  - Proximity scores are inversely proportional to distance');
console.log('  - Freshness scores directly reflect shelf life percentage');
console.log('  - Both metrics normalized to comparable 0-100 scales');
console.log('  - Ready for weighted combination in Task 2.4');

console.log('\n✅ Task 2.3 Integration Test Complete!');
console.log('=' .repeat(80));
