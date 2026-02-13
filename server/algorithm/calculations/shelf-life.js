/**
 * Chenda - Shelf Life Calculator
 * Task 2.2: Calculate remaining shelf life and freshness percentage
 * 
 * Calculations:
 * - Remaining shelf life days = total_shelf_life - days_already_used
 * - Freshness percentage = (remaining / total) * 100
 * - Expiration date = listed_date + remaining_days
 * - Is expired = current_date > expiration_date
 */

/**
 * Calculate remaining shelf life in days
 * 
 * @param {number} totalShelfLifeDays - Total shelf life from ProductType
 * @param {number} daysAlreadyUsed - Days consumed before listing
 * @returns {number} Remaining shelf life in days
 * @throws {Error} If inputs are invalid
 * 
 * @example
 * const remaining = calculateRemainingShelfLife(28, 5); // Eggs: 28 days total, 5 days used
 * console.log(remaining); // 23 days
 */
function calculateRemainingShelfLife(totalShelfLifeDays, daysAlreadyUsed) {
  // Validate inputs
  if (typeof totalShelfLifeDays !== 'number' || typeof daysAlreadyUsed !== 'number') {
    throw new Error('totalShelfLifeDays and daysAlreadyUsed must be numbers');
  }
  
  if (isNaN(totalShelfLifeDays) || isNaN(daysAlreadyUsed)) {
    throw new Error('totalShelfLifeDays and daysAlreadyUsed cannot be NaN');
  }
  
  if (totalShelfLifeDays <= 0) {
    throw new Error(`totalShelfLifeDays must be positive (got ${totalShelfLifeDays})`);
  }
  
  if (daysAlreadyUsed < 0) {
    throw new Error(`daysAlreadyUsed cannot be negative (got ${daysAlreadyUsed})`);
  }
  
  if (daysAlreadyUsed > totalShelfLifeDays) {
    throw new Error(`daysAlreadyUsed (${daysAlreadyUsed}) cannot exceed totalShelfLifeDays (${totalShelfLifeDays})`);
  }
  
  return totalShelfLifeDays - daysAlreadyUsed;
}

/**
 * Calculate freshness percentage
 * 
 * @param {number} totalShelfLifeDays - Total shelf life from ProductType
 * @param {number} daysAlreadyUsed - Days consumed before listing
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Freshness percentage (0-100)
 * @throws {Error} If inputs are invalid
 * 
 * @example
 * const freshness = calculateFreshnessPercent(28, 5); // Eggs: 28 days total, 5 used
 * console.log(freshness); // 82.14%
 */
function calculateFreshnessPercent(totalShelfLifeDays, daysAlreadyUsed, decimals = 2) {
  const remaining = calculateRemainingShelfLife(totalShelfLifeDays, daysAlreadyUsed);
  const percentage = (remaining / totalShelfLifeDays) * 100;
  
  return Number(percentage.toFixed(decimals));
}

/**
 * Calculate expiration date from listing date
 * 
 * @param {string|Date} listedDate - ISO 8601 string or Date object
 * @param {number} remainingShelfLifeDays - Remaining days until expiration
 * @returns {Date} Expiration date
 * @throws {Error} If inputs are invalid
 * 
 * @example
 * const expires = calculateExpirationDate('2025-01-29T06:00:00Z', 23);
 * console.log(expires.toISOString()); // 2025-02-21T06:00:00Z
 */
