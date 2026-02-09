/**
 * Chenda - Mock Data Generator
 * Task 1.7: Create realistic mock data sets
 * 
 * Data Sources:
 * - Users: 10 users (5 buyers, 3 sellers, 2 both) in Metro Manila area
 * - Products: 30 product listings using real USDA perishables data
 * - Product Types: From product_types_perishables.json (180 real items)
 */

const perishables = require('../product-management/product-types.json');

// ============================================================================
// MOCK USERS (10 total: 5 buyers, 3 sellers, 2 both)
// ============================================================================

/**
 * Metro Manila locations spread across different cities
 * Coordinates are real locations to enable accurate distance testing
 */
const mockUsers = [
  // BUYERS (5)
  {
    id: 1,
    name: "Maria Santos",
    email: "maria.santos@email.com",
    type: "buyer",
    location: {
      lat: 14.5995, // Quezon City
      lng: 120.9842,
      address: "Quezon City, Metro Manila"
    },
    preferences: {
      proximity_weight: 60,
      shelf_life_weight: 40,
      max_radius_km: 30,
      min_freshness_percent: 50,
      display_mode: "ranking"
    },
    created_at: "2025-01-15T08:30:00Z"
  },
  {
    id: 2,
    name: "Carlos Reyes",
    email: "carlos.reyes@email.com",
    type: "buyer",
    location: {
      lat: 14.5547, // Makati
      lng: 121.0244,
      address: "Makati City, Metro Manila"
    },
    preferences: {
      proximity_weight: 70,
      shelf_life_weight: 30,
      max_radius_km: 20,
      min_freshness_percent: 60,
      display_mode: "ranking"
    },
    created_at: "2025-01-18T10:15:00Z"
  },
  {
    id: 3,
    name: "Ana Garcia",
    email: "ana.garcia@email.com",
    type: "buyer",
    location: {
      lat: 14.5794, // Mandaluyong
      lng: 121.0359,
      address: "Mandaluyong City, Metro Manila"
    },
    preferences: {
      proximity_weight: 40,
      shelf_life_weight: 60,
      max_radius_km: 50,
      min_freshness_percent: 70,
      display_mode: "filter_sort"
    },
    created_at: "2025-01-20T14:00:00Z"
  },
  {
    id: 4,
    name: "Roberto Cruz",
    email: "roberto.cruz@email.com",
    type: "buyer",
    location: {
      lat: 14.6760, // Caloocan
      lng: 120.9626,
      address: "Caloocan City, Metro Manila"
    },
    preferences: {
      proximity_weight: 50,
      shelf_life_weight: 50,
      max_radius_km: 40,
      min_freshness_percent: null,
      display_mode: "ranking"
    },
    created_at: "2025-01-22T09:00:00Z"
  },
  {
    id: 5,
    name: "Sofia Mendoza",
    email: "sofia.mendoza@email.com",
    type: "buyer",
    location: {
      lat: 14.4090, // Parañaque
      lng: 121.0185,
      address: "Parañaque City, Metro Manila"
    },
    preferences: {
      proximity_weight: 80,
      shelf_life_weight: 20,
      max_radius_km: 15,
      min_freshness_percent: 40,
      display_mode: "ranking"
    },
    created_at: "2025-01-25T11:30:00Z"
  },
  
  // SELLERS (3)
  {
    id: 6,
    name: "Juan's Fresh Market",
    email: "juan.market@email.com",
    type: "seller",
    location: {
      lat: 14.6091, // Pasig
      lng: 121.0223,
      address: "Pasig City, Metro Manila"
    },
    preferences: {
      proximity_weight: 50,
      shelf_life_weight: 50,
      max_radius_km: 50,
      min_freshness_percent: null,
      display_mode: "ranking"
    },
    created_at: "2025-01-10T10:00:00Z"
  },
  {
    id: 7,
    name: "Tindahan ni Aling Nena",
    email: "nena.store@email.com",
    type: "seller",
    location: {
      lat: 14.5378, // Taguig
      lng: 121.0506,
      address: "Taguig City, Metro Manila"
    },
    preferences: {
      proximity_weight: 50,
      shelf_life_weight: 50,
      max_radius_km: 50,
      min_freshness_percent: null,
      display_mode: "ranking"
    },
    created_at: "2025-01-12T08:00:00Z"
  },
  {
    id: 8,
    name: "Manila Bay Groceries",
    email: "manilabaygroceries@email.com",
    type: "seller",
    location: {
      lat: 14.5833, // Manila
      lng: 120.9794,
      address: "Manila City, Metro Manila"
    },
    preferences: {
      proximity_weight: 50,
      shelf_life_weight: 50,
      max_radius_km: 50,
      min_freshness_percent: null,
      display_mode: "ranking"
    },
    created_at: "2025-01-08T07:00:00Z"
  },
  
  // BOTH (2)
  {
    id: 9,
    name: "Linda's Dairy Corner",
    email: "linda.dairy@email.com",
    type: "both",
    location: {
      lat: 14.6507, // Valenzuela
      lng: 120.9721,
      address: "Valenzuela City, Metro Manila"
    },
    preferences: {
      proximity_weight: 55,
      shelf_life_weight: 45,
      max_radius_km: 35,
      min_freshness_percent: 50,
      display_mode: "ranking"
    },
    created_at: "2025-01-14T09:30:00Z"
  },
  {
    id: 10,
    name: "Pedro's Produce Hub",
    email: "pedro.produce@email.com",
    type: "both",
    location: {
      lat: 14.5243, // Las Piñas
      lng: 120.9832,
      address: "Las Piñas City, Metro Manila"
    },
    preferences: {
      proximity_weight: 45,
      shelf_life_weight: 55,
      max_radius_km: 45,
      min_freshness_percent: 60,
      display_mode: "filter_sort"
    },
    created_at: "2025-01-16T13:00:00Z"
  }
];

