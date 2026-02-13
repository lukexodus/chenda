# API Integration Tests

Comprehensive test suite for the Chenda API server.

## Overview

Tests cover all major API endpoints organized into modules:
- **Authentication** - Login, register, logout, password management
- **Product Management** - CRUD operations, authorization
- **Search Algorithm** - Ranking, filtering, distance-based search
- **User Management** - Profile, preferences, location, geocoding

## Setup

### Prerequisites

- PostgreSQL 18+ running locally
- Node.js 18+
- All dependencies installed (`npm install`)

### Test Database

Tests use a separate `chenda_test` database to avoid affecting development data.

**Configuration:** `.env.test`

```env
NODE_ENV=test
DB_NAME=chenda_test
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
```

The test suite automatically:
1. Creates `chenda_test` database if it doesn't exist
2. Runs all migrations
3. Seeds product types (180 USDA items)
4. Cleans data between tests
5. Tears down after all tests complete

## Running Tests

### Run all tests
```bash
npm test
```

### Run in watch mode (for development)
```bash
npm run test:watch
```

### Run with coverage report
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- auth.test.js
npm test -- products.test.js
npm test -- search.test.js
npm test -- users.test.js
```

### Run specific test suite
```bash
npm test -- --testNamePattern="POST /api/auth/login"
```

## Test Structure

```
server/
├── __tests__/
│   ├── setup.js          # Test environment setup/teardown
│   ├── helpers.js        # Test utility functions
│   ├── auth.test.js      # Authentication tests (14 tests)
│   ├── products.test.js  # Product CRUD tests (20 tests)
│   ├── search.test.js    # Search algorithm tests (13 tests)
│   └── users.test.js     # User management tests (20 tests)
└── .env.test            # Test environment variables
```

**Total: 67+ integration tests**

## Test Coverage

### Authentication (`auth.test.js`)

**POST /api/auth/register**
- ✓ Register new user successfully
- ✓ Fail with duplicate email
- ✓ Fail with invalid email format
- ✓ Fail with short password
- ✓ Fail with invalid user type
- ✓ Register seller successfully

**POST /api/auth/login**
- ✓ Login with correct credentials
- ✓ Fail with incorrect password
- ✓ Fail with non-existent user
- ✓ Fail with missing fields

**GET /api/auth/me**
- ✓ Return current user when authenticated
- ✓ Fail when not authenticated

**POST /api/auth/logout**
- ✓ Logout successfully when authenticated
- ✓ Fail when not authenticated
- ✓ Invalidate session after logout

**PUT /api/auth/password**
- ✓ Update password successfully
- ✓ Fail with incorrect current password
- ✓ Fail with short new password

---

### Product Management (`products.test.js`)

**POST /api/products**
- ✓ Create product as seller
- ✓ Fail when buyer tries to create
- ✓ Fail without authentication
- ✓ Fail with invalid product_type_id
- ✓ Fail with negative price
- ✓ Fail with invalid coordinates

**GET /api/products/:id**
- ✓ Get product by ID (public access)
- ✓ Return 404 for non-existent product

**GET /api/products**
- ✓ List seller's own products
- ✓ Not show other sellers' products
- ✓ Filter by status
- ✓ Support pagination
- ✓ Fail without authentication

**PUT /api/products/:id**
- ✓ Update own product successfully
- ✓ Not update another seller's product
- ✓ Fail without authentication

**DELETE /api/products/:id**
- ✓ Delete own product (soft delete)
- ✓ Not delete another seller's product
- ✓ Fail without authentication

---

### Search Algorithm (`search.test.js`)

**POST /api/products/search**
- ✓ Search with algorithm ranking (authenticated)
- ✓ Use user preferences when config not provided
- ✓ Filter by max_radius
- ✓ Filter by min_freshness
- ✓ Fail without authentication
- ✓ Fail with invalid location

**GET /api/products/nearby**
- ✓ Find nearby products (public access)
- ✓ Respect radius parameter
- ✓ Fail with missing coordinates
- ✓ Fail with invalid coordinates

**GET /api/search/public**
- ✓ Perform public search with algorithm
- ✓ Use default weights when not provided

---

### User Management (`users.test.js`)

**GET /api/users/profile**
- ✓ Get own profile when authenticated
- ✓ Fail without authentication

**PUT /api/users/profile**
- ✓ Update profile successfully
- ✓ Fail with duplicate email
- ✓ Fail with invalid email format
- ✓ Fail with invalid user type
- ✓ Allow partial updates

**PUT /api/users/preferences**
- ✓ Update preferences successfully
- ✓ Fail when weights do not sum to 100
- ✓ Fail with invalid max_radius
- ✓ Fail with invalid mode
- ✓ Fail with invalid sort_by
- ✓ Allow partial preference updates

**PUT /api/users/location**
- ✓ Update location with coordinates only
- ✓ Update location with address only (geocodes)
- ✓ Update location with both coordinates and address
- ✓ Fail with invalid coordinates
- ✓ Fail without any location data

**POST /api/users/geocode**
- ✓ Geocode address successfully
- ✓ Fail with empty address

**POST /api/users/reverse-geocode**
- ✓ Reverse geocode coordinates successfully
- ✓ Fail with invalid coordinates

---

## Test Helpers

### Creating Test Data

```javascript
const { createTestUser, createTestSeller, createTestProduct } = require('./helpers');

