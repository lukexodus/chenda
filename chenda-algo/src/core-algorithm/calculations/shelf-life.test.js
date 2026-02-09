/**
 * Chenda - Shelf Life Calculator Integration Test
 * Demonstrates usage with mock products and real USDA product types
 */

const shelfLife = require('./shelf-life.js');
const mockData = require('../../product-display/mock_data.js');
const productTypes = require('../../product-management/product-types.json');

console.log('=== Shelf Life Calculator Integration Test ===\n');

// Current date for all tests
const CURRENT_DATE = new Date('2025-01-30T12:00:00Z');
console.log(`Current date: ${CURRENT_DATE.toISOString()}\n`);

// ============================================================================
// TEST 1: Calculate metrics for all products
// ============================================================================

console.log('TEST 1: Calculate shelf life metrics for all products\n');

// Enrich products with ProductType data
const productsWithMetrics = mockData.mockProducts.map(product => {
  const productType = productTypes.find(pt => pt.id === product.product_type_id);
  
  if (!productType) {
    console.warn(`Warning: Product type ${product.product_type_id} not found`);
    return null;
  }
  
  // Calculate metrics
  const metrics = shelfLife.calculateShelfLifeMetrics({
    total_shelf_life_days: productType.default_shelf_life_days,
    days_already_used: product.days_already_used,
    listed_date: product.listed_date
  }, CURRENT_DATE);
  
  return {
    id: product.id,
    seller_id: product.seller_id,
    name: productType.name,
    description: product.description,
    price: product.price,
    total_shelf_life_days: productType.default_shelf_life_days,
    days_already_used: product.days_already_used,
    listed_date: product.listed_date,
    ...metrics
  };
}).filter(p => p !== null);

console.log(`Total products analyzed: ${productsWithMetrics.length}\n`);

// Show freshness distribution
const freshnessRanges = [
  { min: 90, max: 100, label: '90-100% (Excellent)' },
  { min: 70, max: 90, label: '70-89% (Good)' },
  { min: 50, max: 70, label: '50-69% (Fair)' },
  { min: 30, max: 50, label: '30-49% (Poor)' },
  { min: 0, max: 30, label: '0-29% (Critical)' }
];

console.log('Freshness Distribution:');
freshnessRanges.forEach(range => {
  const count = productsWithMetrics.filter(
    p => p.freshness_percent >= range.min && p.freshness_percent < range.max
  ).length;
  const percentage = ((count / productsWithMetrics.length) * 100).toFixed(1);
  const bar = '█'.repeat(Math.round(percentage / 2));
  console.log(`${range.label.padEnd(20)}: ${bar} ${percentage}% (${count})`);
});

// ============================================================================
// TEST 2: Identify expired products
// ============================================================================

console.log('\n\nTEST 2: Identify expired products\n');

const expiredProducts = productsWithMetrics.filter(p => p.is_expired);
const activeProducts = productsWithMetrics.filter(p => !p.is_expired);

console.log(`Expired products: ${expiredProducts.length}`);
console.log(`Active products: ${activeProducts.length}`);

if (expiredProducts.length > 0) {
  console.log('\nExpired products:');
  expiredProducts.forEach(p => {
    console.log(`  Product #${p.id} - ${p.name}: expired on ${p.expiration_date.toISOString().split('T')[0]}`);
  });
} else {
  console.log('\n✓ No expired products (all products are still fresh)');
}

// ============================================================================
// TEST 3: Top freshest products
// ============================================================================

console.log('\n\nTEST 3: Top 10 freshest products\n');

const sortedByFreshness = [...activeProducts].sort((a, b) => b.freshness_percent - a.freshness_percent);

sortedByFreshness.slice(0, 10).forEach((p, i) => {
  const daysLeft = p.remaining_shelf_life_days;
  const expiresIn = daysLeft === 1 ? '1 day' : `${daysLeft} days`;
  console.log(`${(i + 1).toString().padStart(2)}. Product #${p.id.toString().padStart(2)} - ${p.name}`);
  console.log(`    Freshness: ${p.freshness_percent}% | Expires in: ${expiresIn} | Price: ₱${p.price}`);
  console.log(`    Description: ${p.description}\n`);
});

// ============================================================================
// TEST 4: Products expiring soon (within 3 days)
// ============================================================================

console.log('TEST 4: Products expiring soon (within 3 days)\n');

const expiringSoon = activeProducts.filter(p => p.remaining_shelf_life_days <= 3);

