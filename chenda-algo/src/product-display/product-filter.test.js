/**
 * Chenda - Product Filter Integration Test
 * Phase 3: Test complete filtering pipeline with real mock data
 * 
 * Tests:
 * 1. Filter products for buyer with all preferences
 * 2. Test individual filter impact (expiration, proximity, freshness)
 * 3. Test filter combinations
 * 4. Analyze filter statistics and removal patterns
 * 5. Test with different buyer personas
 * 6. Complete end-to-end pipeline (enrichment → filtering → scoring → ranking)
 */

const {
  filterByProximity,
  applyFilters,
  filterForBuyer,
  getFilterSummary,
  checkProductFilters,
  createFilterConfig
} = require('./product_filter.js');

const { calculateDistance } = require('../core-algorithm/calculations/haversine.js');
const { calculateShelfLifeMetrics } = require('../core-algorithm/calculations/shelf-life.js');
const { normalizeScores } = require('../core-algorithm/scoring/score-normalizer.js');
const { calculateAndRank } = require('../core-algorithm/scoring/combined-score.js');
const mockData = require('./mock_data.js');
const productTypes = require('../product-management/product-types.json');

console.log('🧪 Product Filter Integration Test\n');
console.log('='.repeat(80));

// Current date for all tests
const CURRENT_DATE = new Date('2026-02-06T12:00:00Z');
console.log(`Current date: ${CURRENT_DATE.toISOString()}\n`);

// ============================================================================
// SETUP: Enrich all products with complete metrics
// ============================================================================
console.log('🔧 Setup: Enriching products with complete metrics...');

const buyer = mockData.mockUsers.find(u => u.id === 1); // Maria Santos
const products = mockData.mockProducts;

const enrichedProducts = products.map(product => {
  const productType = productTypes.find(pt => pt.id === product.product_type_id);
  
  // Calculate all metrics
  const distance_km = Number(calculateDistance(buyer.location, product.location).toFixed(2));
  
  const shelfLifeMetrics = calculateShelfLifeMetrics({
    total_shelf_life_days: productType.default_shelf_life_days,
    days_already_used: product.days_already_used,
    listed_date: product.listed_date
  }, CURRENT_DATE);
  
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
    expiration_date: shelfLifeMetrics.expiration_date,
    is_expired: shelfLifeMetrics.is_expired,
    proximity_score: scores.proximity_score,
    freshness_score: scores.freshness_score
  };
});

console.log(`✓ Enriched ${enrichedProducts.length} products\n`);

// ============================================================================
// SCENARIO 1: Filter with Buyer Preferences
// ============================================================================
console.log('\n📍 SCENARIO 1: Filter Products for Buyer');
console.log('-'.repeat(80));

console.log(`Buyer: ${buyer.name}`);
console.log(`Preferences:`);
console.log(`  - Max radius: ${buyer.preferences.max_radius_km} km`);
console.log(`  - Min freshness: ${buyer.preferences.min_freshness_percent}%`);
console.log(`  - Display mode: ${buyer.preferences.display_mode}\n`);

const result1 = filterForBuyer(enrichedProducts, buyer, CURRENT_DATE);
const summary1 = getFilterSummary(result1.stats);

console.log(summary1.message);
console.log(`\nRemoval Breakdown:`);
console.log(`  - ${summary1.breakdown.expired}`);
console.log(`  - ${summary1.breakdown.proximity}`);
console.log(`  - ${summary1.breakdown.freshness}`);
console.log(`\nRetention rate: ${summary1.retentionRate}%`);

// ============================================================================
// SCENARIO 2: Individual Filter Impact Analysis
// ============================================================================
console.log('\n\n🔍 SCENARIO 2: Individual Filter Impact');
console.log('-'.repeat(80));