// Create test user
const user = await createTestUser({
  email: 'test@example.com',
  password: 'password123',
  type: 'buyer'
});

// Create test seller
const seller = await createTestSeller();

// Create test product
const product = await createTestProduct(seller.id, {
  price: 85.00,
  days_already_used: 1
});
```

### Authentication in Tests

```javascript
const { loginUser, authenticatedRequest } = require('./helpers');

// Login and get session cookie
const cookies = await loginUser(app, user.email, user.plainPassword);

// Make authenticated request
const response = await request(app)
  .get('/api/users/profile')
  .set('Cookie', cookies);
```

### Cleanup

```javascript
const { clearTestData } = require('./helpers');

beforeEach(async () => {
  await clearTestData(); // Clears all test data between tests
});
```

## Test Database Management

### Automatic Setup
Tests automatically create and configure the test database on first run.

### Manual Reset
If you need to manually reset the test database:

```bash
# Connect to postgres
psql -U postgres

# Drop test database
DROP DATABASE IF EXISTS chenda_test;

# Tests will recreate it on next run
npm test
```

### View Test Data
```bash
psql -U postgres -d chenda_test

# Check data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM product_types; -- Should have 180
```

## Performance

Tests are designed to run quickly:
- **Average test duration:** 50-200ms
- **Total suite runtime:** ~10-15 seconds
- **Database operations:** <10ms per query

Geocoding tests (users.test.js) may take up to 1 second due to external API calls.

## Troubleshooting

### Tests Hanging
If tests don't complete, add `--forceExit`:
```bash
npm test -- --forceExit
```

### Database Connection Errors
1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify credentials in `.env.test`
3. Ensure `chenda_test` database can be created by your user

### Port Already in Use
Tests don't start a server on port 3001 (they test the app directly).
If you see port errors, stop the development server:
```bash
pkill -f "node app.js"
```

### Test Database Cleanup Issues
If tests fail with data constraint errors:
```bash
npm test -- --runInBand
```

This runs tests sequentially instead of in parallel.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgis/postgis:18-3.6
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: cd server && npm install
      
      - name: Run tests
        run: cd server && npm test
        env:
          DB_HOST: localhost
          DB_USER: postgres
          DB_PASSWORD: postgres
```

## Next Steps

After completing API tests:
- [ ] Add performance/load testing (Artillery)
- [ ] Add E2E tests with frontend (Playwright)
- [ ] Add contract testing for API consumers
- [ ] Set up continuous integration
- [ ] Add test coverage thresholds (>80%)

## Related Documentation

- [API Documentation](../docs/API_DOCUMENTATION.md) - API endpoint reference
- [Development Guide](../README.md) - Setup and development workflow
- [Database Schema](../migrations/README.md) - Database structure
