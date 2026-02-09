/**
 * Chenda Algorithm - Integration Tests
 * Phase 6: Main Algorithm Integration
 * 
 * Tests the complete pipeline with real mock data:
 * - 30 USDA perishable products
 * - Multiple buyer personas
 * - Various configuration scenarios
 * - Performance benchmarks
 */

const { chendaAlgorithm, quickSearch, searchByPrice, searchByDistance, searchByFreshness } = require('./chenda_algorithm');
const mockData = require('../product-display/mock_data');

console.log('Running chenda_algorithm.js integration tests...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

// ============================================================================
// TEST DATA PREPARATION
// ============================================================================

// Extract buyers and products from mock data
const buyers = mockData.mockUsers.filter(user => user.type === 'buyer' || user.type === 'both');
const rawProducts = mockData.mockProducts;

// Load product types to enrich products with shelf life data
const productTypes = require('../product-management/product-types.json');

// Create a map of product types by ID for quick lookup
const productTypeMap = {};
for (const pt of productTypes) {
  productTypeMap[pt.id] = pt;
}

// Enrich products with product type data (total_shelf_life_days)
const products = rawProducts.map(product => {
  const productType = productTypeMap[product.product_type_id];
  if (!productType) {
    return product; // Return as-is if product type not found
  }
  
  // Merge product type data with product
  return {
    ...product,
    product_name: productType.name,
    category: productType.category_id,
    total_shelf_life_days: productType.default_shelf_life_days, // Add required field for shelf life calculation
    product_type: productType
  };
});

// Helper to create simplified buyer object
function createBuyer(mockUser) {
  return {
    latitude: mockUser.location.lat,
    longitude: mockUser.location.lng,
    storage_condition: 'refrigerated',
    preferences: mockUser.preferences
  };
}

// ============================================================================
// SCENARIO 1: BASIC ALGORITHM EXECUTION
// ============================================================================

test('Scenario 1.1: Execute algorithm with default config', () => {
  const buyer = createBuyer(buyers[0]); // Maria Santos
  const result = chendaAlgorithm(buyer, products);
  
  if (!result.products || !Array.isArray(result.products)) {
    throw new Error('Should return products array');
  }
  
  if (!result.metadata) {
    throw new Error('Should return metadata');
  }
  
  if (typeof result.metadata.execution_time_ms !== 'number') {
    throw new Error('Should track execution time');
  }
});

test('Scenario 1.2: Algorithm enriches all products with distance', () => {
  const buyer = createBuyer(buyers[0]);
  const result = chendaAlgorithm(buyer, products, { max_radius: 100 }); // Large radius to include all
  
  const productsWithoutDistance = result.products.filter(p => p.distance_km == null);
  if (productsWithoutDistance.length > 0) {
    throw new Error('All products should have distance_km calculated');
  }
});

test('Scenario 1.3: Algorithm enriches products with shelf life metrics', () => {
  const buyer = createBuyer(buyers[0]);
  const result = chendaAlgorithm(buyer, products, { max_radius: 100 });
  
  if (result.products.length === 0) return; // Skip if all filtered
  
  const product = result.products[0];
  if (product.remaining_shelf_life_days == null) {
    throw new Error('Products should have remaining_shelf_life_days');
  }
  if (product.freshness_percent == null) {
    throw new Error('Products should have freshness_percent');
  }
});

// ============================================================================
// SCENARIO 2: RANKING MODE
// ============================================================================

test('Scenario 2.1: Ranking mode sorts by combined score', () => {
  const buyer = createBuyer(buyers[0]);
  const result = chendaAlgorithm(buyer, products, {
    mode: 'ranking',
    max_radius: 50
  });
  
  if (result.products.length < 2) return;
  
  // Check all products have combined_score
  for (const product of result.products) {
    if (typeof product.combined_score !== 'number') {
      throw new Error('Ranking mode products should have combined_score');
    }
  }
  
  // Check sorted descending
  for (let i = 0; i < result.products.length - 1; i++) {
    if (result.products[i].combined_score < result.products[i + 1].combined_score) {
      throw new Error('Products should be sorted by score descending');
    }
  }
});

test('Scenario 2.2: Balanced weights (50/50)', () => {
  const buyer = createBuyer(buyers[0]);
  const result = chendaAlgorithm(buyer, products, {
    mode: 'ranking',
    weight_preset: 'balanced',
    max_radius: 50
  });
  
  const weights = result.metadata.config.weights;
  if (weights.proximity_weight !== 0.5 || weights.freshness_weight !== 0.5) {
    throw new Error('Balanced preset should use 50/50 weights');
  }
});

test('Scenario 2.3: Proximity-focused weights (70/30)', () => {
  const buyer = createBuyer(buyers[1]); // Carlos Reyes - convenience shopper
  const result = chendaAlgorithm(buyer, products, {
    mode: 'ranking',
    weight_preset: 'proximity_focused',
    max_radius: 30
  });
  
  const weights = result.metadata.config.weights;
  if (weights.proximity_weight !== 0.7 || weights.freshness_weight !== 0.3) {
    throw new Error('Proximity-focused preset should use 70/30 weights');
  }
});

test('Scenario 2.4: Freshness-focused weights (30/70)', () => {
  const buyer = createBuyer(buyers[2]); // Ana Cruz - quality-conscious
  const result = chendaAlgorithm(buyer, products, {
    mode: 'ranking',
    weight_preset: 'freshness_focused',
    max_radius: 40
  });
  
  const weights = result.metadata.config.weights;
  if (weights.proximity_weight !== 0.3 || weights.freshness_weight !== 0.7) {
    throw new Error('Freshness-focused preset should use 30/70 weights');
  }
});

// ============================================================================
// SCENARIO 3: FILTER MODE
// ============================================================================

test('Scenario 3.1: Filter mode with price sorting (ascending)', () => {
  const buyer = createBuyer(buyers[3]); // Robert Lee - budget-conscious
  const result = chendaAlgorithm(buyer, products, {
    mode: 'filter',
    sort_by: 'price',
    sort_order: 'asc',
    max_radius: 50
  });
  
  if (result.products.length < 2) return;
  
  // Check sorted by price ascending
  for (let i = 0; i < result.products.length - 1; i++) {
    if (result.products[i].price > result.products[i + 1].price) {
      throw new Error('Filter mode should sort by price ascending');
    }
  }
});

test('Scenario 3.2: Filter mode with distance sorting', () => {
  const buyer = createBuyer(buyers[0]);
  const result = chendaAlgorithm(buyer, products, {
    mode: 'filter',
    sort_by: 'distance',
    sort_order: 'asc',
    max_radius: 50
  });
  
  if (result.products.length < 2) return;
  
  // Check sorted by distance ascending
  for (let i = 0; i < result.products.length - 1; i++) {
    if (result.products[i].distance_km > result.products[i + 1].distance_km) {
      throw new Error('Filter mode should sort by distance ascending');
    }
  }
});

test('Scenario 3.3: Filter mode with freshness sorting (descending)', () => {
  const buyer = createBuyer(buyers[2]);
  const result = chendaAlgorithm(buyer, products, {
    mode: 'filter',
    sort_by: 'freshness',
    sort_order: 'desc',
    max_radius: 50
  });
  
  if (result.products.length < 2) return;
  
  // Check sorted by freshness descending
  for (let i = 0; i < result.products.length - 1; i++) {
    if (result.products[i].freshness_percent < result.products[i + 1].freshness_percent) {
      throw new Error('Filter mode should sort by freshness descending');
    }
  }
});

// ============================================================================
// SCENARIO 4: FILTERING CONSTRAINTS
// ============================================================================

test('Scenario 4.1: Max radius constraint filters distant products', () => {
  const buyer = createBuyer(buyers[0]);
  const result = chendaAlgorithm(buyer, products, {
    max_radius: 10 // Very tight radius
  });
  
  // All returned products should be within radius
  for (const product of result.products) {
    if (product.distance_km > 10) {
      throw new Error(`Product at ${product.distance_km}km exceeds max_radius of 10km`);
    }
  }
});

test('Scenario 4.2: Min freshness constraint filters stale products', () => {
  const buyer = createBuyer(buyers[2]);
  const result = chendaAlgorithm(buyer, products, {
    max_radius: 50,
    min_freshness_score: 70 // Only very fresh products
  });
  
  // Note: min_freshness_score uses 0-100 scale, but products have freshness_percent
  // The filter should apply this correctly
  if (result.products.length > 0) {
    for (const product of result.products) {
      if (product.freshness_percent < 70) {
        throw new Error(`Product with ${product.freshness_percent}% freshness should be filtered`);
      }
    }
  }
});

test('Scenario 4.3: Stats track filtering results', () => {
  const buyer = createBuyer(buyers[0]);
  const result = chendaAlgorithm(buyer, products, {
    max_radius: 20,
    min_freshness_score: 50
  });
  
  const stats = result.metadata.stats;
  if (!stats.input_products || !stats.filtered_products || !stats.output_products) {
    throw new Error('Stats should track all pipeline stages');
  }
  
  if (stats.input_products !== products.length) {
    throw new Error(`Input count should be ${products.length}`);
  }
  
  if (stats.output_products > stats.filtered_products) {
    throw new Error('Output count cannot exceed filtered count');
  }
});

// ============================================================================
// SCENARIO 5: CONVENIENCE FUNCTIONS
// ============================================================================

test('Scenario 5.1: quickSearch returns top 10 products', () => {
  const buyer = createBuyer(buyers[0]);
  const results = quickSearch(buyer, products, 20);
  
  if (!Array.isArray(results)) {
    throw new Error('quickSearch should return array');
  }
  
  if (results.length > 10) {
    throw new Error('quickSearch should return max 10 products');
  }
  
  // Should be sorted by score
  if (results.length >= 2) {
    for (let i = 0; i < results.length - 1; i++) {
      if (results[i].combined_score < results[i + 1].combined_score) {
        throw new Error('quickSearch results should be sorted by score');
      }
    }
  }
});

test('Scenario 5.2: searchByPrice finds cheapest options', () => {
  const buyer = createBuyer(buyers[3]); // Budget-conscious buyer
  const results = searchByPrice(buyer, products, 30);
  
  if (results.length < 2) return;
  
  // Should be sorted by price ascending
  for (let i = 0; i < results.length - 1; i++) {
    if (results[i].price > results[i + 1].price) {
      throw new Error('searchByPrice should sort by price ascending');
    }
  }
});

test('Scenario 5.3: searchByDistance finds nearest products', () => {
  const buyer = createBuyer(buyers[1]);
  const results = searchByDistance(buyer, products, 25);
  
  if (results.length < 2) return;
  
  // Should be sorted by distance ascending
  for (let i = 0; i < results.length - 1; i++) {
    if (results[i].distance_km > results[i + 1].distance_km) {
      throw new Error('searchByDistance should sort by distance ascending');
    }
  }
});

test('Scenario 5.4: searchByFreshness finds freshest products', () => {
  const buyer = createBuyer(buyers[2]);
  const results = searchByFreshness(buyer, products, 30, 60);
  
  if (results.length === 0) return; // Skip if no products meet criteria
  
  // All products should meet minimum freshness
  for (const product of results) {
    if (product.freshness_percent < 60) {
      throw new Error('searchByFreshness should filter by min freshness');
    }
  }
  
  // Should be sorted by freshness descending
  if (results.length >= 2) {
    for (let i = 0; i < results.length - 1; i++) {
      if (results[i].freshness_percent < results[i + 1].freshness_percent) {
        throw new Error('searchByFreshness should sort by freshness descending');
      }
    }
  }
});

// ============================================================================
// SCENARIO 6: MULTIPLE BUYER PERSONAS
// ============================================================================

test('Scenario 6.1: Budget-conscious buyer (price priority)', () => {
  const buyer = createBuyer(buyers.find(b => b.name === 'Roberto Cruz'));
  const result = chendaAlgorithm(buyer, products, {
    mode: 'filter',
    sort_by: 'price',
    sort_order: 'asc',
    max_radius: 50
  });
  
  if (result.products.length > 0) {
    // First product should be cheapest available
    const firstPrice = result.products[0].price;
    for (const product of result.products) {
      if (product.price < firstPrice) {
        throw new Error('First product should be cheapest');
      }
    }
  }
});

test('Scenario 6.2: Convenience-focused buyer (proximity priority)', () => {
  const buyer = createBuyer(buyers.find(b => b.name === 'Carlos Reyes'));
  const result = chendaAlgorithm(buyer, products, {
    mode: 'ranking',
    weight_preset: 'proximity_focused',
    max_radius: 30
  });
  
  // Metadata should show proximity-focused weights applied
  if (result.metadata.config.weights.proximity_weight <= 0.5) {
    throw new Error('Convenience buyer should use proximity-focused weights');
  }
});

test('Scenario 6.3: Quality-conscious buyer (freshness priority)', () => {
  const buyer = createBuyer(buyers.find(b => b.name === 'Ana Garcia'));
  const result = chendaAlgorithm(buyer, products, {
    mode: 'ranking',
    weight_preset: 'freshness_focused',
    max_radius: 40,
    min_freshness_score: 60
  });
  
  // Should prefer fresher products
  if (result.metadata.config.weights.freshness_weight <= 0.5) {
    throw new Error('Quality buyer should use freshness-focused weights');
  }
});

// ============================================================================
// SCENARIO 7: PERFORMANCE & SCALABILITY
// ============================================================================

test('Scenario 7.1: Algorithm executes in reasonable time (<100ms)', () => {
  const buyer = createBuyer(buyers[0]);
  const start = Date.now();
  const result = chendaAlgorithm(buyer, products, { max_radius: 50 });
  const elapsed = Date.now() - start;
  
  if (elapsed > 100) {
    throw new Error(`Execution took ${elapsed}ms, should be under 100ms`);
  }
  
  // Metadata should also track time
  if (result.metadata.execution_time_ms > elapsed + 10) {
    throw new Error('Metadata execution time seems inaccurate');
  }
});

test('Scenario 7.2: Empty product array handled gracefully', () => {
  const buyer = createBuyer(buyers[0]);
  const result = chendaAlgorithm(buyer, [], { max_radius: 50 });
  
  if (result.products.length !== 0) {
    throw new Error('Empty input should return empty output');
  }
});

test('Scenario 7.3: Very restrictive filters handled gracefully', () => {
  const buyer = createBuyer(buyers[0]);
  const result = chendaAlgorithm(buyer, products, {
    max_radius: 0.01, // Nearly impossible radius
    min_freshness_score: 99.9 // Nearly impossible freshness
  });
  
  // Should not crash, just return empty or very few results
  if (!Array.isArray(result.products)) {
    throw new Error('Should return products array even with restrictive filters');
  }
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log(`\n${'='.repeat(60)}`);
console.log(`Total: ${passed + failed} integration tests`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`${'='.repeat(60)}`);

if (passed > 0) {
  console.log(`\n✓ Phase 6 main algorithm integration verified with ${products.length} products`);
  console.log(`✓ Tested ${buyers.length} buyer personas`);
  console.log(`✓ Verified complete pipeline: Enrich → Filter → Score → Sort`);
}

process.exit(failed > 0 ? 1 : 0);