console.log(`Products expiring within 3 days: ${expiringSoon.length}`);

if (expiringSoon.length > 0) {
  expiringSoon
    .sort((a, b) => a.remaining_shelf_life_days - b.remaining_shelf_life_days)
    .forEach(p => {
      const daysLeft = p.remaining_shelf_life_days;
      const urgency = daysLeft === 0 ? '⚠️ EXPIRES TODAY' : 
                     daysLeft === 1 ? '⚠️ Expires tomorrow' : 
                     `Expires in ${daysLeft} days`;
      console.log(`  ${urgency}: Product #${p.id} - ${p.name} (${p.freshness_percent}% fresh)`);
    });
} else {
  console.log('  ✓ No products expiring within 3 days');
}

// ============================================================================
// TEST 5: Filter by minimum freshness threshold
// ============================================================================

console.log('\n\nTEST 5: Filter by minimum freshness threshold\n');

const thresholds = [50, 60, 70, 80, 90];

thresholds.forEach(threshold => {
  const filtered = shelfLife.filterByFreshness(productsWithMetrics, threshold);
  const percentage = ((filtered.length / productsWithMetrics.length) * 100).toFixed(1);
  console.log(`≥${threshold}% fresh: ${filtered.length.toString().padStart(2)} products (${percentage}%)`);
});

// ============================================================================
// TEST 6: Freshness statistics by product type
// ============================================================================

console.log('\n\nTEST 6: Freshness statistics by product type\n');

const productTypeStats = {};

productsWithMetrics.forEach(p => {
  if (!productTypeStats[p.name]) {
    productTypeStats[p.name] = {
      count: 0,
      totalFreshness: 0,
      minFreshness: 100,
      maxFreshness: 0
    };
  }
  
  const stats = productTypeStats[p.name];
  stats.count++;
  stats.totalFreshness += p.freshness_percent;
  stats.minFreshness = Math.min(stats.minFreshness, p.freshness_percent);
  stats.maxFreshness = Math.max(stats.maxFreshness, p.freshness_percent);
});

console.log('Product Type Analysis:');
Object.entries(productTypeStats)
  .sort((a, b) => b[1].count - a[1].count)
  .forEach(([name, stats]) => {
    const avgFreshness = (stats.totalFreshness / stats.count).toFixed(1);
    console.log(`\n${name} (${stats.count} listings):`);
    console.log(`  Average freshness: ${avgFreshness}%`);
    console.log(`  Range: ${stats.minFreshness.toFixed(1)}% - ${stats.maxFreshness.toFixed(1)}%`);
  });

// ============================================================================
// TEST 7: Simulate buyer preferences (min freshness filter)
// ============================================================================

console.log('\n\nTEST 7: Simulate buyer preferences (min freshness filter)\n');

const buyers = [
  { name: 'Maria Santos', minFreshness: 50 },
  { name: 'Carlos Reyes', minFreshness: 60 },
  { name: 'Ana Garcia', minFreshness: 70 }
];

buyers.forEach(buyer => {
  const availableProducts = shelfLife.filterByFreshness(
    productsWithMetrics,
    buyer.minFreshness
  );
  
  const percentage = ((availableProducts.length / productsWithMetrics.length) * 100).toFixed(1);
  console.log(`${buyer.name} (min ${buyer.minFreshness}% freshness):`);
  console.log(`  Available products: ${availableProducts.length}/${productsWithMetrics.length} (${percentage}%)`);
});

// ============================================================================
// TEST 8: Days until expiration analysis
// ============================================================================

console.log('\n\nTEST 8: Days until expiration analysis\n');

const daysUntilExpiration = productsWithMetrics.map(p => p.remaining_shelf_life_days);

const avgDaysRemaining = (daysUntilExpiration.reduce((a, b) => a + b, 0) / daysUntilExpiration.length).toFixed(1);
const minDaysRemaining = Math.min(...daysUntilExpiration);
const maxDaysRemaining = Math.max(...daysUntilExpiration);

console.log('Shelf Life Statistics:');
console.log(`  Average days remaining: ${avgDaysRemaining}`);
console.log(`  Minimum days remaining: ${minDaysRemaining}`);
console.log(`  Maximum days remaining: ${maxDaysRemaining}`);

const daysRanges = [
  { min: 0, max: 3, label: '0-3 days (Urgent)' },
  { min: 3, max: 7, label: '3-7 days (Soon)' },
  { min: 7, max: 14, label: '7-14 days (Medium)' },
  { min: 14, max: 21, label: '14-21 days (Good)' },
  { min: 21, max: 100, label: '21+ days (Excellent)' }
];

