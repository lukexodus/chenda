/**
 * User Management API Integration Tests
 * 
 * Tests for:
 * - GET /api/users/profile
 * - PUT /api/users/profile
 * - PUT /api/users/preferences
 * - PUT /api/users/location
 * - POST /api/users/geocode
 * - POST /api/users/reverse-geocode
 */

const request = require('supertest');
const { globalSetup, globalTeardown } = require('./setup');
const { createTestUser, loginUser, clearTestData } = require('./helpers');

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

describe('GET /api/users/profile', () => {
  test('should get own profile when authenticated', async () => {
    const user = await createTestUser({
      name: 'John Doe',
      email: 'john@example.com'
    });
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .get('/api/users/profile')
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('John Doe');
    expect(response.body.data.email).toBe('john@example.com');
    expect(response.body.data).toHaveProperty('preferences');
    expect(response.body.data).not.toHaveProperty('password_hash');
  });

  test('should fail without authentication', async () => {
    const response = await request(app)
      .get('/api/users/profile');

    expect(response.status).toBe(401);
  });
});

describe('PUT /api/users/profile', () => {
  test('should update profile successfully', async () => {
    const user = await createTestUser({
      name: 'Old Name',
      email: 'old@example.com'
    });
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .put('/api/users/profile')
      .set('Cookie', cookies)
      .send({
        name: 'New Name',
        email: 'new@example.com'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('New Name');
    expect(response.body.data.email).toBe('new@example.com');
  });

  test('should fail with duplicate email', async () => {
    await createTestUser({ email: 'existing@example.com' });
    const user2 = await createTestUser({ email: 'user2@example.com' });
    const cookies = await loginUser(app, user2.email, user2.plainPassword);

    const response = await request(app)
      .put('/api/users/profile')
      .set('Cookie', cookies)
      .send({
        email: 'existing@example.com'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('already taken');
  });

  test('should fail with invalid email format', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .put('/api/users/profile')
      .set('Cookie', cookies)
      .send({
        email: 'invalid-email'
      });

    expect(response.status).toBe(400);
  });

  test('should fail with invalid user type', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .put('/api/users/profile')
      .set('Cookie', cookies)
      .send({
        type: 'invalid'
      });

    expect(response.status).toBe(400);
  });

  test('should allow partial updates', async () => {
    const user = await createTestUser({ name: 'Old Name' });
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .put('/api/users/profile')
      .set('Cookie', cookies)
      .send({
        name: 'New Name'
        // Email not changed
      });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('New Name');
    expect(response.body.data.email).toBe(user.email); // Unchanged
  });
});

describe('PUT /api/users/preferences', () => {
  test('should update preferences successfully', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .put('/api/users/preferences')
      .set('Cookie', cookies)
      .send({
        proximity_weight: 70,
        freshness_weight: 30,
        max_radius: 100,
        min_freshness: 50,
        mode: 'filter',
        sort_by: 'price',
        sort_order: 'asc',
        storage_conditions: ['frozen', 'pantry']
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.preferences.proximity_weight).toBe(70);
    expect(response.body.data.preferences.freshness_weight).toBe(30);
    expect(response.body.data.preferences.max_radius).toBe(100);
  });

  test('should fail when weights do not sum to 100', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .put('/api/users/preferences')
      .set('Cookie', cookies)
      .send({
        proximity_weight: 70,
        freshness_weight: 40 // Sum = 110
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('must sum to 100');
  });

  test('should fail with invalid max_radius', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .put('/api/users/preferences')
      .set('Cookie', cookies)
      .send({
        proximity_weight: 50,
        freshness_weight: 50,
        max_radius: 1000 // Too large (max 500)
      });

    expect(response.status).toBe(400);
  });

  test('should fail with invalid mode', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .put('/api/users/preferences')
      .set('Cookie', cookies)
      .send({
        proximity_weight: 50,
        freshness_weight: 50,
        mode: 'invalid'
      });

    expect(response.status).toBe(400);
  });

  test('should fail with invalid sort_by', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .put('/api/users/preferences')
      .set('Cookie', cookies)
      .send({
        proximity_weight: 50,
        freshness_weight: 50,
        sort_by: 'invalid'
      });

    expect(response.status).toBe(400);
  });

  test('should allow partial preference updates', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .put('/api/users/preferences')
      .set('Cookie', cookies)
      .send({
        max_radius: 100
        // Other preferences unchanged
      });

    expect(response.status).toBe(200);
    expect(response.body.data.preferences.max_radius).toBe(100);
  });
});

describe('PUT /api/users/location', () => {
  test('should update location with coordinates only', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .put('/api/users/location')
      .set('Cookie', cookies)
      .send({
        lat: 14.5500,
        lng: 121.0000
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.location.lat).toBeCloseTo(14.5500, 4);
    expect(response.body.data.location.lng).toBeCloseTo(121.0000, 4);
    // Should have reverse geocoded address
    expect(response.body.data.address).toBeDefined();
  }, 10000); // Longer timeout for geocoding

  test('should update location with address only (geocodes)', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .put('/api/users/location')
      .set('Cookie', cookies)
      .send({
        address: 'Manila, Philippines'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.location.lat).toBeDefined();
    expect(response.body.data.location.lng).toBeDefined();
    expect(response.body.data.address).toContain('Manila');
  }, 10000); // Longer timeout for geocoding

  test('should update location with both coordinates and address', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .put('/api/users/location')
      .set('Cookie', cookies)
      .send({
        lat: 14.5500,
        lng: 121.0000,
        address: 'Makati City'
      });

    expect(response.status).toBe(200);
    expect(response.body.data.location.lat).toBeCloseTo(14.5500, 4);
    expect(response.body.data.location.lng).toBeCloseTo(121.0000, 4);
    expect(response.body.data.address).toBe('Makati City');
  });

  test('should fail with invalid coordinates', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .put('/api/users/location')
      .set('Cookie', cookies)
      .send({
        lat: 200,
        lng: 300
      });

    expect(response.status).toBe(400);
  });

  test('should fail without any location data', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .put('/api/users/location')
      .set('Cookie', cookies)
      .send({});

    expect(response.status).toBe(400);
  });
});

describe('POST /api/users/geocode', () => {
  test('should geocode address successfully', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .post('/api/users/geocode')
      .set('Cookie', cookies)
      .send({
        address: 'Quezon City, Philippines'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.lat).toBeDefined();
    expect(response.body.data.lng).toBeDefined();
    expect(response.body.data.address).toContain('Quezon City');
  }, 10000);

  test('should fail with empty address', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .post('/api/users/geocode')
      .set('Cookie', cookies)
      .send({
        address: ''
      });

    expect(response.status).toBe(400);
  });
});

describe('POST /api/users/reverse-geocode', () => {
  test('should reverse geocode coordinates successfully', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .post('/api/users/reverse-geocode')
      .set('Cookie', cookies)
      .send({
        lat: 14.5995,
        lng: 120.9842
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.address).toBeDefined();
    expect(typeof response.body.data.address).toBe('string');
  }, 10000);

  test('should fail with invalid coordinates', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .post('/api/users/reverse-geocode')
      .set('Cookie', cookies)
      .send({
        lat: 200,
        lng: 300
      });

    expect(response.status).toBe(400);
  });
});
