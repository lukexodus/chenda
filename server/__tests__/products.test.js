/**
 * Product Management API Integration Tests
 * 
 * Tests for:
 * - Create product (POST /api/products)
 * - Get single product (GET /api/products/:id)
 * - List seller's products (GET /api/products)
 * - Update product (PUT /api/products/:id)
 * - Delete product (DELETE /api/products/:id)
 * - Authorization checks
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

describe('POST /api/products', () => {
  test('should create product successfully as seller', async () => {
    const seller = await createTestSeller();
    const cookies = await loginUser(app, seller.email, seller.plainPassword);

    const response = await request(app)
      .post('/api/products')
      .set('Cookie', cookies)
      .send({
        product_type_id: 33, // Eggs
        days_already_used: 1,
        price: 85.00,
        quantity: 10,
        unit: 'containers',
        location: { lat: 14.5547, lng: 121.0244 },
        address: 'Makati City',
        storage_condition: 'refrigerated',
        description: 'Fresh farm eggs'
      });

    console.log('Create product response:', response.status, JSON.stringify(response.body, null, 2));

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.product).toHaveProperty('id');
    expect(parseFloat(response.body.product.price)).toBe(85);
    expect(response.body.product.seller_id).toBe(seller.id);
  });

  test('should fail when buyer tries to create product', async () => {
    const buyer = await createTestUser({ type: 'buyer' });
    const cookies = await loginUser(app, buyer.email, buyer.plainPassword);

    const response = await request(app)
      .post('/api/products')
      .set('Cookie', cookies)
      .send({
        product_type_id: 33,
        days_already_used: 1,
        price: 85.00,
        quantity: 10,
        unit: 'containers',
        location: { lat: 14.5547, lng: 121.0244 },
        address: 'Makati City',
        storage_condition: 'refrigerated',
        description: 'Test'
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  test('should fail without authentication', async () => {
    const response = await request(app)
      .post('/api/products')
      .send({
        product_type_id: 33,
        price: 85.00,
        quantity: 10
      });

    expect(response.status).toBe(401);
  });

  test('should fail with invalid product_type_id', async () => {
    const seller = await createTestSeller();
    const cookies = await loginUser(app, seller.email, seller.plainPassword);

    const response = await request(app)
      .post('/api/products')
      .set('Cookie', cookies)
      .send({
        product_type_id: 99999, // Non-existent
        days_already_used: 1,
        price: 85.00,
        quantity: 10,
        unit: 'containers',
        location: { lat: 14.5547, lng: 121.0244 },
        address: 'Makati City',
        storage_condition: 'refrigerated'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('should fail with negative price', async () => {
    const seller = await createTestSeller();
    const cookies = await loginUser(app, seller.email, seller.plainPassword);

    const response = await request(app)
      .post('/api/products')
      .set('Cookie', cookies)
      .send({
        product_type_id: 33,
       days_already_used: 1,
        price: 85.00,
        quantity: 10,
        unit: 'containers',
        location: { lat: 14.5547, lng: 121.0244 },
        address: 'Makati City',
        storage_condition: 'refrigerated_unopened'
      });

    expect(response.status).toBe(400);
  });

  test('should fail with invalid coordinates', async () => {
    const seller = await createTestSeller();
    const cookies = await loginUser(app, seller.email, seller.plainPassword);

    const response = await request(app)
      .post('/api/products')
      .set('Cookie', cookies)
      .send({
        product_type_id: 33,
        price: 85.00,
        quantity: 10,
        unit: 'containers',
        location: { lat: 200, lng: 121.0244 }, // Invalid
        address: 'Makati City',
        storage_condition: 'refrigerated'
      });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/products/:id', () => {
  test('should get product by ID (public access)', async () => {
    const seller = await createTestSeller();
    const product = await createTestProduct(seller.id);

    const response = await request(app)
      .get(`/api/products/${product.id}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.product.id).toBe(product.id);
    expect(response.body.product.seller_name).toBe(seller.name);
  });

  test('should return 404 for non-existent product', async () => {
    const response = await request(app)
      .get('/api/products/99999');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});

describe('GET /api/products', () => {
  test('should list seller\'s own products', async () => {
    const seller = await createTestSeller();
    const cookies = await loginUser(app, seller.email, seller.plainPassword);

    // Create multiple products
    await createTestProduct(seller.id, { price: 85.00 });
    await createTestProduct(seller.id, { price: 95.00 });
    await createTestProduct(seller.id, { price: 75.00 });

    const response = await request(app)
      .get('/api/products')
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.products).toHaveLength(3);
    expect(response.body.pagination.total).toBe(3);
  });

  test('should not show other sellers\' products', async () => {
    const seller1 = await createTestSeller({ email: 'seller1@example.com' });
    const seller2 = await createTestSeller({ email: 'seller2@example.com' });

    await createTestProduct(seller1.id);
    await createTestProduct(seller2.id);
    await createTestProduct(seller2.id);

    const cookies = await loginUser(app, seller1.email, seller1.plainPassword);

    const response = await request(app)
      .get('/api/products')
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0].seller_id).toBe(seller1.id);
  });

  test('should filter by status', async () => {
    const seller = await createTestSeller();
    const cookies = await loginUser(app, seller.email, seller.plainPassword);

    await createTestProduct(seller.id, { status: 'active' });
    await createTestProduct(seller.id, { status: 'active' });
    await createTestProduct(seller.id, { status: 'sold' });

    const response = await request(app)
      .get('/api/products?status=active')
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(2);
    expect(response.body.products.every(p => p.status === 'active')).toBe(true);
  });

  test('should support pagination', async () => {
    const seller = await createTestSeller();
    const cookies = await loginUser(app, seller.email, seller.plainPassword);

    // Create 5 products
    for (let i = 0; i < 5; i++) {
      await createTestProduct(seller.id);
    }

    const response = await request(app)
      .get('/api/products?limit=2&offset=0')
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(2);
    expect(response.body.pagination.total).toBe(5);
  });

  test('should fail without authentication', async () => {
    const response = await request(app)
      .get('/api/products');

    expect(response.status).toBe(401);
  });
});

describe('PUT /api/products/:id', () => {
  test('should update own product successfully', async () => {
    const seller = await createTestSeller();
    const cookies = await loginUser(app, seller.email, seller.plainPassword);
    const product = await createTestProduct(seller.id, { price: 85.00 });

    const response = await request(app)
      .put(`/api/products/${product.id}`)
      .set('Cookie', cookies)
      .send({
        price: 95.00,
        quantity: 15,
        description: 'Updated description'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.product.price).toBe(95);
    expect(response.body.product.quantity).toBe(15);
    expect(response.body.product.description).toBe('Updated description');
  });

  test('should not update another seller\'s product', async () => {
    const seller1 = await createTestSeller({ email: 'seller1@example.com' });
    const seller2 = await createTestSeller({ email: 'seller2@example.com' });
    
    const product = await createTestProduct(seller1.id);
    const cookies = await loginUser(app, seller2.email, seller2.plainPassword);

    const response = await request(app)
      .put(`/api/products/${product.id}`)
      .set('Cookie', cookies)
      .send({ price: 100.00 });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  test('should fail without authentication', async () => {
    const seller = await createTestSeller();
    const product = await createTestProduct(seller.id);

    const response = await request(app)
      .put(`/api/products/${product.id}`)
      .send({ price: 100.00 });

    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/products/:id', () => {
  test('should delete own product successfully (soft delete)', async () => {
    const seller = await createTestSeller();
    const cookies = await loginUser(app, seller.email, seller.plainPassword);
    const product = await createTestProduct(seller.id);

    const response = await request(app)
      .delete(`/api/products/${product.id}`)
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify product status changed to 'removed'
    const getResponse = await request(app)
      .get(`/api/products/${product.id}`);

    expect(getResponse.body.product.status).toBe('removed');
  });

  test('should not delete another seller\'s product', async () => {
    const seller1 = await createTestSeller({ email: 'seller1@example.com' });
    const seller2 = await createTestSeller({ email: 'seller2@example.com' });
    
    const product = await createTestProduct(seller1.id);
    const cookies = await loginUser(app, seller2.email, seller2.plainPassword);

    const response = await request(app)
      .delete(`/api/products/${product.id}`)
      .set('Cookie', cookies);

    expect(response.status).toBe(403);
  });

  test('should fail without authentication', async () => {
    const seller = await createTestSeller();
    const product = await createTestProduct(seller.id);

    const response = await request(app)
      .delete(`/api/products/${product.id}`);

    expect(response.status).toBe(401);
  });
});
