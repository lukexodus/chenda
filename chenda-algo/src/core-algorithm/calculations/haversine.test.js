/**
 * Chenda - Haversine Calculator Integration Test
 * Demonstrates usage with mock users and products data
 */

const haversine = require('./haversine.js');
const mockData = require('../../product-display/mock_data.js');

console.log('=== Haversine Calculator Integration Test ===\n');

// ============================================================================
// TEST 1: Calculate distances from buyer to all products
// ============================================================================

console.log('TEST 1: Buyer searches for products within radius\n');

const buyer = mockData.mockUsers[0]; // Maria Santos (Quezon City)
console.log(`Buyer: ${buyer.name}`);
console.log(`Location: ${buyer.location.address}`);
console.log(`Coordinates: (${buyer.location.lat}, ${buyer.location.lng})`);
console.log(`Max radius: ${buyer.preferences.max_radius_km} km\n`);

// Calculate distances to all products
const productsWithDistance = mockData.mockProducts.map(product => {
  const distance = haversine.calculateDistance(
    buyer.location,
    product.location,
    'km'
  );
  
  return {
    id: product.id,
    seller_id: product.seller_id,
    product_type_id: product.product_type_id,
    description: product.description,
    price: product.price,
    location: product.location.address,
    distance_km: haversine.calculateDistanceRounded(buyer.location, product.location, 'km', 2),
    within_radius: distance <= buyer.preferences.max_radius_km
  };
});

// Filter products within radius
const productsInRange = productsWithDistance.filter(p => p.within_radius);

console.log(`Products within ${buyer.preferences.max_radius_km}km radius:`);
console.log(`Total products: ${mockData.mockProducts.length}`);
console.log(`Products in range: ${productsInRange.length}`);
console.log(`Products out of range: ${productsWithDistance.length - productsInRange.length}\n`);

// Show top 5 closest products
console.log('Top 5 closest products:');
productsInRange
  .sort((a, b) => a.distance_km - b.distance_km)
  .slice(0, 5)
  .forEach((p, i) => {
    console.log(`${i + 1}. Product #${p.id} - ${p.description}`);
    console.log(`   Location: ${p.location}`);
    console.log(`   Distance: ${p.distance_km} km`);
    console.log(`   Price: ₱${p.price}\n`);
  });

// ============================================================================
// TEST 2: Compare distances for different buyers
// ============================================================================

console.log('\nTEST 2: Same product, different buyer locations\n');

const targetProduct = mockData.mockProducts[0]; // First product
console.log(`Target Product: #${targetProduct.id} - ${targetProduct.description}`);
console.log(`Product Location: ${targetProduct.location.address}\n`);

const buyers = mockData.mockUsers.filter(u => u.type === 'buyer' || u.type === 'both');
console.log('Distance from each buyer:');

buyers.forEach(buyer => {
  const distance = haversine.calculateDistanceRounded(
    buyer.location,
    targetProduct.location,
    'km',
    2
  );
  
  const withinRange = distance <= buyer.preferences.max_radius_km;
  const symbol = withinRange ? '✓' : '✗';
  
  console.log(`${symbol} ${buyer.name.padEnd(25)} (${buyer.location.address.padEnd(25)}): ${distance.toFixed(2)} km`);
});

// ============================================================================
// TEST 3: Seller coverage analysis
// ============================================================================

console.log('\n\nTEST 3: Seller coverage analysis\n');

const sellers = mockData.mockUsers.filter(u => u.type === 'seller' || u.type === 'both');

sellers.forEach(seller => {
  const sellerProducts = mockData.mockProducts.filter(p => p.seller_id === seller.id);
  
  if (sellerProducts.length === 0) return;
  
  console.log(`\nSeller: ${seller.name} (${seller.location.address})`);
  console.log(`Products listed: ${sellerProducts.length}`);
  
  // Calculate potential reach for each buyer
  const potentialBuyers = buyers.map(buyer => {
    const distance = haversine.calculateDistanceRounded(
      seller.location,
      buyer.location,
      'km',
      2
    );
    
    const withinBuyerRadius = distance <= buyer.preferences.max_radius_km;
    const withinSellerRadius = distance <= 50; // Default seller radius
    
    return {
      buyer: buyer.name,
      distance: distance,
      canReach: withinBuyerRadius && withinSellerRadius
    };
  });
  
  const reachableCount = potentialBuyers.filter(pb => pb.canReach).length;
  console.log(`Potential buyers in range: ${reachableCount}/${buyers.length}`);
  
  potentialBuyers
    .sort((a, b) => a.distance - b.distance)
    .forEach(pb => {
      const symbol = pb.canReach ? '✓' : '✗';
      console.log(`  ${symbol} ${pb.buyer.padEnd(20)}: ${pb.distance.toFixed(2)} km`);
    });
});

