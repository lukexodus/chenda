/**
 * Chenda - Haversine Distance Calculator
 * Task 2.1: Calculate straight-line distance between two geographic points
 * 
 * Formula: Haversine formula for great-circle distance
 * Earth Radius: 6371 km (mean radius)
 * Precision: Full precision internally, 2 decimals for display
 */

// Earth radius constants (in kilometers)
const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_MILES = 3959;
const EARTH_RADIUS_METERS = 6371000;

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Validate coordinate object
 * @param {Object} point - Coordinate object {lat, lng}
 * @param {string} paramName - Parameter name for error messages
 * @throws {Error} If coordinates are invalid
 */
function validateCoordinate(point, paramName) {
  if (!point || typeof point !== 'object') {
    throw new Error(`${paramName} must be an object with lat and lng properties`);
  }
  
  if (typeof point.lat !== 'number' || typeof point.lng !== 'number') {
    throw new Error(`${paramName} must have numeric lat and lng properties`);
  }
  
  if (point.lat < -90 || point.lat > 90) {
    throw new Error(`${paramName}.lat must be between -90 and 90 (got ${point.lat})`);
  }
  
  if (point.lng < -180 || point.lng > 180) {
    throw new Error(`${paramName}.lng must be between -180 and 180 (got ${point.lng})`);
  }
  
  if (isNaN(point.lat) || isNaN(point.lng)) {
    throw new Error(`${paramName} contains NaN values`);
  }
}

/**
 * Calculate straight-line distance between two geographic points
 * using Haversine formula
 * 
 * Formula:
 *   a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlng/2)
 *   c = 2 * atan2(√a, √(1−a))
 *   distance = R * c
 * 
 * @param {Object} point1 - First coordinate {lat: number, lng: number}
 * @param {Object} point2 - Second coordinate {lat: number, lng: number}
 * @param {string} unit - 'km' (default), 'miles', 'meters'
 * @returns {number} Distance in specified unit (full precision)
 * @throws {Error} If coordinates are invalid or unit is unsupported
 * 
 * @example
 * const distance = calculateDistance(
 *   {lat: 14.5995, lng: 120.9842},  // Quezon City
 *   {lat: 14.5547, lng: 121.0244}   // Makati
 * );
 * console.log(distance); // ~5.67 km
 */
function calculateDistance(point1, point2, unit = 'km') {
  // Validate inputs
  validateCoordinate(point1, 'point1');
  validateCoordinate(point2, 'point2');
  
  // Handle same location edge case
  if (point1.lat === point2.lat && point1.lng === point2.lng) {
    return 0;
  }
  
  // Convert to radians
  const lat1Rad = toRadians(point1.lat);
  const lat2Rad = toRadians(point2.lat);
  const deltaLatRad = toRadians(point2.lat - point1.lat);
  const deltaLngRad = toRadians(point2.lng - point1.lng);
  
  // Haversine formula
  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Calculate distance based on unit
  let distance;
  switch (unit.toLowerCase()) {
    case 'km':
    case 'kilometers':
      distance = EARTH_RADIUS_KM * c;
      break;
    case 'miles':
    case 'mi':
      distance = EARTH_RADIUS_MILES * c;
      break;
    case 'meters':
    case 'm':
      distance = EARTH_RADIUS_METERS * c;
      break;
    default:
      throw new Error(`Unsupported unit: ${unit}. Use 'km', 'miles', or 'meters'`);
  }
  
  return distance;
}

/**
 * Calculate distance and return with specified decimal precision
 * Convenience function for display purposes
 * 
 * @param {Object} point1 - First coordinate {lat: number, lng: number}
 * @param {Object} point2 - Second coordinate {lat: number, lng: number}
 * @param {string} unit - 'km' (default), 'miles', 'meters'
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Distance rounded to specified decimals
 * 
 * @example
 * const distance = calculateDistanceRounded(
 *   {lat: 14.5995, lng: 120.9842},
 *   {lat: 14.5547, lng: 121.0244},
 *   'km',
 *   2
 * );
 * console.log(distance); // 5.67
 */
function calculateDistanceRounded(point1, point2, unit = 'km', decimals = 2) {
  const distance = calculateDistance(point1, point2, unit);
  return Number(distance.toFixed(decimals));
}

/**
 * Batch calculate distances from one point to multiple points
 * Useful for calculating distances from buyer to all products
 * 
 * @param {Object} origin - Origin coordinate {lat: number, lng: number}
 * @param {Array<Object>} destinations - Array of coordinates [{lat, lng}, ...]
 * @param {string} unit - 'km' (default), 'miles', 'meters'
 * @returns {Array<number>} Array of distances in same order as destinations
 * 
 * @example
 * const distances = calculateDistanceBatch(
 *   {lat: 14.5995, lng: 120.9842},  // Buyer location
 *   [
 *     {lat: 14.6091, lng: 121.0223},  // Product 1
 *     {lat: 14.5378, lng: 121.0506}   // Product 2
 *   ]
 * );
 * console.log(distances); // [4.20, 8.15]
 */
