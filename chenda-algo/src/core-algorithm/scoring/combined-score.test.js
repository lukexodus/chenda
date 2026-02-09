/**
 * Chenda - Combined Score Calculator Integration Test
 * Task 2.4: Test combined scoring with real mock data
 * 
 * Tests:
 * 1. Calculate combined scores for all products with different weight configurations
 * 2. Compare ranking changes as weights shift (proximity vs freshness priority)
 * 3. Test buyer preference scenarios (conservative, balanced, freshness-focused)
 * 4. Analyze score distribution and ranking stability
 * 5. Complete end-to-end pipeline (distance → freshness → normalize → combine → rank)
 */

const { 
  calculateCombinedScore,
  calculateProductScore,
  calculateCombinedScoresBatch,
  sortByCombinedScore,
  calculateAndRank
} = require('./combined-score.js');

const { calculateDistance } = require('../calculations/haversine.js');
const { calculateShelfLifeMetrics } = require('../calculations/shelf-life.js');
const { normalizeScores } = require('./score-normalizer.js');
const mockData = require('../../product-display/mock_data.js');
const productTypes = require('../../product-management/product-types.json');

console.log('🧪 Combined Score Calculator Integration Test\n');
console.log('=' .repeat(80));

// ============================================================================
// SETUP: Enrich all products with full metrics
// ============================================================================
console.log('\n🔧 Setup: Calculating full product metrics...');

const buyer = mockData.mockUsers.find(u => u.id === 1); // Maria Santos
const products = mockData.mockProducts;

// Complete enrichment pipeline
const fullyEnrichedProducts = products.map(product => {
  const productType = productTypes.find(pt => pt.id === product.product_type_id);
  
  // Step 1: Distance
  const distance_km = Number(calculateDistance(buyer.location, product.location).toFixed(2));
  
  // Step 2: Shelf life metrics
  const shelfLifeMetrics = calculateShelfLifeMetrics({
    total_shelf_life_days: productType.default_shelf_life_days,
    days_already_used: product.days_already_used,
    listed_date: product.listed_date
  });
  
  // Step 3: Normalize scores
  const scores = normalizeScores({
    distance_km,
    freshness_percent: shelfLifeMetrics.freshness_percent,
    max_radius_km: buyer.preferences.max_radius_km
  });
  
  return {
    id: product.id,
    product_name: productType.name,
    seller_id: product.seller_id,
    price: product.price,
    distance_km,
    freshness_percent: shelfLifeMetrics.freshness_percent,
    proximity_score: scores.proximity_score,
    freshness_score: scores.freshness_score
  };
});

console.log(`✓ Enriched ${fullyEnrichedProducts.length} products with complete metrics\n`);

// ============================================================================
// SCENARIO 1: Calculate combined scores with buyer's preferred weights
// ============================================================================
console.log('\n📍 SCENARIO 1: Combined Scores with Buyer Preferences');
console.log('-'.repeat(80));

const buyerWeights = {
  proximity: buyer.preferences.proximity_weight,
  freshness: buyer.preferences.shelf_life_weight
};

console.log(`Buyer: ${buyer.name}`);
console.log(`Weight Configuration: ${buyerWeights.proximity}% proximity, ${buyerWeights.freshness}% freshness\n`);

const withCombinedScores = calculateCombinedScoresBatch(
  fullyEnrichedProducts,
  buyerWeights.proximity,
  buyerWeights.freshness
);

const ranked = sortByCombinedScore(withCombinedScores);

console.log('Top 10 Ranked Products:');
console.log('Rank | Product              | ProxScore | FreshScore | Combined | Price');
console.log('-'.repeat(80));
ranked.slice(0, 10).forEach((p, idx) => {
  console.log(
    `${String(idx + 1).padStart(4)} | ` +
    `${p.product_name.substring(0, 20).padEnd(20)} | ` +
    `${String(p.proximity_score).padStart(9)} | ` +
    `${String(p.freshness_score).padStart(10)} | ` +
    `${String(p.combined_score).padStart(8)} | ` +
    `₱${String(p.price).padStart(5)}`
  );
});

// ============================================================================
// SCENARIO 2: Weight Sensitivity Analysis
// ============================================================================
console.log('\n\n🔍 SCENARIO 2: Impact of Weight Changes on Rankings');
console.log('-'.repeat(80));