// Test each filter individually
const filters = [
  { name: 'No filters', config: { filterExpired: false, maxRadiusKm: null, minFreshnessPercent: null } },
  { name: 'Expiration only', config: { filterExpired: true, maxRadiusKm: null, minFreshnessPercent: null } },
  { name: 'Proximity only', config: { filterExpired: false, maxRadiusKm: buyer.preferences.max_radius_km, minFreshnessPercent: null } },
  { name: 'Freshness only', config: { filterExpired: false, maxRadiusKm: null, minFreshnessPercent: buyer.preferences.min_freshness_percent } },
  { name: 'All filters', config: { filterExpired: true, maxRadiusKm: buyer.preferences.max_radius_km, minFreshnessPercent: buyer.preferences.min_freshness_percent } }
];

console.log('\\nFilter Comparison:');
console.log('Filter Configuration      | Products | Removed | Removal %');
console.log('-'.repeat(80));

filters.forEach(filter => {
  const result = applyFilters(enrichedProducts, { ...filter.config, currentDate: CURRENT_DATE });
  const removalRate = ((result.stats.initial - result.stats.final) / result.stats.initial * 100).toFixed(1);
  
  console.log(
    `${filter.name.padEnd(25)} | ` +
    `${String(result.stats.final).padStart(8)} | ` +
    `${String(result.stats.initial - result.stats.final).padStart(7)} | ` +
    `${String(removalRate).padStart(8)}%`
  );
});

// ============================================================================
// SCENARIO 3: Filter Sensitivity Analysis
// ============================================================================
console.log('\n\n⚙️  SCENARIO 3: Filter Threshold Sensitivity');
console.log('-'.repeat(80));

// Test different proximity thresholds
console.log('\nProximity Radius Impact:');
console.log('Radius (km) | Products Remaining | Removal %');
console.log('-'.repeat(80));

[10, 15, 20, 30, 40, 50].forEach(radius => {
  const result = applyFilters(enrichedProducts, {
    filterExpired: true,
    maxRadiusKm: radius,
    minFreshnessPercent: null,
    currentDate: CURRENT_DATE
  });
  
  const removalRate = ((result.stats.initial - result.stats.final) / result.stats.initial * 100).toFixed(1);
  
  console.log(
    `${String(radius).padStart(11)} | ` +
    `${String(result.stats.final).padStart(18)} | ` +
    `${String(removalRate).padStart(8)}%`
  );
});

// Test different freshness thresholds
console.log('\n\nFreshness Threshold Impact:');
console.log('Min Fresh % | Products Remaining | Removal %');
console.log('-'.repeat(80));

[30, 40, 50, 60, 70, 80, 90].forEach(freshness => {
  const result = applyFilters(enrichedProducts, {
    filterExpired: true,
    maxRadiusKm: null,
    minFreshnessPercent: freshness,
    currentDate: CURRENT_DATE
  });
  
  const removalRate = ((result.stats.initial - result.stats.final) / result.stats.initial * 100).toFixed(1);
  
  console.log(
    `${String(freshness).padStart(11)}% | ` +
    `${String(result.stats.final).padStart(18)} | ` +
    `${String(removalRate).padStart(8)}%`
  );
});

// ============================================================================
// SCENARIO 4: Buyer Persona Filtering
// ============================================================================
console.log('\n\n👥 SCENARIO 4: Different Buyer Personas - Filter Results');
console.log('-'.repeat(80));

const personas = [
  {
    name: 'Flexible Shopper',
    preferences: { max_radius_km: 50, min_freshness_percent: null },
    description: 'Wide radius, any freshness'
  },
  {
    name: 'Quality-Conscious',
    preferences: { max_radius_km: 30, min_freshness_percent: 70 },
    description: 'Moderate radius, high freshness requirement'
  },
  {
    name: 'Convenience-Focused',
    preferences: { max_radius_km: 15, min_freshness_percent: 50 },
    description: 'Small radius, moderate freshness'
  },
  {
    name: 'Premium Buyer',
    preferences: { max_radius_km: 20, min_freshness_percent: 80 },
    description: 'Small radius, very high freshness'
  }
];