console.log('\nDays remaining distribution:');
daysRanges.forEach(range => {
  const count = daysUntilExpiration.filter(d => d >= range.min && d < range.max).length;
  const percentage = ((count / daysUntilExpiration.length) * 100).toFixed(1);
  const bar = '█'.repeat(Math.round(percentage / 2));
  console.log(`${range.label.padEnd(25)}: ${bar} ${percentage}% (${count})`);
});

// ============================================================================
// TEST 9: Seller performance analysis
// ============================================================================

console.log('\n\nTEST 9: Seller freshness performance\n');

const sellers = [...new Set(productsWithMetrics.map(p => p.seller_id))];

sellers.forEach(sellerId => {
  const seller = mockData.mockUsers.find(u => u.id === sellerId);
  const sellerProducts = productsWithMetrics.filter(p => p.seller_id === sellerId);
  
  if (sellerProducts.length === 0) return;
  
  const avgFreshness = (sellerProducts.reduce((sum, p) => sum + p.freshness_percent, 0) / sellerProducts.length).toFixed(1);
  const minFreshness = Math.min(...sellerProducts.map(p => p.freshness_percent)).toFixed(1);
  const maxFreshness = Math.max(...sellerProducts.map(p => p.freshness_percent)).toFixed(1);
  
  console.log(`${seller.name}:`);
  console.log(`  Products: ${sellerProducts.length}`);
  console.log(`  Average freshness: ${avgFreshness}%`);
  console.log(`  Freshness range: ${minFreshness}% - ${maxFreshness}%\n`);
});

// ============================================================================
// TEST 10: Real-world scenario - Complete product filtering
// ============================================================================

console.log('TEST 10: Real-world scenario - Complete product filtering pipeline\n');

console.log('Scenario: Buyer wants products with ≥70% freshness\n');

const initialCount = productsWithMetrics.length;
console.log(`Step 1 - All products: ${initialCount}`);

const step2 = shelfLife.filterExpiredProducts(productsWithMetrics, CURRENT_DATE);
console.log(`Step 2 - Filter expired: ${step2.length} remaining (${initialCount - step2.length} expired)`);

const step3 = shelfLife.filterByFreshness(step2, 70);
console.log(`Step 3 - Filter by freshness (≥70%): ${step3.length} remaining (${step2.length - step3.length} below threshold)`);

console.log('\nFinal results:');
step3
  .sort((a, b) => b.freshness_percent - a.freshness_percent)
  .slice(0, 5)
  .forEach((p, i) => {
    console.log(`${i + 1}. ${p.name} - ${p.freshness_percent}% fresh, expires in ${p.remaining_shelf_life_days} days`);
  });

console.log('\n=== Integration Test Complete ===');

// ============================================================================
// Summary Report
// ============================================================================

console.log('\n=== SUMMARY REPORT ===\n');

const summary = {
  totalProducts: productsWithMetrics.length,
  expiredProducts: expiredProducts.length,
  activeProducts: activeProducts.length,
  avgFreshness: (productsWithMetrics.reduce((sum, p) => sum + p.freshness_percent, 0) / productsWithMetrics.length).toFixed(1),
  avgDaysRemaining: avgDaysRemaining,
  productsAbove90: productsWithMetrics.filter(p => p.freshness_percent >= 90).length,
  productsAbove70: productsWithMetrics.filter(p => p.freshness_percent >= 70).length,
  productsBelow50: productsWithMetrics.filter(p => p.freshness_percent < 50).length,
  expiringSoon: expiringSoon.length
};

console.log(`Total Products Analyzed: ${summary.totalProducts}`);
console.log(`Active Products: ${summary.activeProducts}`);
console.log(`Expired Products: ${summary.expiredProducts}`);
console.log(`Average Freshness: ${summary.avgFreshness}%`);
console.log(`Average Days Remaining: ${summary.avgDaysRemaining}`);
console.log(`\nFreshness Breakdown:`);
console.log(`  ≥90% fresh (Excellent): ${summary.productsAbove90}`);
console.log(`  ≥70% fresh (Good): ${summary.productsAbove70}`);
console.log(`  <50% fresh (Poor): ${summary.productsBelow50}`);
console.log(`  Expiring within 3 days: ${summary.expiringSoon}`);