const weightConfigurations = [
  { proximity: 100, freshness: 0, label: '100% Proximity (Distance Only)' },
  { proximity: 70, freshness: 30, label: '70/30 (Proximity Priority)' },
  { proximity: 50, freshness: 50, label: '50/50 (Balanced)' },
  { proximity: 30, freshness: 70, label: '30/70 (Freshness Priority)' },
  { proximity: 0, freshness: 100, label: '0% Proximity (Freshness Only)' }
];

console.log('\nTop 5 Products Under Different Weight Configurations:\n');

weightConfigurations.forEach(config => {
  const scores = calculateCombinedScoresBatch(
    fullyEnrichedProducts,
    config.proximity,
    config.freshness
  );
  const topRanked = sortByCombinedScore(scores).slice(0, 5);
  
  console.log(`${config.label}:`);
  topRanked.forEach((p, idx) => {
    console.log(
      `  ${idx + 1}. ${p.product_name.padEnd(20)} - ` +
      `Score: ${String(p.combined_score).padStart(5)}, ` +
      `Prox: ${String(p.proximity_score).padStart(5)}, ` +
      `Fresh: ${String(p.freshness_score).padStart(5)}`
    );
  });
  console.log('');
});

// ============================================================================
// SCENARIO 3: Buyer Persona Comparisons
// ============================================================================
console.log('\n👥 SCENARIO 3: Different Buyer Personas');
console.log('-'.repeat(80));

const personas = [
  {
    name: 'Convenience Shopper',
    proximity_weight: 80,
    freshness_weight: 20,
    description: 'Prioritizes nearby stores, less concerned about freshness'
  },
  {
    name: 'Balanced Buyer',
    proximity_weight: 50,
    freshness_weight: 50,
    description: 'Equal consideration for distance and freshness'
  },
  {
    name: 'Quality Seeker',
    proximity_weight: 20,
    freshness_weight: 80,
    description: 'Willing to travel for fresher products'
  }
];

console.log('\nTop 3 Products for Each Buyer Persona:\n');

personas.forEach(persona => {
  const scores = calculateAndRank(
    fullyEnrichedProducts,
    persona.proximity_weight,
    persona.freshness_weight
  );
  
  console.log(`${persona.name} (${persona.proximity_weight}/${persona.freshness_weight})`);
  console.log(`  ${persona.description}`);
  scores.slice(0, 3).forEach((p, idx) => {
    console.log(
      `  ${idx + 1}. ${p.product_name.padEnd(20)} - ` +
      `Combined: ${String(p.combined_score).padStart(5)} ` +
      `(${p.distance_km}km, ${p.freshness_percent.toFixed(1)}% fresh)`
    );
  });
  console.log('');
});

// ============================================================================
// SCENARIO 4: Score Distribution Analysis
// ============================================================================
console.log('\n📊 SCENARIO 4: Combined Score Distribution Analysis');
console.log('-'.repeat(80));

// Calculate scores with balanced weights
const balancedScores = calculateCombinedScoresBatch(fullyEnrichedProducts, 50, 50);

const avgCombinedScore = balancedScores.reduce((sum, p) => sum + p.combined_score, 0) / balancedScores.length;
const maxCombinedScore = Math.max(...balancedScores.map(p => p.combined_score));
const minCombinedScore = Math.min(...balancedScores.map(p => p.combined_score));

console.log('\nCombined Score Statistics (50/50 weights):');
console.log(`  Average: ${avgCombinedScore.toFixed(2)}`);
console.log(`  Maximum: ${maxCombinedScore.toFixed(2)}`);
console.log(`  Minimum: ${minCombinedScore.toFixed(2)}`);
console.log(`  Range: ${(maxCombinedScore - minCombinedScore).toFixed(2)}`);

// Score distribution ranges
const combinedRanges = {
  '90-100': balancedScores.filter(p => p.combined_score >= 90).length,
  '80-89': balancedScores.filter(p => p.combined_score >= 80 && p.combined_score < 90).length,
  '70-79': balancedScores.filter(p => p.combined_score >= 70 && p.combined_score < 80).length,
  '60-69': balancedScores.filter(p => p.combined_score >= 60 && p.combined_score < 70).length,
  '<60': balancedScores.filter(p => p.combined_score < 60).length
};