console.log('\\nPersona Results:');
personas.forEach(persona => {
  const personaBuyer = {
    preferences: persona.preferences
  };
  
  const result = filterForBuyer(enrichedProducts, personaBuyer, CURRENT_DATE);
  const summary = getFilterSummary(result.stats);
  
  console.log(`\\n${persona.name} (${persona.description})`);
  console.log(`  Products available: ${result.filtered.length}/${enrichedProducts.length}`);
  console.log(`  Removal rate: ${summary.removalRate}%`);
  console.log(`  Breakdown: ${summary.breakdown.expired}, ${summary.breakdown.proximity}, ${summary.breakdown.freshness}`);
});

// ============================================================================
// SCENARIO 5: Products Failing Each Filter
// ============================================================================
console.log('\n\n❌ SCENARIO 5: Products Failing Filters (Examples)');
console.log('-'.repeat(80));

const filterConfig = createFilterConfig(buyer, CURRENT_DATE);

const failedProducts = enrichedProducts
  .map(p => ({
    ...p,
    filterCheck: checkProductFilters(p, filterConfig)
  }))
  .filter(p => !p.filterCheck.passes);

console.log(`\\nTotal products failing filters: ${failedProducts.length}/${enrichedProducts.length}`);

if (failedProducts.length > 0) {
  console.log('\\nFirst 5 Failed Products:');
  console.log('Product              | Distance | Fresh% | Reasons');
  console.log('-'.repeat(80));
  
  failedProducts.slice(0, 5).forEach(p => {
    console.log(
      `${p.product_name.substring(0, 20).padEnd(20)} | ` +
      `${String(p.distance_km).padStart(6)} km | ` +
      `${String(p.freshness_percent.toFixed(1)).padStart(5)}% | ` +
      `${p.filterCheck.reasons.join('; ')}`
    );
  });
}

// Categorize failures
const failuresByReason = {
  expired: failedProducts.filter(p => p.filterCheck.reasons.some(r => r.includes('expired'))).length,
  proximity: failedProducts.filter(p => p.filterCheck.reasons.some(r => r.includes('radius'))).length,
  freshness: failedProducts.filter(p => p.filterCheck.reasons.some(r => r.includes('freshness'))).length,
  multiple: failedProducts.filter(p => p.filterCheck.reasons.length > 1).length
};

console.log('\\nFailure Analysis:');
console.log(`  Expired: ${failuresByReason.expired} products`);
console.log(`  Out of range: ${failuresByReason.proximity} products`);
console.log(`  Not fresh enough: ${failuresByReason.freshness} products`);
console.log(`  Multiple failures: ${failuresByReason.multiple} products`);

// ============================================================================
// SCENARIO 6: Complete End-to-End Pipeline
// ============================================================================
console.log('\n\n🚀 SCENARIO 6: Complete Search Pipeline (Filter → Score → Rank)');
console.log('-'.repeat(80));

// Step 1: Filter
const filtered = filterForBuyer(enrichedProducts, buyer, CURRENT_DATE);
console.log(`\\nStep 1 - Filtering:`);
console.log(`  Started with: ${enrichedProducts.length} products`);
console.log(`  After filtering: ${filtered.filtered.length} products`);

// Step 2: Score and Rank
const ranked = calculateAndRank(
  filtered.filtered,
  buyer.preferences.proximity_weight,
  buyer.preferences.shelf_life_weight
);

console.log(`\\nStep 2 - Scoring & Ranking:`);
console.log(`  Weight config: ${buyer.preferences.proximity_weight}% proximity, ${buyer.preferences.shelf_life_weight}% freshness`);
console.log(`  Products ranked: ${ranked.length}`);

// Step 3: Display top results
console.log('\\nTop 10 Final Results:');
console.log('Rank | Product              | Distance | Fresh% | ProxScore | FreshScore | Combined');
console.log('-'.repeat(80));

ranked.slice(0, 10).forEach((p, idx) => {
  console.log(
    `${String(idx + 1).padStart(4)} | ` +
    `${p.product_name.substring(0, 20).padEnd(20)} | ` +
    `${String(p.distance_km).padStart(6)} km | ` +
    `${String(p.freshness_percent.toFixed(1)).padStart(5)}% | ` +
    `${String(p.proximity_score).padStart(9)} | ` +
    `${String(p.freshness_score).padStart(10)} | ` +
    `${String(p.combined_score).padStart(8)}`
  );
});