function calculateExpirationDate(listedDate, remainingShelfLifeDays) {
  // Validate and parse listed date
  let date;
  if (listedDate instanceof Date) {
    date = new Date(listedDate.getTime()); // Clone to avoid mutation
  } else if (typeof listedDate === 'string') {
    date = new Date(listedDate);
  } else {
    throw new Error('listedDate must be a Date object or ISO 8601 string');
  }
  
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${listedDate}`);
  }
  
  // Validate remaining days
  if (typeof remainingShelfLifeDays !== 'number' || isNaN(remainingShelfLifeDays)) {
    throw new Error('remainingShelfLifeDays must be a number');
  }
  
  if (remainingShelfLifeDays < 0) {
    throw new Error(`remainingShelfLifeDays cannot be negative (got ${remainingShelfLifeDays})`);
  }
  
  // Add remaining days to listed date
  const expirationDate = new Date(date);
  expirationDate.setDate(expirationDate.getDate() + remainingShelfLifeDays);
  
  return expirationDate;
}

/**
 * Check if a product is expired
 * 
 * @param {string|Date} expirationDate - Expiration date (ISO 8601 or Date)
 * @param {string|Date} currentDate - Current date (default: now)
 * @returns {boolean} True if expired, false if still fresh
 * @throws {Error} If dates are invalid
 * 
 * @example
 * const expired = isExpired('2025-01-20T00:00:00Z', '2025-01-30T00:00:00Z');
 * console.log(expired); // true (current date is after expiration)
 */
function isExpired(expirationDate, currentDate = new Date()) {
  // Parse expiration date
  let expDate;
  if (expirationDate instanceof Date) {
    expDate = expirationDate;
  } else if (typeof expirationDate === 'string') {
    expDate = new Date(expirationDate);
  } else {
    throw new Error('expirationDate must be a Date object or ISO 8601 string');
  }
  
  if (isNaN(expDate.getTime())) {
    throw new Error(`Invalid expiration date: ${expirationDate}`);
  }
  
  // Parse current date
  let currDate;
  if (currentDate instanceof Date) {
    currDate = currentDate;
  } else if (typeof currentDate === 'string') {
    currDate = new Date(currentDate);
  } else {
    throw new Error('currentDate must be a Date object or ISO 8601 string');
  }
  
  if (isNaN(currDate.getTime())) {
    throw new Error(`Invalid current date: ${currentDate}`);
  }
  
  return currDate > expDate;
}

/**
 * Calculate all shelf life metrics for a product
 * Convenience function that computes everything at once
 * 
 * @param {Object} product - Product object with required fields
 * @param {number} product.total_shelf_life_days - From ProductType
 * @param {number} product.days_already_used - From Product
 * @param {string|Date} product.listed_date - From Product
 * @param {string|Date} currentDate - Current date (default: now)
 * @returns {Object} All shelf life metrics
 * 
 * @example
 * const metrics = calculateShelfLifeMetrics({
 *   total_shelf_life_days: 28,
 *   days_already_used: 5,
 *   listed_date: '2025-01-29T06:00:00Z'
 * });
 * // Returns:
 * // {
 * //   remaining_shelf_life_days: 23,
 * //   freshness_percent: 82.14,
 * //   expiration_date: Date object,
 * //   expiration_date_iso: '2025-02-21T06:00:00.000Z',
 * //   is_expired: false
 * // }
 */
function calculateShelfLifeMetrics(product, currentDate = new Date()) {
  // Validate product object
  if (!product || typeof product !== 'object') {
    throw new Error('product must be an object');
  }
  
  const requiredFields = ['total_shelf_life_days', 'days_already_used', 'listed_date'];
  for (const field of requiredFields) {
    if (!(field in product)) {
      throw new Error(`product.${field} is required`);
    }
  }
  
  // Calculate all metrics
  const remainingDays = calculateRemainingShelfLife(
    product.total_shelf_life_days,
    product.days_already_used
  );
  
  const freshnessPercent = calculateFreshnessPercent(
    product.total_shelf_life_days,
    product.days_already_used
  );
  
  const expirationDate = calculateExpirationDate(
    product.listed_date,
    remainingDays
  );
  
  const expired = isExpired(expirationDate, currentDate);
  
  return {
    remaining_shelf_life_days: remainingDays,
    freshness_percent: freshnessPercent,
    expiration_date: expirationDate,
    expiration_date_iso: expirationDate.toISOString(),
    is_expired: expired
  };
}

/**
 * Calculate shelf life metrics for multiple products (batch)
 * 
 * @param {Array<Object>} products - Array of product objects
 * @param {string|Date} currentDate - Current date (default: now)
 * @returns {Array<Object>} Products with shelf life metrics added
 * 
 * @example
 * const productsWithMetrics = calculateShelfLifeMetricsBatch(products);
 */
function calculateShelfLifeMetricsBatch(products, currentDate = new Date()) {
  if (!Array.isArray(products)) {
    throw new Error('products must be an array');
  }
  
  return products.map((product, index) => {
    try {
      const metrics = calculateShelfLifeMetrics(product, currentDate);
      return {
        ...product,
        ...metrics
      };
    } catch (error) {
      throw new Error(`Invalid product at index ${index}: ${error.message}`);
    }
  });
}

/**
 * Filter expired products from a list
 * 
 * @param {Array<Object>} products - Products with expiration_date field
 * @param {string|Date} currentDate - Current date (default: now)
 * @returns {Array<Object>} Only non-expired products
 * 
 * @example
 * const freshProducts = filterExpiredProducts(allProducts);
 */
function filterExpiredProducts(products, currentDate = new Date()) {
  if (!Array.isArray(products)) {
    throw new Error('products must be an array');
  }
  
  return products.filter(product => {
    if (!product.expiration_date) {
      throw new Error(`Product ${product.id || 'unknown'} missing expiration_date`);
    }
    return !isExpired(product.expiration_date, currentDate);
  });
}

/**
 * Filter products by minimum freshness threshold
 * 
 * @param {Array<Object>} products - Products with freshness_percent field
 * @param {number} minFreshnessPercent - Minimum acceptable freshness (0-100)
 * @returns {Array<Object>} Products meeting freshness threshold
 * 
 * @example
 * const freshProducts = filterByFreshness(products, 70); // At least 70% fresh
 */
function filterByFreshness(products, minFreshnessPercent) {
  if (!Array.isArray(products)) {
    throw new Error('products must be an array');
  }
  
  if (typeof minFreshnessPercent !== 'number' || isNaN(minFreshnessPercent)) {
    throw new Error('minFreshnessPercent must be a number');
  }
  
  if (minFreshnessPercent < 0 || minFreshnessPercent > 100) {
    throw new Error('minFreshnessPercent must be between 0 and 100');
  }
  
  return products.filter(product => {
    if (typeof product.freshness_percent !== 'number') {
      throw new Error(`Product ${product.id || 'unknown'} missing freshness_percent`);
    }
    return product.freshness_percent >= minFreshnessPercent;
  });
}

// ============================================================================
// TESTING
// ============================================================================

/**
 * Run test cases
 */
function runTests() {
  console.log('=== Shelf Life Calculator Tests ===\n');
  
  console.log('TEST 1: Calculate remaining shelf life');
  const remaining1 = calculateRemainingShelfLife(28, 5); // Eggs
  console.log(`Eggs (28 days total, 5 days used): ${remaining1} days remaining`);
  console.log('Expected: 23 days ✓\n');
  
  console.log('TEST 2: Calculate freshness percentage');
  const freshness1 = calculateFreshnessPercent(28, 5);
  console.log(`Eggs (23/28 days): ${freshness1}% fresh`);
  console.log('Expected: 82.14% ✓\n');
  
  console.log('TEST 3: Calculate expiration date');
  const expires1 = calculateExpirationDate('2025-01-29T06:00:00Z', 23);
  console.log(`Listed: 2025-01-29, Remaining: 23 days`);
  console.log(`Expires: ${expires1.toISOString()}`);
  console.log('Expected: 2025-02-21 ✓\n');
  
  console.log('TEST 4: Check if expired (not expired)');
  const expired1 = isExpired('2025-02-21T06:00:00Z', '2025-01-30T00:00:00Z');
  console.log(`Expires: 2025-02-21, Current: 2025-01-30`);
  console.log(`Is expired: ${expired1}`);
  console.log('Expected: false ✓\n');
  
  console.log('TEST 5: Check if expired (expired)');
  const expired2 = isExpired('2025-01-20T00:00:00Z', '2025-01-30T00:00:00Z');
  console.log(`Expires: 2025-01-20, Current: 2025-01-30`);
  console.log(`Is expired: ${expired2}`);
  console.log('Expected: true ✓\n');
  
  console.log('TEST 6: Calculate all metrics at once');
  const metrics = calculateShelfLifeMetrics({
    total_shelf_life_days: 11,
    days_already_used: 2,
    listed_date: '2025-01-28T08:00:00Z'
  }, new Date('2025-01-30T00:00:00Z'));
  console.log('Buttermilk (11 days total, 2 days used):');
  console.log(JSON.stringify(metrics, null, 2));
  console.log('✓\n');
  
  console.log('TEST 7: Edge case - Just listed (0 days used)');
  const freshness2 = calculateFreshnessPercent(7, 0);
  console.log(`Kefir (7 days total, 0 days used): ${freshness2}% fresh`);
  console.log('Expected: 100% ✓\n');
  
  console.log('TEST 8: Edge case - Near expiration');
  const freshness3 = calculateFreshnessPercent(14, 13);
  const remaining3 = calculateRemainingShelfLife(14, 13);
  console.log(`Cottage cheese (14 days total, 13 days used): ${freshness3}% fresh, ${remaining3} day remaining`);
  console.log('Expected: 7.14%, 1 day ✓\n');
  
  console.log('TEST 9: Error handling - Negative days used');
  try {
    calculateRemainingShelfLife(10, -1);
    console.log('❌ Should have thrown error');
  } catch (error) {
    console.log(`✓ Caught error: ${error.message}\n`);
  }
  
  console.log('TEST 10: Error handling - Days used exceeds total');
  try {
    calculateRemainingShelfLife(10, 15);
    console.log('❌ Should have thrown error');
  } catch (error) {
    console.log(`✓ Caught error: ${error.message}\n`);
  }
  
  console.log('TEST 11: Error handling - Invalid date');
  try {
    calculateExpirationDate('not-a-date', 10);
    console.log('❌ Should have thrown error');
  } catch (error) {
    console.log(`✓ Caught error: ${error.message}\n`);
  }
  
  console.log('=== All Tests Completed ===');
}

// ============================================================================
// EXPORT
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateRemainingShelfLife,
    calculateFreshnessPercent,
    calculateExpirationDate,
    isExpired,
    calculateShelfLifeMetrics,
    calculateShelfLifeMetricsBatch,
    filterExpiredProducts,
    filterByFreshness
  };
}

// Run tests if executed directly
if (require.main === module) {
  runTests();
}
