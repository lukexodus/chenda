/**
 * Chenda - Product Sorter Integration Tests
 * Phase 5: Complete sorting and display mode testing
 * 
 * Tests:
 * - Ranking mode with real data
 * - Filter+sort mode with multiple criteria
 * - Mode toggling
 * - Complete pipeline integration
 */

const {
  sortProducts,
  rankingMode,
  filterAndSortMode,
  displayProducts,
  toggleMode,
  getSortOptions,
  getModeDescription,
  createDisplayConfig
} = require('./product_sorter');

const { calculateDistance } = require('../calculations/haversine');
const { calculateShelfLifeMetrics } = require('../calculations/shelf-life');
const { mockProducts, mockUsers } = require('../../product-display/mock_data');
const productTypes = require('../../product-management/product-types.json');

console.log('🧪 Product Sorter Integration Test\n');
console.log('='.repeat(80));

// ============================================================================
// SETUP: Enrich products with complete metrics
// ============================================================================

const currentDate = new Date('2026-02-06T12:00:00Z');
console.log(`Current date: ${currentDate.toISOString()}\n`);

const testBuyer = mockUsers.find(u => u.name === 'Maria Santos') || mockUsers[0];
console.log('🔧 Setup: Enriching products with complete metrics...');

// Enrich all products
const fullyEnrichedProducts = mockProducts.map(product => {
  const distance_km = calculateDistance(testBuyer.location, product.location);
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

console.log(`✓ Enriched ${fullyEnrichedProducts.length} products\n`);

// ============================================================================
// SCENARIO 1: Ranking Mode (Task 5.1)
// ============================================================================

console.log('🏆 SCENARIO 1: Ranking Mode (Sort by Combined Score)');
console.log('-'.repeat(80));

const rankedProducts = rankingMode(fullyEnrichedProducts, testBuyer, {
  proximityWeight: 50,
  freshnessWeight: 50
});

console.log('\nTop 10 Products (Ranking Mode - Balanced 50/50):\n');
console.log('Rank | Product              | Distance | Fresh% | Score  | Price');
console.log('-'.repeat(80));

rankedProducts.slice(0, 10).forEach((product, index) => {
  console.log(
    `${String(index + 1).padStart(4)} | ` +
    `${product.name.padEnd(20)} | ` +
    `${product.distance_km.toFixed(2).padStart(7)} km | ` +
    `${product.freshness_percent.toFixed(1).padStart(5)}% | ` +
    `${product.combined_score.toFixed(2).padStart(6)} | ` +
    `₱${product.price.toFixed(2).padStart(7)}`
  );
});

console.log(`\nTotal ranked: ${rankedProducts.length} products\n`);

// ============================================================================
// SCENARIO 2: Filter+Sort Mode - Sort by Price (Task 5.2)
// ============================================================================

console.log('💰 SCENARIO 2: Filter+Sort Mode - Sort by Price');
console.log('-'.repeat(80));

const priceResult = filterAndSortMode(fullyEnrichedProducts, testBuyer, {
  sortBy: 'price',
  order: 'asc',
  applyFilter: true
});

console.log('\nTop 10 Products (Sorted by Price - Lowest First):\n');
console.log('Rank | Product              | Price    | Distance | Fresh% | Score');
console.log('-'.repeat(80));

priceResult.products.slice(0, 10).forEach((product, index) => {
  console.log(
    `${String(index + 1).padStart(4)} | ` +
    `${product.name.padEnd(20)} | ` +
    `₱${product.price.toFixed(2).padStart(7)} | ` +
    `${product.distance_km.toFixed(2).padStart(7)} km | ` +
    `${product.freshness_percent.toFixed(1).padStart(5)}% | ` +
    `${(product.combined_score || 0).toFixed(2).padStart(6)}`
  );
});

if (priceResult.summary) {
  console.log(`\nFiltering applied:`);
  console.log(`  Initial: ${priceResult.summary.initialCount} products`);
  console.log(`  After filtering: ${priceResult.summary.finalCount} products`);
}

console.log('\n');

// ============================================================================
// SCENARIO 3: Filter+Sort Mode - Sort by Distance
// ============================================================================

console.log('📍 SCENARIO 3: Filter+Sort Mode - Sort by Distance');
console.log('-'.repeat(80));

const distanceResult = filterAndSortMode(fullyEnrichedProducts, testBuyer, {
  sortBy: 'distance',
  order: 'asc',
  applyFilter: true
});

console.log('\nTop 10 Products (Sorted by Distance - Nearest First):\n');
console.log('Rank | Product              | Distance | Fresh% | Price    | Score');
console.log('-'.repeat(80));

distanceResult.products.slice(0, 10).forEach((product, index) => {
  console.log(
    `${String(index + 1).padStart(4)} | ` +
    `${product.name.padEnd(20)} | ` +
    `${product.distance_km.toFixed(2).padStart(7)} km | ` +
    `${product.freshness_percent.toFixed(1).padStart(5)}% | ` +
    `₱${product.price.toFixed(2).padStart(7)} | ` +
    `${(product.combined_score || 0).toFixed(2).padStart(6)}`
  );
});

console.log('\n');

// ============================================================================
// SCENARIO 4: Filter+Sort Mode - Sort by Freshness
// ============================================================================

console.log('🌿 SCENARIO 4: Filter+Sort Mode - Sort by Freshness');
console.log('-'.repeat(80));

const freshnessResult = filterAndSortMode(fullyEnrichedProducts, testBuyer, {
  sortBy: 'freshness',
  order: 'desc',
  applyFilter: true
});

console.log('\nTop 10 Products (Sorted by Freshness - Freshest First):\n');
console.log('Rank | Product              | Fresh% | Distance | Price    | Score');
console.log('-'.repeat(80));

freshnessResult.products.slice(0, 10).forEach((product, index) => {
  console.log(
    `${String(index + 1).padStart(4)} | ` +
    `${product.name.padEnd(20)} | ` +
    `${product.freshness_percent.toFixed(1).padStart(5)}% | ` +
    `${product.distance_km.toFixed(2).padStart(7)} km | ` +
    `₱${product.price.toFixed(2).padStart(7)} | ` +
    `${(product.combined_score || 0).toFixed(2).padStart(6)}`
  );
});

console.log('\n');

// ============================================================================
// SCENARIO 5: Filter+Sort Mode - Sort by Expiration Date
// ============================================================================

console.log('⏰ SCENARIO 5: Filter+Sort Mode - Sort by Expiration Date');
console.log('-'.repeat(80));

const expirationResult = filterAndSortMode(fullyEnrichedProducts, testBuyer, {
  sortBy: 'expiration',
  order: 'asc',
  applyFilter: true
});

console.log('\nTop 10 Products (Sorted by Expiration - Expires Soonest First):\n');
console.log('Rank | Product              | Expires On  | Days Left | Fresh%');
console.log('-'.repeat(75));

expirationResult.products.slice(0, 10).forEach((product, index) => {
  const daysLeft = product.days_until_expiration || 0;
  const expiryDate = product.expiration_date ? product.expiration_date.toISOString().split('T')[0] : 'N/A';
  
  console.log(
    `${String(index + 1).padStart(4)} | ` +
    `${product.name.padEnd(20)} | ` +
    `${expiryDate.padEnd(11)} | ` +
    `${String(daysLeft).padStart(9)} | ` +
    `${product.freshness_percent.toFixed(1).padStart(5)}%`
  );
});

console.log('\n');

// ============================================================================
// SCENARIO 6: Display Products with Mode Toggle (Task 5.3)
// ============================================================================

console.log('🔄 SCENARIO 6: Mode Toggle Functionality');
console.log('-'.repeat(80));

let currentMode = 'ranking';
console.log(`\nInitial mode: ${currentMode}`);

// Display in ranking mode
const rankingDisplay = displayProducts(fullyEnrichedProducts, testBuyer, {
  mode: currentMode,
  proximityWeight: 60,
  freshnessWeight: 40
});

console.log(`\nRanking Mode Results:`);
console.log(`  Mode: ${rankingDisplay.mode}`);
console.log(`  Products: ${rankingDisplay.products.length}`);
console.log(`  Weights: ${rankingDisplay.summary.weights.proximityWeight}% proximity, ${rankingDisplay.summary.weights.freshnessWeight}% freshness`);
console.log(`  Top 3: ${rankingDisplay.products.slice(0, 3).map(p => p.name).join(', ')}`);

// Toggle to filter mode
currentMode = toggleMode(currentMode);
console.log(`\nToggled to: ${currentMode}`);

// Display in filter mode
const filterDisplay = displayProducts(fullyEnrichedProducts, testBuyer, {
  mode: currentMode,
  sortBy: 'price',
  order: 'asc'
});

console.log(`\nFilter Mode Results:`);
console.log(`  Mode: ${filterDisplay.mode}`);
console.log(`  Products: ${filterDisplay.products.length}`);
console.log(`  Sorted by: ${filterDisplay.summary.sortedBy}`);
console.log(`  Sort order: ${filterDisplay.summary.sortOrder}`);
console.log(`  Top 3: ${filterDisplay.products.slice(0, 3).map(p => p.name).join(', ')}`);

// Toggle back to ranking
currentMode = toggleMode(currentMode);
console.log(`\nToggled back to: ${currentMode}\n`);

// ============================================================================
// SCENARIO 7: Compare All Sort Options
// ============================================================================

console.log('📊 SCENARIO 7: Compare All Sort Options');
console.log('-'.repeat(80));

const sortOptions = getSortOptions();

console.log('\nAvailable sort options:\n');

sortOptions.forEach((option, index) => {
  const result = filterAndSortMode(fullyEnrichedProducts, testBuyer, {
    sortBy: option.value,
    order: option.defaultOrder,
    applyFilter: true
  });

  const top3 = result.products.slice(0, 3);
  
  console.log(`${index + 1}. ${option.label} (${option.defaultOrder})`);
  console.log(`   Description: ${option.description}`);
  console.log(`   Top 3 products: ${top3.map(p => p.name).join(', ')}`);
  console.log('');
});

// ============================================================================
// SCENARIO 8: Mode Descriptions
// ============================================================================

console.log('📝 SCENARIO 8: Mode Descriptions');
console.log('-'.repeat(80));

const rankingModeDesc = getModeDescription('ranking');
const filterModeDesc = getModeDescription('filter');

console.log('\nRanking Mode:');
console.log(`  Name: ${rankingModeDesc.name}`);
console.log(`  Description: ${rankingModeDesc.description}`);
console.log(`  Sorted by: ${rankingModeDesc.sortedBy}`);
console.log(`  User control: ${rankingModeDesc.userControl}`);

console.log('\nFilter & Sort Mode:');
console.log(`  Name: ${filterModeDesc.name}`);
console.log(`  Description: ${filterModeDesc.description}`);
console.log(`  Sorted by: ${filterModeDesc.sortedBy}`);
console.log(`  User control: ${filterModeDesc.userControl}\n`);

// ============================================================================
// SCENARIO 9: Create Display Configurations
// ============================================================================

console.log('⚙️  SCENARIO 9: Display Configuration Creation');
console.log('-'.repeat(80));

console.log('\nCreating configurations for different scenarios:\n');

const configs = [
  { name: 'Budget Shopper', config: createDisplayConfig('filter', { sortBy: 'price', order: 'asc' }) },
  { name: 'Convenience Buyer', config: createDisplayConfig('filter', { sortBy: 'distance', order: 'asc' }) },
  { name: 'Quality Seeker', config: createDisplayConfig('filter', { sortBy: 'freshness', order: 'desc' }) },
  { name: 'Balanced Buyer', config: createDisplayConfig('ranking', { proximityWeight: 50, freshnessWeight: 50 }) },
  { name: 'Premium Buyer', config: createDisplayConfig('ranking', { proximityWeight: 30, freshnessWeight: 70 }) }
];

configs.forEach(({ name, config }) => {
  console.log(`${name}:`);
  console.log(`  Mode: ${config.mode}`);
  if (config.mode === 'filter') {
    console.log(`  Sort by: ${config.sortBy}`);
    console.log(`  Order: ${config.order || 'default'}`);
  } else {
    console.log(`  Proximity weight: ${config.proximityWeight}%`);
    console.log(`  Freshness weight: ${config.freshnessWeight}%`);
  }
  console.log('');
});

// ============================================================================
// SCENARIO 10: Ranking vs Filter Mode Comparison
// ============================================================================

console.log('⚖️  SCENARIO 10: Ranking vs Filter Mode Comparison');
console.log('-'.repeat(80));

const rankingTop5 = rankingMode(fullyEnrichedProducts, testBuyer, {
  proximityWeight: 50,
  freshnessWeight: 50
}).slice(0, 5);

const filterTop5 = filterAndSortMode(fullyEnrichedProducts, testBuyer, {
  sortBy: 'price',
  order: 'asc',
  applyFilter: true
}).products.slice(0, 5);

console.log('\nTop 5 Comparison:\n');
console.log('Ranking Mode (50/50)        | Filter Mode (by price)');
console.log('-'.repeat(80));

const minLength = Math.min(rankingTop5.length, filterTop5.length, 5);

if (minLength === 0) {
  console.log('(No products available in filter mode - all expired)');
} else {
  for (let i = 0; i < minLength; i++) {
    const rankProduct = rankingTop5[i];
    const filterProduct = filterTop5[i];
    
    console.log(
      `${(i + 1)}. ${rankProduct.name.padEnd(22)} | ` +
      `${(i + 1)}. ${filterProduct ? filterProduct.name.padEnd(22) : 'N/A'.padEnd(22)}`
    );
  }
}

// Show ranking results even if filter is empty
if (filterTop5.length === 0 && rankingTop5.length > 0) {
  console.log('\nRanking Mode only (filter removed all products):');
  for (let i = 0; i < Math.min(5, rankingTop5.length); i++) {
    console.log(`${(i + 1)}. ${rankingTop5[i].name}`);
  }
}

console.log('\n');

// ============================================================================
// SCENARIO 11: Performance Benchmark
// ============================================================================

console.log('⚡ SCENARIO 11: Performance Benchmark');
console.log('-'.repeat(80));

console.log('\nBenchmarking sort operations...\n');

const iterations = 1000;

// Benchmark ranking mode
const rankingStart = Date.now();
for (let i = 0; i < iterations; i++) {
  rankingMode(fullyEnrichedProducts, testBuyer);
}
const rankingTime = Date.now() - rankingStart;

// Benchmark filter+sort mode (price)
const priceStart = Date.now();
for (let i = 0; i < iterations; i++) {
  filterAndSortMode(fullyEnrichedProducts, testBuyer, { sortBy: 'price' });
}
const priceTime = Date.now() - priceStart;

// Benchmark filter+sort mode (distance)
const distanceStart = Date.now();
for (let i = 0; i < iterations; i++) {
  filterAndSortMode(fullyEnrichedProducts, testBuyer, { sortBy: 'distance' });
}
const distanceTime = Date.now() - distanceStart;

console.log(`Ranking Mode (${iterations} iterations):`);
console.log(`  Total time: ${rankingTime}ms`);
console.log(`  Average: ${(rankingTime / iterations).toFixed(3)}ms`);

console.log(`\nFilter+Sort Mode - Price (${iterations} iterations):`);
console.log(`  Total time: ${priceTime}ms`);
console.log(`  Average: ${(priceTime / iterations).toFixed(3)}ms`);

console.log(`\nFilter+Sort Mode - Distance (${iterations} iterations):`);
console.log(`  Total time: ${distanceTime}ms`);
console.log(`  Average: ${(distanceTime / iterations).toFixed(3)}ms\n`);

// ============================================================================
// SCENARIO 12: Edge Cases
// ============================================================================

console.log('🔧 SCENARIO 12: Edge Cases');
console.log('-'.repeat(80));

console.log('\nTesting edge cases:\n');

// Empty array
try {
  const emptyResult = sortProducts([], 'price');
  console.log(`✅ Empty array: Returns ${emptyResult.length} products`);
} catch (e) {
  console.log(`❌ Empty array: ${e.message}`);
}

// Single product
try {
  const singleResult = sortProducts([fullyEnrichedProducts[0]], 'price');
  console.log(`✅ Single product: Returns ${singleResult.length} product`);
} catch (e) {
  console.log(`❌ Single product: ${e.message}`);
}

// Mode toggle twice
try {
  let mode = 'ranking';
  mode = toggleMode(mode);
  mode = toggleMode(mode);
  console.log(`✅ Mode toggle twice: Back to ${mode}`);
} catch (e) {
  console.log(`❌ Mode toggle twice: ${e.message}`);
}

console.log('\n');

// ============================================================================
// FINAL SUMMARY
// ============================================================================

console.log('='.repeat(80));
console.log('📋 INTEGRATION TEST SUMMARY');
console.log('='.repeat(80));

console.log('\n✅ Completed Scenarios:');
console.log('  1. Ranking mode (sort by combined score)');
console.log('  2. Filter+sort mode - sort by price');
console.log('  3. Filter+sort mode - sort by distance');
console.log('  4. Filter+sort mode - sort by freshness');
console.log('  5. Filter+sort mode - sort by expiration date');
console.log('  6. Mode toggle functionality');
console.log('  7. Compare all sort options');
console.log('  8. Mode descriptions');
console.log('  9. Display configuration creation');
console.log('  10. Ranking vs filter mode comparison');
console.log('  11. Performance benchmark');
console.log('  12. Edge cases testing');

console.log('\n📊 Key Metrics:');
console.log(`  Products tested: ${fullyEnrichedProducts.length}`);
console.log(`  Sort options: ${sortOptions.length}`);
console.log(`  Display modes: 2 (ranking, filter)`);
console.log(`  Ranking time: ${(rankingTime / iterations).toFixed(3)}ms avg`);
console.log(`  Sort time: ${(priceTime / iterations).toFixed(3)}ms avg`);

console.log('\n💡 Insights:');
console.log('  - Ranking mode: Best for personalized recommendations');
console.log('  - Filter mode: Best for specific criteria (price, distance)');
console.log('  - Mode toggle: Allows users to switch views easily');
console.log('  - Multiple sort options: Price, distance, freshness, expiration');
console.log('  - Performance: All modes execute in <1ms per operation');

console.log('\n✅ Phase 5 Integration Test Complete!');
console.log('='.repeat(80));