// ============================================================================
// SCENARIO 7: Filter Performance Benchmark
// ============================================================================
console.log('\n\n⚡ SCENARIO 7: Filter Performance Benchmark');
console.log('-'.repeat(80));

const iterations = 1000;
const startTime = Date.now();

for (let i = 0; i < iterations; i++) {
  filterForBuyer(enrichedProducts, buyer, CURRENT_DATE);
}

const endTime = Date.now();
const totalTime = endTime - startTime;
const avgTime = totalTime / iterations;

console.log(`\\nFiltered ${enrichedProducts.length} products ${iterations} times`);
console.log(`Total time: ${totalTime}ms`);
console.log(`Average per iteration: ${avgTime.toFixed(3)}ms`);
console.log(`Average per product: ${(avgTime / enrichedProducts.length).toFixed(4)}ms`);

// ============================================================================
// SCENARIO 8: Filter vs No Filter Comparison
// ============================================================================
console.log('\n\n📊 SCENARIO 8: With vs Without Filters - Ranking Impact');
console.log('-'.repeat(80));

// Without filters
const unfiltered = calculateAndRank(
  enrichedProducts,
  buyer.preferences.proximity_weight,
  buyer.preferences.shelf_life_weight
);

// With filters
const withFilters = calculateAndRank(
  filtered.filtered,
  buyer.preferences.proximity_weight,
  buyer.preferences.shelf_life_weight
);

console.log('\\nTop 5 WITHOUT Filters:');
unfiltered.slice(0, 5).forEach((p, idx) => {
  console.log(`  ${idx + 1}. ${p.product_name.padEnd(20)} - Score: ${p.combined_score.toFixed(2)}`);
});

console.log('\\nTop 5 WITH Filters:');
withFilters.slice(0, 5).forEach((p, idx) => {
  console.log(`  ${idx + 1}. ${p.product_name.padEnd(20)} - Score: ${p.combined_score.toFixed(2)}`);
});

const sameTop5 = withFilters.slice(0, 5).every((p, idx) => p.id === unfiltered[idx].id);
console.log(`\\nTop 5 identical: ${sameTop5 ? 'Yes' : 'No'}`);

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n\n' + '='.repeat(80));
console.log('📋 INTEGRATION TEST SUMMARY');
console.log('='.repeat(80));

console.log('\\n✅ Completed Scenarios:');
console.log('  1. Filter products for buyer with preferences');
console.log('  2. Individual filter impact analysis');
console.log('  3. Filter threshold sensitivity testing');
console.log('  4. Buyer persona filtering comparisons');
console.log('  5. Products failing filter analysis');
console.log('  6. Complete end-to-end pipeline (filter → score → rank)');
console.log('  7. Performance benchmark');
console.log('  8. With vs without filters comparison');

const finalSummary = getFilterSummary(result1.stats);

console.log('\\n📊 Key Statistics (Maria Santos - Default Buyer):');
console.log(`  Initial products: ${enrichedProducts.length}`);
console.log(`  After filtering: ${result1.filtered.length}`);
console.log(`  Removal rate: ${finalSummary.removalRate}%`);
console.log(`  Products expired: ${result1.stats.removedExpired}`);
console.log(`  Products out of range: ${result1.stats.removedProximity}`);
console.log(`  Products not fresh enough: ${result1.stats.removedFreshness}`);

console.log('\\n💡 Insights:');
console.log('  - Filtering significantly reduces search space');
console.log('  - Proximity is typically the most restrictive filter');
console.log('  - Freshness threshold dramatically impacts availability');
console.log('  - Complete pipeline: enrichment → filtering → scoring → ranking');
console.log(`  - Performance: ${avgTime.toFixed(3)}ms per filter operation`);

console.log('\\n✅ Phase 3 Integration Test Complete!');
console.log('='.repeat(80));
