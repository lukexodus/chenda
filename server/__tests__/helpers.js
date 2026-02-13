/**
 * Test Helper Functions
 * 
 * Utility functions for testing API endpoints
 */

const request = require('supertest');
const bcrypt = require('bcrypt');
const { testPool } = require('./setup');

/**
 * Create a test user in database
 */
async function createTestUser(userData = {}) {
  const defaultUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    type: 'buyer',
    location: { lat: 14.5995, lng: 120.9842 },
    address: 'Test Address, Manila',
    email_verified: true
  };

  const user = { ...defaultUser, ...userData };
  const passwordHash = await bcrypt.hash(user.password, 10);

  const result = await testPool.query(`
    INSERT INTO users (
      name, email, password_hash, type, location, address,
      preferences, email_verified
    ) VALUES (
      $1, $2, $3, $4,
      ST_SetSRID(ST_MakePoint($5, $6), 4326),
      $7, $8, $9
    )
    RETURNING id, name, email, type, address, email_verified, created_at
  `, [
    user.name,
    user.email,
    passwordHash,
    user.type,
    user.location.lng,
    user.location.lat,
    user.address,
    JSON.stringify({
      proximity_weight: 60,
      freshness_weight: 40,
      max_radius: 50,
      min_freshness: 0,
      mode: 'ranking',
      sort_by: 'score',
      sort_order: 'desc',
      storage_conditions: ['refrigerated', 'refrigerated_opened', 'frozen', 'pantry']
    }),
    user.email_verified
  ]);

  return { ...result.rows[0], plainPassword: user.password };
}

/**
 * Create a test seller user
 */
async function createTestSeller(userData = {}) {
  return createTestUser({
    ...userData,
    type: 'seller',
    email: userData.email || `seller${Date.now()}@example.com`
  });
}

/**
 * Create a test product in database
 */
async function createTestProduct(sellerId, productData = {}) {
  const defaultProduct = {
    product_type_id: 33, // Eggs
    days_already_used: 1,
    price: 85.00,
    quantity: 10,
    unit: 'containers',
    location: { lat: 14.5547, lng: 121.0244 },
    address: 'Makati City',
    storage_condition: 'refrigerated',
    description: 'Test product description',
    image_url: null,
    status: 'active'
  };

  const product = { ...defaultProduct, ...productData };

  const result = await testPool.query(`
    INSERT INTO products (
      seller_id, product_type_id, days_already_used, price, quantity, unit,
      location, address, storage_condition, description, image_url, status
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      ST_SetSRID(ST_MakePoint($7, $8), 4326),
      $9, $10, $11, $12, $13
    )
    RETURNING id, seller_id, product_type_id, days_already_used, listed_date,
              price, quantity, unit, ST_X(location::geometry) as lng,
              ST_Y(location::geometry) as lat, address, storage_condition,
              description, image_url, status, created_at, updated_at
  `, [
    sellerId,
    product.product_type_id,
    product.days_already_used,
    product.price,
    product.quantity,
    product.unit,
    product.location.lng,
    product.location.lat,
    product.address,
    product.storage_condition,
    product.description,
    product.image_url,
    product.status
  ]);

  return result.rows[0];
}

/**
 * Login a user and return session cookie
 */
async function loginUser(app, email, password) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  if (response.status !== 200) {
    throw new Error(`Login failed: ${response.body.message}`);
  }

  // Extract session cookie
  const cookies = response.headers['set-cookie'];
  return cookies;
}

/**
 * Make authenticated request
 */
async function authenticatedRequest(app, method, url, cookies, data = null) {
  const req = request(app)[method.toLowerCase()](url);
  
  if (cookies) {
    req.set('Cookie', cookies);
  }

  if (data) {
    req.send(data);
  }

  return req;
}

/**
 * Clear all test data
 */
async function clearTestData() {
  await testPool.query('DELETE FROM orders');
  await testPool.query('DELETE FROM products');
  await testPool.query('DELETE FROM users');
  await testPool.query('DELETE FROM analytics_events');
  await testPool.query('DELETE FROM session');
}

/**
 * Wait for a specified time (for rate limiting tests)
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  createTestUser,
  createTestSeller,
  createTestProduct,
  loginUser,
  authenticatedRequest,
  clearTestData,
  wait
};