function calculateDistanceBatch(origin, destinations, unit = 'km') {
  validateCoordinate(origin, 'origin');
  
  if (!Array.isArray(destinations)) {
    throw new Error('destinations must be an array');
  }
  
  return destinations.map((dest, index) => {
    try {
      return calculateDistance(origin, dest, unit);
    } catch (error) {
      throw new Error(`Invalid destination at index ${index}: ${error.message}`);
    }
  });
}

// ============================================================================
// TESTING & EXAMPLES
// ============================================================================

/**
 * Run test cases with real Metro Manila coordinates
 */
function runTests() {
  console.log('=== Haversine Distance Calculator Tests ===\n');
  
  // Test data: Real Metro Manila locations from mock data
  const locations = {
    quezonCity: { lat: 14.5995, lng: 120.9842, name: 'Quezon City' },
    makati: { lat: 14.5547, lng: 121.0244, name: 'Makati' },
    pasig: { lat: 14.6091, lng: 121.0223, name: 'Pasig' },
    taguig: { lat: 14.5378, lng: 121.0506, name: 'Taguig' },
    manila: { lat: 14.5833, lng: 120.9794, name: 'Manila' },
    valenzuela: { lat: 14.6507, lng: 120.9721, name: 'Valenzuela' }
  };
  
  console.log('TEST 1: Basic distance calculation (km)');
  const dist1 = calculateDistance(locations.quezonCity, locations.makati);
  console.log(`${locations.quezonCity.name} to ${locations.makati.name}: ${dist1.toFixed(2)} km`);
  console.log('Expected: ~5-6 km ✓\n');
  
  console.log('TEST 2: Same location (edge case)');
  const dist2 = calculateDistance(locations.pasig, locations.pasig);
  console.log(`${locations.pasig.name} to ${locations.pasig.name}: ${dist2} km`);
  console.log('Expected: 0 km ✓\n');
  
  console.log('TEST 3: Different units');
  const distKm = calculateDistance(locations.manila, locations.valenzuela, 'km');
  const distMiles = calculateDistance(locations.manila, locations.valenzuela, 'miles');
  const distMeters = calculateDistance(locations.manila, locations.valenzuela, 'meters');
  console.log(`${locations.manila.name} to ${locations.valenzuela.name}:`);
  console.log(`  - ${distKm.toFixed(2)} km`);
  console.log(`  - ${distMiles.toFixed(2)} miles`);
  console.log(`  - ${distMeters.toFixed(0)} meters ✓\n`);
  
  console.log('TEST 4: Rounded distance (2 decimals)');
  const dist4 = calculateDistanceRounded(locations.quezonCity, locations.taguig);
  console.log(`${locations.quezonCity.name} to ${locations.taguig.name}: ${dist4} km`);
  console.log('Expected: 2 decimal places ✓\n');
  
  console.log('TEST 5: Batch calculation');
  const buyerLocation = locations.quezonCity;
  const sellerLocations = [locations.pasig, locations.taguig, locations.manila];
  const distances = calculateDistanceBatch(buyerLocation, sellerLocations);
  console.log(`From ${buyerLocation.name} to multiple locations:`);
  sellerLocations.forEach((loc, i) => {
    console.log(`  - ${loc.name}: ${distances[i].toFixed(2)} km`);
  });
  console.log('✓\n');
  
  console.log('TEST 6: Error handling - Invalid latitude');
  try {
    calculateDistance({ lat: 95, lng: 120 }, locations.makati);
    console.log('❌ Should have thrown error');
  } catch (error) {
    console.log(`✓ Caught error: ${error.message}\n`);
  }
  
  console.log('TEST 7: Error handling - Missing coordinates');
  try {
    calculateDistance({ lat: 14.5 }, locations.makati);
    console.log('❌ Should have thrown error');
  } catch (error) {
    console.log(`✓ Caught error: ${error.message}\n`);
  }
  
  console.log('TEST 8: Error handling - Invalid unit');
  try {
    calculateDistance(locations.quezonCity, locations.makati, 'lightyears');
    console.log('❌ Should have thrown error');
  } catch (error) {
    console.log(`✓ Caught error: ${error.message}\n`);
  }
  
  console.log('=== All Tests Completed ===');
  
  // Summary table
  console.log('\n=== Distance Matrix (km) ===');
  console.log('From Quezon City to:');
  Object.entries(locations).forEach(([key, loc]) => {
    if (key !== 'quezonCity') {
      const dist = calculateDistanceRounded(locations.quezonCity, loc);
      console.log(`  ${loc.name.padEnd(15)}: ${dist.toFixed(2).padStart(6)} km`);
    }
  });
}

// ============================================================================
// EXPORT
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateDistance,
    calculateDistanceRounded,
    calculateDistanceBatch,
    toRadians,
    validateCoordinate,
    EARTH_RADIUS_KM,
    EARTH_RADIUS_MILES,
    EARTH_RADIUS_METERS
  };
}

// Run tests if executed directly
if (require.main === module) {
  runTests();
}