// ============================================================================
// TEST 4: Distance distribution analysis
// ============================================================================

console.log('\n\nTEST 4: Distance distribution analysis\n');

const allDistances = [];
mockData.mockProducts.forEach(product => {
  buyers.forEach(buyer => {
    const distance = haversine.calculateDistance(buyer.location, product.location, 'km');
    allDistances.push(distance);
  });
});

const avgDistance = allDistances.reduce((a, b) => a + b, 0) / allDistances.length;
const minDistance = Math.min(...allDistances);
const maxDistance = Math.max(...allDistances);

console.log('Distance Statistics (all buyer-product pairs):');
console.log(`Total pairs: ${allDistances.length}`);
console.log(`Average distance: ${avgDistance.toFixed(2)} km`);
console.log(`Minimum distance: ${minDistance.toFixed(2)} km`);
console.log(`Maximum distance: ${maxDistance.toFixed(2)} km`);

// Distance ranges
const ranges = [
  { min: 0, max: 5, label: '0-5 km' },
  { min: 5, max: 10, label: '5-10 km' },
  { min: 10, max: 15, label: '10-15 km' },
  { min: 15, max: 20, label: '15-20 km' },
  { min: 20, max: 50, label: '20-50 km' }
];

console.log('\nDistance distribution:');
ranges.forEach(range => {
  const count = allDistances.filter(d => d >= range.min && d < range.max).length;
  const percentage = ((count / allDistances.length) * 100).toFixed(1);
  const bar = '█'.repeat(Math.round(percentage / 2));
  console.log(`${range.label.padEnd(12)}: ${bar} ${percentage}% (${count})`);
});

// ============================================================================
// TEST 5: Batch calculation performance
// ============================================================================

console.log('\n\nTEST 5: Batch calculation performance\n');

const startTime = Date.now();

const batchResults = mockData.mockUsers
  .filter(u => u.type === 'buyer' || u.type === 'both')
  .map(buyer => {
    const productLocations = mockData.mockProducts.map(p => p.location);
    const distances = haversine.calculateDistanceBatch(buyer.location, productLocations, 'km');
    return {
      buyer: buyer.name,
      avgDistance: distances.reduce((a, b) => a + b, 0) / distances.length,
      minDistance: Math.min(...distances),
      maxDistance: Math.max(...distances)
    };
  });

const endTime = Date.now();

console.log('Batch calculation results:');
console.log(`Calculated ${mockData.mockUsers.length} x ${mockData.mockProducts.length} = ${mockData.mockUsers.length * mockData.mockProducts.length} distances`);
console.log(`Time taken: ${endTime - startTime}ms\n`);

batchResults.forEach(result => {
  console.log(`${result.buyer}:`);
  console.log(`  Avg: ${result.avgDistance.toFixed(2)} km, Min: ${result.minDistance.toFixed(2)} km, Max: ${result.maxDistance.toFixed(2)} km`);
});

// ============================================================================
// TEST 6: Real-world scenario simulation
// ============================================================================

console.log('\n\nTEST 6: Real-world scenario - Buyer searches for products\n');

const simulatedBuyer = mockData.mockUsers[1]; // Carlos Reyes (Makati)
console.log(`Scenario: ${simulatedBuyer.name} searching from ${simulatedBuyer.location.address}`);
console.log(`Preferences: Max radius ${simulatedBuyer.preferences.max_radius_km}km, Min freshness ${simulatedBuyer.preferences.min_freshness_percent}%\n`);

// Step 1: Calculate distances
const results = mockData.mockProducts.map(product => {
  const distance = haversine.calculateDistance(
    simulatedBuyer.location,
    product.location,
    'km'
  );
  
  return {
    ...product,
    distance_km: distance
  };
});

// Step 2: Filter by radius
const filtered = results.filter(p => p.distance_km <= simulatedBuyer.preferences.max_radius_km);

console.log(`Step 1 - Distance calculation: ${results.length} products`);
console.log(`Step 2 - Filter by radius (${simulatedBuyer.preferences.max_radius_km}km): ${filtered.length} products remaining`);

// Step 3: Sort by distance
const sorted = filtered.sort((a, b) => a.distance_km - b.distance_km);

console.log('\nTop 10 products by proximity:');
sorted.slice(0, 10).forEach((p, i) => {
  console.log(`${(i + 1).toString().padStart(2)}. Product #${p.id.toString().padStart(2)} - ${p.distance_km.toFixed(2)}km - ₱${p.price} - ${p.description}`);
});

console.log('\n=== Integration Test Complete ===');