// ============================================================================
// MOCK PRODUCTS (30 total using real USDA data)
// ============================================================================

/**
 * Product listings with varying:
 * - Freshness levels (days_already_used)
 * - Prices
 * - Quantities
 * - Locations (from seller locations)
 * - Real shelf life data from USDA
 */
const mockProducts = [
  // Seller 6 - Juan's Fresh Market (Pasig) - 10 products
  {
    id: 1,
    seller_id: 6,
    product_type_id: 33, // Yogurt - 11 days
    days_already_used: 1,
    listed_date: "2025-01-29T06:00:00Z",
    price: 85.00,
    quantity: 3,
    unit: "containers",
    location: { lat: 14.6091, lng: 121.0223, address: "Pasig City" },
    storage_condition: "refrigerated_opened",
    description: "Fresh yogurt, opened yesterday",
    status: "active"
  },
  {
    id: 2,
    seller_id: 6,
    product_type_id: 21, // Eggs, in shell - 28 days
    days_already_used: 5,
    listed_date: "2025-01-28T07:00:00Z",
    price: 180.00,
    quantity: 2,
    unit: "dozen",
    location: { lat: 14.6091, lng: 121.0223, address: "Pasig City" },
    storage_condition: "refrigerated_opened",
    description: "Farm fresh eggs",
    status: "active"
  },
  {
    id: 3,
    seller_id: 6,
    product_type_id: 2, // Buttermilk - 11 days
    days_already_used: 2,
    listed_date: "2025-01-28T08:00:00Z",
    price: 95.00,
    quantity: 2,
    unit: "liters",
    location: { lat: 14.6091, lng: 121.0223, address: "Pasig City" },
    storage_condition: "refrigerated_opened",
    description: "Cultured buttermilk",
    status: "active"
  },
  {
    id: 4,
    seller_id: 6,
    product_type_id: 9, // Cottage cheese - 14 days
    days_already_used: 3,
    listed_date: "2025-01-27T09:00:00Z",
    price: 150.00,
    quantity: 4,
    unit: "containers",
    location: { lat: 14.6091, lng: 121.0223, address: "Pasig City" },
    storage_condition: "refrigerated_opened",
    description: "Low-fat cottage cheese",
    status: "active"
  },
  {
    id: 5,
    seller_id: 6,
    product_type_id: 24, // Eggnog - 4 days
    days_already_used: 1,
    listed_date: "2025-01-29T10:00:00Z",
    price: 120.00,
    quantity: 2,
    unit: "bottles",
    location: { lat: 14.6091, lng: 121.0223, address: "Pasig City" },
    storage_condition: "refrigerated_opened",
    description: "Holiday eggnog",
    status: "active"
  },
  {
    id: 6,
    seller_id: 6,
    product_type_id: 10, // Cream cheese - 14 days
    days_already_used: 7,
    listed_date: "2025-01-26T11:00:00Z",
    price: 130.00,
    quantity: 5,
    unit: "blocks",
    location: { lat: 14.6091, lng: 121.0223, address: "Pasig City" },
    storage_condition: "refrigerated_opened",
    description: "Philadelphia-style cream cheese",
    status: "active"
  },
  {
    id: 7,
    seller_id: 6,
    product_type_id: 25, // Kefir (fermented milk) - 7 days
    days_already_used: 0,
    listed_date: "2025-01-30T06:00:00Z",
    price: 80.00,
    quantity: 4,
    unit: "bottles",
    location: { lat: 14.6091, lng: 121.0223, address: "Pasig City" },
    storage_condition: "refrigerated_opened",
    description: "Just opened today - kefir fermented milk",
    status: "active"
  },
  {
    id: 8,
    seller_id: 6,
    product_type_id: 5, // Cheese, hard (cheddar) - 30 days
    days_already_used: 10,
    listed_date: "2025-01-25T12:00:00Z",
    price: 250.00,
    quantity: 2,
    unit: "kg",
    location: { lat: 14.6091, lng: 121.0223, address: "Pasig City" },
    storage_condition: "refrigerated_opened",
    description: "Sharp cheddar cheese",
    status: "active"
  },
  {
    id: 9,
    seller_id: 6,
    product_type_id: 8, // Coffee creamer - 21 days
    days_already_used: 5,
    listed_date: "2025-01-27T13:00:00Z",
    price: 110.00,
    quantity: 3,
    unit: "bottles",
    location: { lat: 14.6091, lng: 121.0223, address: "Pasig City" },
    storage_condition: "refrigerated_opened",
    description: "Vanilla coffee creamer",
    status: "active"
  },
  {
    id: 10,
    seller_id: 6,
    product_type_id: 16, // Dips (sour cream based) - 14 days
    days_already_used: 8,
    listed_date: "2025-01-26T14:00:00Z",
    price: 140.00,
    quantity: 3,
    unit: "containers",
    location: { lat: 14.6091, lng: 121.0223, address: "Pasig City" },
    storage_condition: "refrigerated_opened",
    description: "Sour cream dip",
    status: "active"
  },
  
  // Seller 7 - Tindahan ni Aling Nena (Taguig) - 10 products
  {
    id: 11,
    seller_id: 7,
    product_type_id: 33, // Yogurt - 11 days
    days_already_used: 2,
    listed_date: "2025-01-28T06:00:00Z",
    price: 90.00,
    quantity: 2,
    unit: "containers",
    location: { lat: 14.5378, lng: 121.0506, address: "Taguig City" },
    storage_condition: "refrigerated_opened",
    description: "Yogurt - opened 2 days ago",
    status: "active"
  },
  {
    id: 12,
    seller_id: 7,
    product_type_id: 21, // Eggs, in shell - 28 days
    days_already_used: 10,
    listed_date: "2025-01-25T07:00:00Z",
    price: 170.00,
    quantity: 3,
    unit: "dozen",
    location: { lat: 14.5378, lng: 121.0506, address: "Taguig City" },
    storage_condition: "refrigerated_opened",
    description: "Free-range eggs",
    status: "active"
  },
  {
    id: 13,
    seller_id: 7,
    product_type_id: 6, // Cheese, soft (brie) - 25 days
    days_already_used: 5,
    listed_date: "2025-01-27T08:00:00Z",
    price: 300.00,
    quantity: 1,
    unit: "wheel",
    location: { lat: 14.5378, lng: 121.0506, address: "Taguig City" },
    storage_condition: "refrigerated_opened",
    description: "French brie cheese",
    status: "active"
  },
  {
    id: 14,
    seller_id: 7,
    product_type_id: 7, // Cheese, shredded - 11 days
    days_already_used: 3,
    listed_date: "2025-01-28T09:00:00Z",
    price: 160.00,
    quantity: 4,
    unit: "bags",
    location: { lat: 14.5378, lng: 121.0506, address: "Taguig City" },
    storage_condition: "refrigerated_opened",
    description: "Shredded mozzarella",
    status: "active"
  },
  {
    id: 15,
    seller_id: 7,
    product_type_id: 11, // Cream, half and half - 30 days
    days_already_used: 12,
    listed_date: "2025-01-24T10:00:00Z",
    price: 100.00,
    quantity: 2,
    unit: "bottles",
    location: { lat: 14.5378, lng: 121.0506, address: "Taguig City" },
    storage_condition: "refrigerated_opened",
    description: "Half and half cream",
    status: "active"
  },
  {
    id: 16,
    seller_id: 7,
    product_type_id: 13, // Cream, heavy/whipping - 4 days
    days_already_used: 1,
    listed_date: "2025-01-29T11:00:00Z",
    price: 180.00,
    quantity: 2,
    unit: "bottles",
    location: { lat: 14.5378, lng: 121.0506, address: "Taguig City" },
    storage_condition: "refrigerated_opened",
    description: "Heavy whipping cream",
    status: "active"
  },
  {
    id: 17,
    seller_id: 7,
    product_type_id: 16, // Ricotta cheese - 14 days
    days_already_used: 4,
    listed_date: "2025-01-28T12:00:00Z",
    price: 190.00,
    quantity: 3,
    unit: "containers",
    location: { lat: 14.5378, lng: 121.0506, address: "Taguig City" },
    storage_condition: "refrigerated_opened",
    description: "Fresh ricotta cheese",
    status: "active"
  },
  {
    id: 18,
    seller_id: 7,
    product_type_id: 25, // Kefir - 7 days
    days_already_used: 3,
    listed_date: "2025-01-27T13:00:00Z",
    price: 85.00,
    quantity: 1,
    unit: "bottle",
    location: { lat: 14.5378, lng: 121.0506, address: "Taguig City" },
    storage_condition: "refrigerated_opened",
    description: "Kefir - 3 days old",
    status: "active"
  },
  {
    id: 19,
    seller_id: 7,
    product_type_id: 9, // Cottage cheese - 14 days
    days_already_used: 6,
    listed_date: "2025-01-27T14:00:00Z",
    price: 145.00,
    quantity: 2,
    unit: "containers",
    location: { lat: 14.5378, lng: 121.0506, address: "Taguig City" },
    storage_condition: "refrigerated_opened",
    description: "Cottage cheese - full fat",
    status: "active"
  },
  {
    id: 20,
    seller_id: 7,
    product_type_id: 2, // Buttermilk - 11 days
    days_already_used: 4,
    listed_date: "2025-01-27T15:00:00Z",
    price: 100.00,
    quantity: 2,
    unit: "liters",
    location: { lat: 14.5378, lng: 121.0506, address: "Taguig City" },
    storage_condition: "refrigerated_opened",
    description: "Fresh buttermilk",
    status: "active"
  },
  
  // Seller 8 - Manila Bay Groceries (Manila) - 5 products
  {
    id: 21,
    seller_id: 8,
    product_type_id: 33, // Yogurt - 11 days
    days_already_used: 0,
    listed_date: "2025-01-30T05:00:00Z",
    price: 88.00,
    quantity: 5,
    unit: "containers",
    location: { lat: 14.5833, lng: 120.9794, address: "Manila City" },
    storage_condition: "refrigerated_opened",
    description: "Just opened - fresh yogurt",
    status: "active"
  },
  {
    id: 22,
    seller_id: 8,
    product_type_id: 21, // Eggs, in shell - 28 days
    days_already_used: 7,
    listed_date: "2025-01-26T06:00:00Z",
    price: 175.00,
    quantity: 4,
    unit: "dozen",
    location: { lat: 14.5833, lng: 120.9794, address: "Manila City" },
    storage_condition: "refrigerated_opened",
    description: "Large eggs",
    status: "active"
  },
  {
    id: 23,
    seller_id: 8,
    product_type_id: 5, // Cheese, hard (cheddar) - 30 days
    days_already_used: 15,
    listed_date: "2025-01-22T07:00:00Z",
    price: 240.00,
    quantity: 1,
    unit: "kg",
    location: { lat: 14.5833, lng: 120.9794, address: "Manila City" },
    storage_condition: "refrigerated_opened",
    description: "Aged cheddar",
    status: "active"
  },
  {
    id: 24,
    seller_id: 8,
    product_type_id: 10, // Cream cheese - 14 days
    days_already_used: 2,
    listed_date: "2025-01-29T08:00:00Z",
    price: 135.00,
    quantity: 6,
    unit: "blocks",
    location: { lat: 14.5833, lng: 120.9794, address: "Manila City" },
    storage_condition: "refrigerated_opened",
    description: "Original cream cheese",
    status: "active"
  },
  {
    id: 25,
    seller_id: 8,
    product_type_id: 8, // Coffee creamer - 21 days
    days_already_used: 10,
    listed_date: "2025-01-25T09:00:00Z",
    price: 105.00,
    quantity: 2,
    unit: "bottles",
    location: { lat: 14.5833, lng: 120.9794, address: "Manila City" },
    storage_condition: "refrigerated_opened",
    description: "Hazelnut coffee creamer",
    status: "active"
  },
  
  // Seller 9 - Linda's Dairy Corner (Valenzuela) - 5 products
  {
    id: 26,
    seller_id: 9,
    product_type_id: 33, // Yogurt - 11 days
    days_already_used: 1,
    listed_date: "2025-01-29T05:00:00Z",
    price: 82.00,
    quantity: 6,
    unit: "containers",
    location: { lat: 14.6507, lng: 120.9721, address: "Valenzuela City" },
    storage_condition: "refrigerated_opened",
    description: "Farm-fresh yogurt",
    status: "active"
  },
  {
    id: 27,
    seller_id: 9,
    product_type_id: 25, // Kefir - 7 days
    days_already_used: 1,
    listed_date: "2025-01-29T05:30:00Z",
    price: 78.00,
    quantity: 4,
    unit: "bottles",
    location: { lat: 14.6507, lng: 120.9721, address: "Valenzuela City" },
    storage_condition: "refrigerated_opened",
    description: "Kefir - fermented milk drink",
    status: "active"
  },
  {
    id: 28,
    seller_id: 9,
    product_type_id: 2, // Buttermilk - 11 days
    days_already_used: 1,
    listed_date: "2025-01-29T06:00:00Z",
    price: 92.00,
    quantity: 3,
    unit: "liters",
    location: { lat: 14.6507, lng: 120.9721, address: "Valenzuela City" },
    storage_condition: "refrigerated_opened",
    description: "Fresh buttermilk",
    status: "active"
  },
  {
    id: 29,
    seller_id: 9,
    product_type_id: 9, // Cottage cheese - 14 days
    days_already_used: 2,
    listed_date: "2025-01-28T07:00:00Z",
    price: 148.00,
    quantity: 5,
    unit: "containers",
    location: { lat: 14.6507, lng: 120.9721, address: "Valenzuela City" },
    storage_condition: "refrigerated_opened",
    description: "Low-fat cottage cheese",
    status: "active"
  },
  {
    id: 30,
    seller_id: 9,
    product_type_id: 16, // Dips (sour cream based) - 14 days
    days_already_used: 3,
    listed_date: "2025-01-28T08:00:00Z",
    price: 138.00,
    quantity: 4,
    unit: "containers",
    location: { lat: 14.6507, lng: 120.9721, address: "Valenzuela City" },
    storage_condition: "refrigerated_opened",
    description: "Sour cream dip",
    status: "active"
  }
];

