/**
 * Chenda - Data Structure Definitions
 * Task 1.5 & 1.6: User and Product Object Structures
 */

// ============================================================================
// USER OBJECT STRUCTURE (Task 1.5)
// ============================================================================

/**
 * User Object
 * Represents both buyers and sellers in the platform
 * 
 * @typedef {Object} User
 * @property {number} id - Unique user identifier
 * @property {string} name - User's full name
 * @property {string} email - User's email address
 * @property {'buyer'|'seller'|'both'} type - User role in the platform
 * @property {Object} location - Geographic coordinates
 * @property {number} location.lat - Latitude (-90 to 90)
 * @property {number} location.lng - Longitude (-180 to 180)
 * @property {string} location.address - Human-readable address (optional)
 * @property {Object} preferences - User algorithm preferences
 * @property {number} preferences.proximity_weight - Weight for proximity (0-100, default: 50)
 * @property {number} preferences.shelf_life_weight - Weight for shelf life (0-100, default: 50)
 * @property {number} preferences.max_radius_km - Maximum delivery radius in km (default: 50)
 * @property {number|null} preferences.min_freshness_percent - Minimum freshness threshold (0-100, optional)
 * @property {'ranking'|'filter_sort'} preferences.display_mode - Display mode preference (default: 'ranking')
 * @property {string} created_at - ISO 8601 timestamp of account creation
 */

const userSchema = {
  id: 'number',
  name: 'string',
  email: 'string',
  type: 'buyer|seller|both',
  location: {
    lat: 'number',
    lng: 'number',
    address: 'string (optional)'
  },
  preferences: {
    proximity_weight: 'number (0-100, default: 50)',
    shelf_life_weight: 'number (0-100, default: 50)',
    max_radius_km: 'number (default: 50)',
    min_freshness_percent: 'number|null (0-100, optional)',
    display_mode: 'ranking|filter_sort (default: ranking)'
  },
  created_at: 'ISO 8601 string'
};

/**
 * Example User Object
 */