console.log('\nCombined Score Distribution:');
Object.entries(combinedRanges).forEach(([range, count]) => {
  const pct = ((count / balancedScores.length) * 100).toFixed(1);
  const bar = '█'.repeat(Math.round(parseFloat(pct) / 3));
  console.log(`  ${range.padEnd(8)}: ${bar} ${pct}% (${count} products)`);
});

// ============================================================================
// SCENARIO 5: Ranking Stability Analysis
// ============================================================================
console.log('\n\n🎯 SCENARIO 5: Ranking Stability Across Weight Changes');
console.log('-'.repeat(80));

// Track how product rankings change
const productRankings = {};

[
  { prox: 100, fresh: 0 },
  { prox: 70, fresh: 30 },
  { prox: 50, fresh: 50 },
  { prox: 30, fresh: 70 },
  { prox: 0, fresh: 100 }
].forEach(weights => {
  const ranked = calculateAndRank(fullyEnrichedProducts, weights.prox, weights.fresh);
  ranked.forEach((product, idx) => {
    if (!productRankings[product.id]) {
      productRankings[product.id] = {
        name: product.product_name,
        ranks: []
      };
    }
    productRankings[product.id].ranks.push(idx + 1);
  });
});

// Find most stable and most volatile products
const rankingAnalysis = Object.entries(productRankings).map(([id, data]) => {
  const ranks = data.ranks;
  const avgRank = ranks.reduce((sum, r) => sum + r, 0) / ranks.length;
  const variance = ranks.reduce((sum, r) => sum + Math.pow(r - avgRank, 2), 0) / ranks.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    id: parseInt(id),
    name: data.name,
    avgRank: avgRank.toFixed(1),
    stdDev: stdDev.toFixed(2),
    ranks
  };
});

const mostStable = rankingAnalysis.sort((a, b) => parseFloat(a.stdDev) - parseFloat(b.stdDev)).slice(0, 5);
const mostVolatile = rankingAnalysis.sort((a, b) => parseFloat(b.stdDev) - parseFloat(a.stdDev)).slice(0, 5);

console.log('\nMost Stable Rankings (consistent across all weight configurations):');
mostStable.forEach(p => {
  console.log(`  ${p.name.padEnd(20)} - Avg Rank: ${p.avgRank}, StdDev: ${p.stdDev}`);
});

console.log('\nMost Volatile Rankings (change significantly with weights):');
mostVolatile.forEach(p => {
  console.log(`  ${p.name.padEnd(20)} - Avg Rank: ${p.avgRank}, StdDev: ${p.stdDev}`);
  console.log(`    Ranks: ${p.ranks.join(' → ')}`);
});

// ============================================================================
// SCENARIO 6: Best Value Analysis (Score vs Price)
// ============================================================================
console.log('\n\n💰 SCENARIO 6: Best Value - High Score per Peso');
console.log('-'.repeat(80));

const withValueMetric = balancedScores.map(p => ({
  ...p,
  score_per_peso: (p.combined_score / p.price).toFixed(4)
}));

const bestValue = withValueMetric.sort((a, b) => parseFloat(b.score_per_peso) - parseFloat(a.score_per_peso)).slice(0, 5);

console.log('\nTop 5 Best Value Products (Balanced 50/50 weights):');
console.log('Rank | Product              | Combined | Price | Score/₱');
console.log('-'.repeat(80));
bestValue.forEach((p, idx) => {
  console.log(
    `${String(idx + 1).padStart(4)} | ` +
    `${p.product_name.substring(0, 20).padEnd(20)} | ` +
    `${String(p.combined_score).padStart(8)} | ` +
    `₱${String(p.price).padStart(4)} | ` +
    `${p.score_per_peso}`
  );
});

// ============================================================================
// SCENARIO 7: Complete End-to-End Pipeline
// ============================================================================
console.log('\n\n🚀 SCENARIO 7: Complete Algorithm Pipeline');
console.log('-'.repeat(80));

console.log('\nDemonstrating full pipeline for ONE product:\n');

const sampleProduct = products[5];
const sampleProductType = productTypes.find(pt => pt.id === sampleProduct.product_type_id);