// ============================================================================
// SUMMARY STATISTICS
// ============================================================================

function generateMockDataSummary() {
  console.log("=== Chenda Mock Data Summary ===\n");
  
  // Users summary
  const userTypes = mockUsers.reduce((acc, user) => {
    acc[user.type] = (acc[user.type] || 0) + 1;
    return acc;
  }, {});
  
  console.log("USERS (10 total):");
  console.log(`  Buyers: ${userTypes.buyer || 0}`);
  console.log(`  Sellers: ${userTypes.seller || 0}`);
  console.log(`  Both: ${userTypes.both || 0}`);
  
  // Products summary
  const uniqueProductTypes = new Set(mockProducts.map(p => p.product_type_id)).size;
  const freshness = mockProducts.map(p => {
    const productType = perishables.find(pt => pt.id === p.product_type_id);
    const totalShelfLife = productType.default_shelf_life_days;
    const remaining = totalShelfLife - p.days_already_used;
    return (remaining / totalShelfLife) * 100;
  });
  
  const avgFreshness = freshness.reduce((a, b) => a + b, 0) / freshness.length;
  const minFreshness = Math.min(...freshness);
  const maxFreshness = Math.max(...freshness);
  
  console.log(`\nPRODUCTS (30 total):`);
  console.log(`  Unique product types: ${uniqueProductTypes}`);
  console.log(`  Average freshness: ${avgFreshness.toFixed(1)}%`);
  console.log(`  Freshness range: ${minFreshness.toFixed(1)}% - ${maxFreshness.toFixed(1)}%`);
  
  // Seller distribution
  const sellerDist = mockProducts.reduce((acc, p) => {
    acc[p.seller_id] = (acc[p.seller_id] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`\nPRODUCTS BY SELLER:`);
  Object.entries(sellerDist).forEach(([sellerId, count]) => {
    const seller = mockUsers.find(u => u.id === parseInt(sellerId));
    console.log(`  ${seller.name}: ${count} products`);
  });
  
  // Product type distribution
  const productTypeDist = mockProducts.reduce((acc, p) => {
    const productType = perishables.find(pt => pt.id === p.product_type_id);
    const name = productType.name;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`\nTOP PRODUCT TYPES:`);
  Object.entries(productTypeDist)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([name, count]) => {
      console.log(`  ${name}: ${count} listings`);
    });
}

// ============================================================================
// EXPORT
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    mockUsers,
    mockProducts,
    generateMockDataSummary
  };
}

// Run summary if executed directly
if (require.main === module) {
  generateMockDataSummary();
}
