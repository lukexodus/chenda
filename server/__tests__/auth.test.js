/**
 * Authentication API Integration Tests
 * 
 * Tests for:
 * - User registration
 * - User login
 * - User logout
 * - Get current user (/me)
 * - Password update
 */

const request = require('supertest');
const { globalSetup, globalTeardown, cleanDatabase } = require('./setup');
const { createTestUser, loginUser, clearTestData } = require('./helpers');

// Import app (we'll need to modify app.js to export the app)
let app;

beforeAll(async () => {
  await globalSetup();
  
  // Import app after environment is set up
  app = require('../app');
}, 60000);

afterAll(async () => {
  await globalTeardown();
}, 10000);

beforeEach(async () => {
  await clearTestData();
});

describe('POST /api/auth/register', () => {
  test('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        type: 'buyer'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user.email).toBe('john@example.com');
    expect(response.body.user.name).toBe('John Doe');
    expect(response.body.user).not.toHaveProperty('password_hash');
  });

  test('should fail with duplicate email', async () => {
    // Create first user
    await createTestUser({ email: 'duplicate@example.com' });

    // Try to create another with same email
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another User',
        email: 'duplicate@example.com',
        password: 'password123',
        type: 'buyer'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('already registered');
  });

  test('should fail with invalid email format', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
        type: 'buyer'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('should fail with short password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'short',
        type: 'buyer'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('at least 8 characters');
  });

  test('should fail with invalid user type', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        type: 'invalid'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('should register seller successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Seller',
        email: 'jane@example.com',
        password: 'password123',
        type: 'seller'
      });

    expect(response.status).toBe(201);
    expect(response.body.user.type).toBe('seller');
  });
});

describe('POST /api/auth/login', () => {
  test('should login successfully with correct credentials', async () => {
    const user = await createTestUser({
      email: 'login@example.com',
      password: 'password123'
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe('login@example.com');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  test('should fail with incorrect password', async () => {
    await createTestUser({
      email: 'login@example.com',
      password: 'password123'
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('should fail with non-existent user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('should fail with missing fields', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});

describe('GET /api/auth/me', () => {
  test('should return current user when authenticated', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe(user.email);
    expect(response.body.user).toHaveProperty('preferences');
  });

  test('should fail when not authenticated', async () => {
    const response = await request(app)
      .get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});

describe('POST /api/auth/logout', () => {
  test('should logout successfully when authenticated', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Logged out successfully');
  });

  test('should fail when not authenticated', async () => {
    const response = await request(app)
      .post('/api/auth/logout');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('should invalidate session after logout', async () => {
    const user = await createTestUser();
    const cookies = await loginUser(app, user.email, user.plainPassword);

    // Logout
    await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookies);

    // Try to access protected route
    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies);

    expect(response.status).toBe(401);
  });
});

describe('PUT /api/auth/password', () => {
  test('should update password successfully', async () => {
    const user = await createTestUser({ password: 'oldpassword123' });
    const cookies = await loginUser(app, user.email, 'oldpassword123');

    const response = await request(app)
      .put('/api/auth/password')
      .set('Cookie', cookies)
      .send({
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify old password doesn't work
    const oldLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'oldpassword123' });
    expect(oldLoginResponse.status).toBe(401);

    // Verify new password works
    const newLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'newpassword123' });
    expect(newLoginResponse.status).toBe(200);
  });

  test('should fail with incorrect current password', async () => {
    const user = await createTestUser({ password: 'password123' });
    const cookies = await loginUser(app, user.email, 'password123');

    const response = await request(app)
      .put('/api/auth/password')
      .set('Cookie', cookies)
      .send({
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Current password is incorrect');
  });

  test('should fail with short new password', async () => {
    const user = await createTestUser({ password: 'password123' });
    const cookies = await loginUser(app, user.email, 'password123');

    const response = await request(app)
      .put('/api/auth/password')
      .set('Cookie', cookies)
      .send({
        currentPassword: 'password123',
        newPassword: 'short'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
