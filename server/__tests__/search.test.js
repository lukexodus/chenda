/**
 * Search Algorithm API Integration Tests
 * 
 * Tests for:
 * - POST /api/products/search (authenticated, personalized)
 * - GET /api/products/nearby (public, simple distance-based)
 * - GET /api/search/public (public search with algorithm)
 */

const request = require('supertest');
const { globalSetup, globalTeardown } = require('./setup');
const { createTestUser, createTestSeller, createTestProduct, loginUser, clearTestData } = require('./helpers');

let app;

beforeAll(async () => {
  await globalSetup();
  app = require('../app');
}, 60000);

afterAll(async () => {
  await globalTeardown();
}, 10000);

beforeEach(async () => {
  await clearTestData();
});

describe('POST /api/products/search', () => {
  test('should search products with algorithm ranking (authenticated)', async () => {
    const buyer = await createTestUser({ type: 'buyer' });
    const seller = await createTestSeller();
    const cookies = await loginUser(app, buyer.email, buyer.plainPassword);

    // Create test products at different distances
    await createTestProduct(seller.id, {
      location: { lat: 14.5547, lng: 121.0244 }, // Close to buyer
      price: 85.00,
      days_already_used: 1
    });
    await createTestProduct(seller.id, {
      location: { lat: 14.6042, lng: 120.9822 }, // Further from buyer
      price: 75.00,
      days_already_used: 2
    });

    const response = await request(app)
      .post('/api/products/search')
      .set('Cookie', cookies)
      .send({
        location: {
          lat: 14.5995,
          lng: 120.9842
        },
        config: {
          proximity_weight: 0.6,
          freshness_weight: 0.4,
          max_radius: 50,
          min_freshness: 0,
          mode: 'ranking',
          sort_by: 'score',
          sort_order: 'desc',
          storage_conditions: ['refrigerated']
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.results).toBeInstanceOf(Array);
    expect(response.body.results.length).toBeGreaterThan(0);
    
    // Check that results have algorithm scores
    expect(response.body.results[0]).toHaveProperty('combined_score');
    expect(response.body.results[0]).toHaveProperty('distance_km');
    expect(response.body.results[0]).toHaveProperty('freshness_percent');
  });

  test('should use user preferences when config not provided', async () => {
    const buyer = await createTestUser({
      type: 'buyer',
      // Default preferences in helper: proximity_weight: 60, freshness_weight: 40
    });
    const seller = await createTestSeller();
    const cookies = await loginUser(app, buyer.email, buyer.plainPassword);

    await createTestProduct(seller.id);

    const response = await request(app)
      .post('/api/products/search')
      .set('Cookie', cookies)
      .send({
        location: {
          lat: 14.5995,
          lng: 120.9842
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.config.proximity_weight).toBe(60);
    expect(response.body.config.freshness_weight).toBe(40);
  });

  test('should filter by max_radius', async () => {
    const buyer = await createTestUser();
    const seller = await createTestSeller();
    const cookies = await loginUser(app, buyer.email, buyer.plainPassword);

    // Product very far away (will be outside 10km radius)
    await createTestProduct(seller.id, {
      location: { lat: 15.5995, lng: 121.9842 } // ~150km away
    });

    const response = await request(app)
      .post('/api/products/search')
      .set('Cookie', cookies)
      .send({
        location: {
          lat: 14.5995,
          lng: 120.9842
        },
        config: {
          proximity_weight: 0.5,
          freshness_weight: 0.5,
          max_radius: 10, // Only 10km
          min_freshness: 0,
          mode: 'ranking'
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.results).toHaveLength(0);
  });

  test('should filter by min_freshness', async () => {
    const buyer = await createTestUser();
    const seller = await createTestSeller();
    const cookies = await loginUser(app, buyer.email, buyer.plainPassword);

    // Create nearly expired product
    await createTestProduct(seller.id, {
      product_type_id: 33, // Yogurt with 11 days shelf life
      days_already_used: 10, // Nearly expired (90% used)
      location: { lat: 14.5547, lng: 121.0244 }
    });

    const response = await request(app)
      .post('/api/products/search')
      .set('Cookie', cookies)
      .send({
        location: {
          lat: 14.5995,
          lng: 120.9842
        },
        config: {
          proximity_weight: 0.5,
          freshness_weight: 0.5,
          max_radius: 50,
          min_freshness: 50, // Min 50% freshness
          mode: 'ranking'
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.results.every(p => p.freshness_percent >= 50)).toBe(true);
  });

  test('should fail without authentication', async () => {
    const response = await request(app)
      .post('/api/products/search')
      .send({
        location: { lat: 14.5995, lng: 120.9842 }
      });

    expect(response.status).toBe(401);
  });

  test('should fail with invalid location', async () => {
    const buyer = await createTestUser();
    const cookies = await loginUser(app, buyer.email, buyer.plainPassword);

    const response = await request(app)
      .post('/api/products/search')
      .set('Cookie', cookies)
      .send({
        location: { lat: 200, lng: 300 } // Invalid coordinates
      });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/products/nearby', () => {
  test('should find nearby products (public access)', async () => {
    const seller = await createTestSeller();

    // Create products at different locations
    await createTestProduct(seller.id, {
      location: { lat: 14.5547, lng: 121.0244 }
    });
    await createTestProduct(seller.id, {
      location: { lat: 14.6042, lng: 120.9822 }
    });

    const response = await request(app)
      .get('/api/products/nearby')
      .query({
        lat: 14.5995,
        lng: 120.9842,
        radius: 50
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.products).toBeInstanceOf(Array);
    expect(response.body.products.length).toBeGreaterThan(0);
    
    // Results should have distance
    expect(response.body.products[0]).toHaveProperty('distance_km');
    
    // Results should be sorted by distance
    if (response.body.products.length > 1) {
      expect(response.body.products[0].distance_km).toBeLessThanOrEqual(
        response.body.products[1].distance_km
      );
    }
  });

  test('should respect radius parameter', async () => {
    const seller = await createTestSeller();

    await createTestProduct(seller.id, {
      location: { lat: 15.5995, lng: 121.9842 } // ~150km away
    });

    const response = await request(app)
      .get('/api/products/nearby')
      .query({
        lat: 14.5995,
        lng: 120.9842,
        radius: 10 // Only 10km
      });

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(0);
  });

  test('should fail with missing coordinates', async () => {
    const response = await request(app)
      .get('/api/products/nearby')
      .query({ radius: 10 });

    expect(response.status).toBe(400);
  });

  test('should fail with invalid coordinates', async () => {
    const response = await request(app)
      .get('/api/products/nearby')
      .query({
        lat: 200,
        lng: 300,
        radius: 10
      });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/search/public', () => {
  test('should perform public search with algorithm', async () => {
    const seller = await createTestSeller();

    await createTestProduct(seller.id, {
      location: { lat: 14.5547, lng: 121.0244 },
      days_already_used: 1
    });

    const response = await request(app)
      .get('/api/search/public')
      .query({
        lat: 14.5995,
        lng: 120.9842,
        radius: 50,
        proximity_weight: 0.6,
        freshness_weight: 0.4
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.results).toBeInstanceOf(Array);
    expect(response.body.results.length).toBeGreaterThan(0);
    expect(response.body.results[0]).toHaveProperty('combined_score');
  });

  test('should use default weights when not provided', async () => {
    const seller = await createTestSeller();
    await createTestProduct(seller.id);

    const response = await request(app)
      .get('/api/search/public')
      .query({
        lat: 14.5995,
        lng: 120.9842,
        radius: 50
      });

    expect(response.status).toBe(200);
    expect(response.body.config.proximity_weight).toBe(50); // Default
    expect(response.body.config.freshness_weight).toBe(50); // Default
  });
});