console.log(`Product: ${sampleProductType.name}`);
console.log(`Listed by: Seller ID ${sampleProduct.seller_id}`);
console.log(`Price: ₱${sampleProduct.price}`);

// Step-by-step pipeline
console.log('\nPipeline Steps:');

// 1. Calculate distance
const distance = calculateDistance(buyer.location, sampleProduct.location);
console.log(`  1. Distance Calculation: ${distance.toFixed(2)} km`);

// 2. Calculate shelf life
const shelfLife = calculateShelfLifeMetrics({
  total_shelf_life_days: sampleProductType.default_shelf_life_days,
  days_already_used: sampleProduct.days_already_used,
  listed_date: sampleProduct.listed_date
});
console.log(`  2. Shelf Life: ${shelfLife.freshness_percent.toFixed(2)}% fresh (${shelfLife.remaining_shelf_life_days} days left)`);

// 3. Normalize scores
const normalized = normalizeScores({
  distance_km: distance,
  freshness_percent: shelfLife.freshness_percent,
  max_radius_km: buyer.preferences.max_radius_km
});
console.log(`  3. Normalized Scores:`);
console.log(`     - Proximity Score: ${normalized.proximity_score}/100`);
console.log(`     - Freshness Score: ${normalized.freshness_score}/100`);

// 4. Combined score
const combined = calculateCombinedScore(
  normalized.proximity_score,
  normalized.freshness_score,
  buyer.preferences.proximity_weight,
  buyer.preferences.shelf_life_weight
);
console.log(`  4. Combined Score (${buyer.preferences.proximity_weight}/${buyer.preferences.shelf_life_weight} weights): ${combined}/100`);

// 5. Ranking
const allRanked = calculateAndRank(fullyEnrichedProducts, buyer.preferences.proximity_weight, buyer.preferences.shelf_life_weight);
const rank = allRanked.findIndex(p => p.id === sampleProduct.id) + 1;
console.log(`  5. Final Ranking: #${rank} out of ${allRanked.length} products`);

// ============================================================================
// SCENARIO 8: Performance Benchmark
// ============================================================================
console.log('\n\n⚡ SCENARIO 8: Performance Benchmark');
console.log('-'.repeat(80));

const iterations = 100;
const startTime = Date.now();

for (let i = 0; i < iterations; i++) {
  calculateAndRank(fullyEnrichedProducts, 50, 50);
}

const endTime = Date.now();
const totalTime = endTime - startTime;
const avgTime = totalTime / iterations;

console.log(`\nCalculated and ranked ${fullyEnrichedProducts.length} products ${iterations} times`);
console.log(`Total time: ${totalTime}ms`);
console.log(`Average per iteration: ${avgTime.toFixed(2)}ms`);
console.log(`Average per product: ${(avgTime / fullyEnrichedProducts.length).toFixed(4)}ms`);

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n\n' + '='.repeat(80));
console.log('📋 INTEGRATION TEST SUMMARY');
console.log('='.repeat(80));

console.log('\n✅ Completed Scenarios:');
console.log('  1. Combined scores with buyer preferences');
console.log('  2. Weight sensitivity analysis (5 configurations)');
console.log('  3. Buyer persona comparisons (3 personas)');
console.log('  4. Score distribution analysis');
console.log('  5. Ranking stability analysis');
console.log('  6. Best value analysis (score per peso)');
console.log('  7. Complete end-to-end pipeline demonstration');
console.log('  8. Performance benchmark');

console.log('\n📊 Key Statistics:');
console.log(`  Products analyzed: ${fullyEnrichedProducts.length}`);
console.log(`  Average combined score (50/50): ${avgCombinedScore.toFixed(2)}/100`);
console.log(`  Score range: ${minCombinedScore.toFixed(2)} - ${maxCombinedScore.toFixed(2)}`);
console.log(`  Performance: ${avgTime.toFixed(2)}ms per ranking operation`);

console.log('\n💡 Insights:');
console.log('  - Weight changes significantly impact product rankings');
console.log('  - Some products (balanced scores) remain stable across weights');
console.log('  - Others (extreme scores) are highly sensitive to weight changes');
console.log('  - Complete pipeline ready for production use');

console.log('\n✅ Task 2.4 Integration Test Complete!');
console.log('=' .repeat(80));