const exampleBuyer = {
  id: 1,
  name: "Maria Santos",
  email: "maria.santos@email.com",
  type: "buyer",
  location: {
    lat: 14.5995,
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
};

const exampleSeller = {
  id: 2,
  name: "Juan's Fresh Market",
  email: "juan.market@email.com",
  type: "seller",
  location: {
    lat: 14.6091,
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
};

// ============================================================================
// PRODUCT OBJECT STRUCTURE (Task 1.6)
// ============================================================================

/**
 * Product Object
 * Represents a perishable product listing from a seller
 * 
 * @typedef {Object} Product
 * @property {number} id - Unique product identifier
 * @property {number} seller_id - Reference to User.id (must be type 'seller' or 'both')
 * @property {number} product_type_id - Reference to ProductType.id (from USDA data)
 * @property {number} days_already_used - Days of shelf life consumed before listing
 * @property {string} listed_date - ISO 8601 timestamp when product was listed
 * @property {number} price - Price in Philippine Pesos (PHP)
 * @property {number} quantity - Available quantity (units/kg depending on product)
 * @property {string} unit - Unit of measurement ('kg', 'pieces', 'liters', etc.)
 * @property {Object} location - Geographic coordinates (usually same as seller)
 * @property {number} location.lat - Latitude (-90 to 90)
 * @property {number} location.lng - Longitude (-180 to 180)
 * @property {string} location.address - Human-readable address (optional)
 * @property {string} storage_condition - How product is currently stored
 * @property {string|null} description - Optional product description
 * @property {string} status - Product listing status
 */

const productSchema = {
  id: 'number',
  seller_id: 'number (FK to User.id)',
  product_type_id: 'number (FK to ProductType.id)',
  days_already_used: 'number (0 to default_shelf_life_days)',
  listed_date: 'ISO 8601 string',
  price: 'number (PHP)',
  quantity: 'number',
  unit: 'string (kg|pieces|liters|etc)',
  location: {
    lat: 'number',
    lng: 'number',
    address: 'string (optional)'
  },
  storage_condition: 'refrigerated_opened|refrigerated|pantry_opened|pantry|frozen_opened|frozen',
  description: 'string|null',
  status: 'active|sold|expired|removed'
};

/**
 * Example Product Object
 * Product: Milk (Product Type ID 21 from USDA data)
 * Shelf Life: 6 days (from product_types_perishables.json)
 * Storage: refrigerated_opened
 */
const exampleProduct = {
  id: 1,
  seller_id: 2,
  product_type_id: 21, // Milk from USDA data
  days_already_used: 1, // Opened yesterday
  listed_date: "2025-01-29T06:00:00Z",
  price: 85.00,
  quantity: 2,
  unit: "liters",
  location: {
    lat: 14.6091,
    lng: 121.0223,
    address: "Pasig City, Metro Manila"
  },
  storage_condition: "refrigerated_opened",
  description: "Fresh whole milk, opened yesterday, refrigerated continuously",
  status: "active"
};

// ============================================================================
// CALCULATED FIELDS (Runtime - Not Stored)
// ============================================================================

/**
 * Calculated Product Fields
 * These are computed at runtime, not stored in the database
 * 
 * @typedef {Object} CalculatedProductFields
 * @property {number} total_shelf_life_days - From ProductType.default_shelf_life_days
 * @property {number} remaining_shelf_life_days - total - days_already_used
 * @property {number} freshness_percent - (remaining / total) * 100
 * @property {string} expiration_date - ISO 8601: listed_date + remaining_shelf_life_days
 * @property {boolean} is_expired - expiration_date < current_date
 * @property {number} distance_km - Haversine distance from buyer location (query-specific)
 * @property {number} proximity_score - Normalized 0-100 (query-specific)
 * @property {number} shelf_life_score - Normalized 0-100 (same as freshness_percent)
 * @property {number} combined_score - Weighted sum of proximity + shelf_life scores
 */

const calculatedFieldsExample = {
  // From ProductType lookup
  total_shelf_life_days: 6,
  
  // Basic calculations
  remaining_shelf_life_days: 5, // 6 - 1
  freshness_percent: 83.33, // (5 / 6) * 100
  expiration_date: "2025-02-03T06:00:00Z", // listed_date + 5 days
  is_expired: false,
  
  // Query-specific (depends on buyer location)
  distance_km: 4.2,
  proximity_score: 95.8, // Normalized based on max_radius
  shelf_life_score: 83.33, // Same as freshness_percent
  combined_score: 89.56 // (60 * 95.8 + 40 * 83.33) / 100
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

const validationRules = {
  user: {
    proximity_weight_plus_shelf_life_weight: 'Must sum to 100',
    location_lat: 'Must be between -90 and 90',
    location_lng: 'Must be between -180 and 180',
    max_radius_km: 'Must be > 0, recommended <= 100',
    min_freshness_percent: 'If set, must be 0-100'
  },
  
  product: {
    days_already_used: 'Must be >= 0 and < total_shelf_life_days',
    seller_id: 'User.type must be "seller" or "both"',
    product_type_id: 'Must exist in ProductType table',
    price: 'Must be > 0',
    quantity: 'Must be > 0',
    storage_condition: 'Must match ProductType.default_storage_condition or be valid alternative',
    listed_date: 'Cannot be in the future'
  }
};

// ============================================================================
// EXPORT
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    userSchema,
    productSchema,
    exampleBuyer,
    exampleSeller,
    exampleProduct,
    calculatedFieldsExample,
    validationRules
  };
}

console.log("=== Chenda Data Structures Defined ===");
console.log("\nTask 1.5 ✓ User Object Structure");
console.log("Task 1.6 ✓ Product Object Structure");
console.log("\nExample User:", JSON.stringify(exampleBuyer, null, 2));
console.log("\nExample Product:", JSON.stringify(exampleProduct, null, 2));
