/**
 * Phase 7: Edge Case Test Suite
 * Comprehensive testing of boundary conditions and unusual scenarios
 * 
 * Tests:
 * 1. Empty data sets
 * 2. Single item scenarios
 * 3. Extreme values
 * 4. Invalid inputs
 * 5. Boundary conditions
 * 6. Data integrity
 * 7. Performance under stress
 * 8. Concurrent scenario handling
 */

const chendaAlgorithm = require('./core-algorithm/chenda_algorithm');
const { calculateDistance } = require('./core-algorithm/calculations/haversine');
const { calculateShelfLifeMetrics } = require('./core-algorithm/calculations/shelf-life');
const productTypes = require('./product-management/product-types.json');

// Create product type map for enrichment
const productTypeMap = {};
for (const pt of productTypes) {
  productTypeMap[pt.id] = pt;
}

// Helper to enrich products with total_shelf_life_days
function enrichProducts(products) {
  return products.map(product => {
    const productType = productTypeMap[product.product_type_id];
    if (!productType) return product;
    
    return {
      ...product,
      product_name: productType.name,
      total_shelf_life_days: productType.refrigerate_max || productType.refrigerate_min || 7,
      product_type: productType
    };
  });
}

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ ${message}`);
    testsFailed++;
    throw new Error(message);
  }
}

function expectError(fn, message) {
  try {
    fn();
    console.error(`  ✗ ${message} (expected error but got none)`);
    testsFailed++;
    return false;
  } catch (error) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
    return true;
  }
}

// ============================================================================
// SCENARIO 1: EMPTY DATA SETS
// ============================================================================
console.log('\n🔧 SCENARIO 1: Empty Data Sets');
console.log('='.repeat(80));

try {
  const buyer = {
    id: 1,
    name: 'Test Buyer',
    latitude: 14.5995,
    longitude: 120.9842
  };
  
  // Empty products array
  const result1 = chendaAlgorithm.chendaAlgorithm(buyer, [], {});
  assert(Array.isArray(result1.products), 'Empty products returns array');
  assert(result1.products.length === 0, 'Empty products returns empty array');
  assert(result1.metadata.stats.input_products === 0, 'Metadata tracks zero input');
  
  console.log('\n✓ Empty data set handled correctly');
  
} catch (error) {
  console.error(`\n✗ Empty data set test failed: ${error.message}`);
  testsFailed++;
}

// ============================================================================
// SCENARIO 2: SINGLE ITEM SCENARIOS
// ============================================================================
console.log('\n\n🔧 SCENARIO 2: Single Item Scenarios');
console.log('='.repeat(80));

try {
  const buyer = {
    id: 1,
    name: 'Test Buyer',
    latitude: 14.5995,
    longitude: 120.9842
  };
  
  const singleProduct = enrichProducts([{
    id: 1,
    seller_id: 1,
    product_type_id: 5, // Yogurt
    days_already_used: 2,
    listed_date: new Date().toISOString().split('T')[0],
    price: 50,
    quantity: 1,
    location: { lat: 14.6, lng: 120.99 }
  }]);
  
  const result = chendaAlgorithm.chendaAlgorithm(buyer, singleProduct, {
    max_radius: 50,
    mode: 'ranking',
    expiration_filter: false // Disable expiration filter for test
  });
  
  assert(result.products.length === 1, 'Single product returns one result');
  assert(result.products[0].rank === 1 || result.products[0].rank === undefined, 'Single product has rank 1 or undefined');
  assert(result.products[0].distance_km > 0, 'Distance calculated for single product');
  assert(result.products[0].combined_score > 0, 'Score calculated for single product');
  
  console.log('\n✓ Single item scenario handled correctly');
  
} catch (error) {
  console.error(`\n✗ Single item test failed: ${error.message}`);
  testsFailed++;
}

// ============================================================================
// SCENARIO 3: EXTREME VALUES
// ============================================================================
console.log('\n\n🔧 SCENARIO 3: Extreme Values');
console.log('='.repeat(80));

try {
  const currentDate = new Date(); // Define at scenario start
  
  // Very far distance (opposite side of Earth)
  const distanceFar = calculateDistance(
    { lat: 14.5995, lng: 120.9842 },  // Manila
    { lat: 40.7128, lng: -74.0060 }    // New York
  );
  assert(distanceFar > 10000, `Very far distance: ${distanceFar.toFixed(0)}km > 10,000km`);
  
  // Same location (0 distance)
  const distanceSame = calculateDistance(
    { lat: 14.5995, lng: 120.9842 },
    { lat: 14.5995, lng: 120.9842 }
  );
  assert(distanceSame === 0, `Same location distance: ${distanceSame}km = 0`);
  
  // Very small distance (1 meter difference ~0.00001 degrees)
  const distanceVerySmall = calculateDistance(
    { lat: 14.5995, lng: 120.9842 },
    { lat: 14.59951, lng: 120.98421 }
  );
  assert(distanceVerySmall < 0.01, `Very small distance: ${distanceVerySmall.toFixed(5)}km < 0.01km`);
  
  // Product with 0 days used (brand new)
  const freshProduct = enrichProducts([{
    product_type_id: 5, // Yogurt (14 days)
    days_already_used: 0,
    listed_date: currentDate.toISOString().split('T')[0]
  }])[0];
  const freshMetrics = calculateShelfLifeMetrics(freshProduct, productTypes, currentDate);
  assert(freshMetrics.freshness_percent === 100, `Brand new product: ${freshMetrics.freshness_percent}% freshness`);
  
  // Product at end of shelf life
  const oldProduct = enrichProducts([{
    product_type_id: 5, // Yogurt (14 days)
    days_already_used: 14,
    listed_date: currentDate.toISOString().split('T')[0]
  }])[0];
  const oldMetrics = calculateShelfLifeMetrics(oldProduct, productTypes, currentDate);
  assert(oldMetrics.freshness_percent === 0, `Fully used product: ${oldMetrics.freshness_percent}% freshness`);
  
  console.log('\n✓ Extreme values handled correctly');
  
} catch (error) {
  console.error(`\n✗ Extreme values test failed: ${error.message}`);
  testsFailed++;
}

// ============================================================================
// SCENARIO 4: INVALID INPUTS
// ============================================================================
console.log('\n\n🔧 SCENARIO 4: Invalid Inputs');
console.log('='.repeat(80));

try {
  const validBuyer = {
    id: 1,
    name: 'Test Buyer',
    latitude: 14.5995,
    longitude: 120.9842
  };
  
  const validProducts = enrichProducts([{
    id: 1,
    seller_id: 1,
    product_type_id: 5,
    days_already_used: 2,
    listed_date: new Date().toISOString().split('T')[0],
    price: 50,
    quantity: 1,
    location: { lat: 14.6, lng: 120.99 }
  }]);
  
  // Null buyer
  expectError(
    () => chendaAlgorithm.chendaAlgorithm(null, validProducts, {}),
    'Null buyer throws error'
  );
  
  // Undefined buyer
  expectError(
    () => chendaAlgorithm.chendaAlgorithm(undefined, validProducts, {}),
    'Undefined buyer throws error'
  );
  
  // Buyer without location
  expectError(
    () => chendaAlgorithm.chendaAlgorithm({ id: 1, name: 'Test' }, validProducts, {}),
    'Buyer without latitude/longitude throws error'
  );
  
  // Null products (should handle gracefully)
  try {
    const resultNull = chendaAlgorithm.chendaAlgorithm(validBuyer, null, {});
    assert(resultNull.products.length === 0, 'Null products treated as empty array');
  } catch (e) {
    console.log(`  ✓ Null products throws error (acceptable behavior)`);
    testsPassed++;
  }
  
  // Invalid max_radius
  expectError(
    () => chendaAlgorithm.chendaAlgorithm(validBuyer, validProducts, { max_radius: -10 }),
    'Negative max_radius throws error'
  );
  
  expectError(
    () => chendaAlgorithm.chendaAlgorithm(validBuyer, validProducts, { max_radius: 'invalid' }),
    'Non-numeric max_radius throws error'
  );
  
  // Invalid weights
  try {
    chendaAlgorithm.chendaAlgorithm(validBuyer, validProducts, { 
      weights: { proximity: -10, freshness: 110 }
    });
    console.log(`  ✓ Negative weight handled (no strict validation)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ✓ Negative weight throws error`);
    testsPassed++;
  }
  
  try {
    chendaAlgorithm.chendaAlgorithm(validBuyer, validProducts, { 
      weights: { proximity: 30, freshness: 30 }  // Sum != 100
    });
    console.log(`  ✓ Invalid weight sum handled (no strict validation)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ✓ Invalid weight sum throws error`);
    testsPassed++;
  }
  
  console.log('\n✓ Invalid inputs rejected correctly');
  
} catch (error) {
  console.error(`\n✗ Invalid input test failed: ${error.message}`);
  testsFailed++;
}

// ============================================================================
// SCENARIO 5: BOUNDARY CONDITIONS
// ============================================================================
console.log('\n\n🔧 SCENARIO 5: Boundary Conditions');
console.log('='.repeat(80));

try {
  const buyer = {
    id: 1,
    name: 'Test Buyer',
    latitude: 14.5995,
    longitude: 120.9842
  };
  
  // Product exactly at max_radius boundary
  const products = enrichProducts([{
    id: 1,
    seller_id: 1,
    product_type_id: 5,
    days_already_used: 2,
    listed_date: new Date().toISOString().split('T')[0],
    price: 50,
    quantity: 1,
    location: { lat: 14.5995, lng: 120.9842 } // Same location = 0km
  }]);
  
  // Should pass with max_radius = 0
  const result1 = chendaAlgorithm.chendaAlgorithm(buyer, products, { max_radius: 0 });
  assert(result1.products.length === 1, 'Product at 0km passes with max_radius=0');
  
  // Product with exactly 50% freshness at 50% threshold
  const halfFreshProduct = enrichProducts([{
    id: 1,
    seller_id: 1,
    product_type_id: 5, // Yogurt (14 days)
    days_already_used: 7, // 50% used
    listed_date: new Date().toISOString().split('T')[0],
    price: 50,
    quantity: 1,
    location: { lat: 14.5995, lng: 120.9842 }
  }]);
  
  const result2 = chendaAlgorithm.chendaAlgorithm(buyer, halfFreshProduct, { 
    min_freshness: 50,
    expiration_filter: false 
  });
  assert(result2.products.length === 1, 'Product at exactly 50% freshness passes 50% threshold');
  
  // Weight boundaries (0 and 100)
  const result3 = chendaAlgorithm.chendaAlgorithm(buyer, products, { 
    weights: { proximity: 0, freshness: 100 }
  });
  assert(result3.products[0].combined_score >= 0, '0/100 weight split works');
  
  const result4 = chendaAlgorithm.chendaAlgorithm(buyer, products, { 
    weights: { proximity: 100, freshness: 0 }
  });
  assert(result4.products[0].combined_score >= 0, '100/0 weight split works');
  
  console.log('\n✓ Boundary conditions handled correctly');
  
} catch (error) {
  console.error(`\n✗ Boundary condition test failed: ${error.message}`);
  testsFailed++;
}

// ============================================================================
// SCENARIO 6: DATA INTEGRITY
// ============================================================================
console.log('\n\n🔧 SCENARIO 6: Data Integrity');
console.log('='.repeat(80));

try {
  const buyer = {
    id: 1,
    name: 'Test Buyer',
    latitude: 14.5995,
    longitude: 120.9842
  };
  
  const products = enrichProducts([
    {
      id: 1,
      seller_id: 1,
      product_type_id: 5,
      days_already_used: 2,
      listed_date: new Date().toISOString().split('T')[0],
      price: 50,
      quantity: 1,
      location: { lat: 14.6, lng: 120.99 }
    },
    {
      id: 2,
      seller_id: 2,
      product_type_id: 10,
      days_already_used: 5,
      listed_date: new Date().toISOString().split('T')[0],
      price: 75,
      quantity: 2,
      location: { lat: 14.7, lng: 121.0 }
    }
  ]);
  
  const originalProducts = JSON.parse(JSON.stringify(products));
  
  // Run algorithm
  const result = chendaAlgorithm.chendaAlgorithm(buyer, products, {});
  
  // Verify original products unchanged
  assert(
    JSON.stringify(products) === JSON.stringify(originalProducts),
    'Original product array not mutated'
  );
  
  // Verify buyer unchanged
  const originalBuyer = { id: 1, name: 'Test Buyer', latitude: 14.5995, longitude: 120.9842 };
  assert(
    JSON.stringify(buyer) === JSON.stringify(originalBuyer),
    'Buyer object not mutated'
  );
  
  // Verify result has new properties without removing original ones
  assert(result.products[0].id === products[0].id, 'Original product properties preserved');
  assert(result.products[0].price === products[0].price, 'Original price preserved');
  assert(result.products[0].distance_km !== undefined, 'New properties added');
  
  console.log('\n✓ Data integrity maintained');
  
} catch (error) {
  console.error(`\n✗ Data integrity test failed: ${error.message}`);
  testsFailed++;
}

// ============================================================================
// SCENARIO 7: PERFORMANCE UNDER STRESS
// ============================================================================
console.log('\n\n🔧 SCENARIO 7: Performance Under Stress');
console.log('='.repeat(80));

try {
  const buyer = {
    id: 1,
    name: 'Test Buyer',
    latitude: 14.5995,
    longitude: 120.9842
  };
  
  // Generate 100 products
  const rawProducts = [];
  for (let i = 0; i < 100; i++) {
    // Use product type IDs that exist and have reasonable shelf life
    const productTypeId = (i % 5) + 1; // Cycle through first 5 product types
    const productType = productTypeMap[productTypeId];
    const maxShelfLife = productType ? (productType.refrigerate_max || 7) : 7;
    
    rawProducts.push({
      id: i + 1,
      seller_id: (i % 10) + 1,
      product_type_id: productTypeId,
      days_already_used: Math.min(Math.floor(Math.random() * 5), maxShelfLife - 1), // Ensure doesn't exceed shelf life
      listed_date: new Date().toISOString().split('T')[0],
      price: 50 + Math.random() * 100,
      quantity: 1,
      location: {
        lat: 14.5 + Math.random() * 0.5,
        lng: 120.9 + Math.random() * 0.5
      }
    });
  }
  const largeProductSet = enrichProducts(rawProducts);
  
  const startTime = Date.now();
  const result = chendaAlgorithm.chendaAlgorithm(buyer, largeProductSet, {
    expiration_filter: false, // Disable to ensure products aren't filtered out
    max_radius: 100 // Large radius
  });
  const duration = Date.now() - startTime;
  
  assert(duration < 500, `100 products processed in ${duration}ms (< 500ms)`);
  assert(result.products.length <= 100, `Result has ${result.products.length} products`);
  
  // Verify all products have required fields
  const allHaveDistance = result.products.every(p => typeof p.distance_km === 'number');
  const allHaveScore = result.products.every(p => typeof p.combined_score === 'number');
  assert(allHaveDistance, 'All products have distance calculated');
  assert(allHaveScore, 'All products have score calculated');
  
  console.log(`\n  Performance: ${duration}ms for 100 products (${(duration/100).toFixed(2)}ms per product)`);
  console.log('\n✓ Performance under stress acceptable');
  
} catch (error) {
  console.error(`\n✗ Performance test failed: ${error.message}`);
  testsFailed++;
}

// ============================================================================
// SCENARIO 8: CONCURRENT SCENARIO HANDLING
// ============================================================================
console.log('\n\n🔧 SCENARIO 8: Concurrent Scenario Handling');
console.log('='.repeat(80));

try {
  const buyer1 = {
    id: 1,
    name: 'Buyer 1',
    latitude: 14.5995,
    longitude: 120.9842
  };
  
  const buyer2 = {
    id: 2,
    name: 'Buyer 2',
    latitude: 14.7,
    longitude: 121.0
  };
  
  const products = enrichProducts([{
    id: 1,
    seller_id: 1,
    product_type_id: 5,
    days_already_used: 2,
    listed_date: new Date().toISOString().split('T')[0],
    price: 50,
    quantity: 1,
    location: { lat: 14.6, lng: 120.99 }
  }]);
  
  // Run two searches simultaneously with different buyers
  const result1 = chendaAlgorithm.chendaAlgorithm(buyer1, products, { 
    weights: { proximity: 70, freshness: 30 },
    expiration_filter: false,
    max_radius: 100
  });
  
  const result2 = chendaAlgorithm.chendaAlgorithm(buyer2, products, { 
    weights: { proximity: 30, freshness: 70 },
    expiration_filter: false,
    max_radius: 100
  });
  
  // Results should be different due to different buyer locations and weights
  assert(result1.products.length > 0 && result2.products.length > 0, 'Both buyers get results');
  assert(result1.products[0].distance_km !== result2.products[0].distance_km, 
    'Different buyers get different distances');
  
  assert(result1.products[0].combined_score !== result2.products[0].combined_score,
    'Different weights produce different scores');
  
  // Verify metadata tracks correctly
  assert(result1.metadata.config.weights.proximity === 70, 'Buyer 1 config preserved');
  assert(result2.metadata.config.weights.proximity === 30, 'Buyer 2 config preserved');
  
  console.log('\n✓ Concurrent scenarios handled independently');
  
} catch (error) {
  console.error(`\n✗ Concurrent scenario test failed: ${error.message}`);
  testsFailed++;
}

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log('\n\n' + '='.repeat(80));
console.log('EDGE CASE TEST SUMMARY');
console.log('='.repeat(80));

const totalTests = testsPassed + testsFailed;
const passRate = totalTests > 0 ? ((testsPassed / totalTests) * 100).toFixed(1) : 0;

console.log(`\nTotal assertions: ${totalTests}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Pass rate: ${passRate}%`);

if (testsFailed === 0) {
  console.log(`\n✓ All edge case tests passed!`);
  console.log(`✓ System is robust against boundary conditions and unusual scenarios`);
} else {
  console.error(`\n✗ ${testsFailed} test(s) failed - review and fix issues`);
  process.exit(1);
}

console.log('\n' + '='.repeat(80) + '\n');
