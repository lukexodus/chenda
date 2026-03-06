# Chenda E2E Testing Guide

End-to-end testing for the Chenda fresh marketplace platform using Playwright.

## 📋 Overview

This directory contains E2E tests that verify complete user journeys across the frontend and backend:

- **Auth Flow**: Login → Logout → Login again
- **Buyer Journey**: Register → Search → View Product → Checkout
- **Seller Journey**: Register → Add Product → View Orders

## 🛠️ Prerequisites

Before running E2E tests, ensure:

1. **Backend server** is running on `http://localhost:3001`
2. **Frontend server** is running on `http://localhost:3000`
3. **PostgreSQL** is installed and accessible
4. **Development database** (chenda) exists with migrations and seeds

## 📁 Directory Structure

```
e2e/
├── auth-flow.spec.ts          # Authentication flow tests
├── buyer-journey.spec.ts      # Buyer user journey tests
├── seller-journey.spec.ts     # Seller user journey tests
├── helpers/
│   └── testHelpers.ts         # Reusable test helpers
├── setup/
│   └── database.ts            # Test database management
├── scripts/
│   ├── setup-db.js            # Setup test database
│   ├── teardown-db.js         # Remove test database
│   └── clean-data.js          # Clean test data
└── test-results/              # Generated test results
    ├── html/                  # HTML test report
    └── results.json           # JSON test results
```

## 🚀 Quick Start

### 1. Setup Test Database

Create and prepare the test database (separate from development):

```bash
npm run e2e:setup
```

This will:
- Create `chenda_e2e_test` database
- Enable PostGIS extension
- Run all migrations
- Seed product types (180 USDA items)

### 2. Start Servers

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
cd chenda-frontend
npm run dev
```

Wait for both servers to be fully started.

### 3. Run E2E Tests

**Run all tests (Chrome + Firefox):**
```bash
npm run e2e:test
```

**Run Chrome only:**
```bash
npm run e2e:test:chromium
```

**Run Firefox only:**
```bash
npm run e2e:test:firefox
```

**Run with browser visible (headed mode):**
```bash
npm run e2e:test:headed
```

**Debug mode (step through tests):**
```bash
npm run e2e:test:debug
```

### 4. View Test Report

```bash
npm run e2e:report
```

Opens an interactive HTML report with screenshots, videos, and traces.

### 5. Cleanup (Optional)

**Clean test data only (keeps schema):**
```bash
npm run e2e:clean
```

**Remove test database entirely:**
```bash
npm run e2e:teardown
```

## 📊 Test Coverage

### Auth Flow (6 tests)
- ✅ Complete auth cycle: Register → Login → Logout → Login
- ✅ Invalid login credentials rejection
- ✅ Protected route access prevention
- ✅ Session persistence across reloads
- ✅ Different account types (buyer/seller)
- ✅ Duplicate email registration error

### Buyer Journey (5 tests)
- ✅ Full journey: Register → Search → View → Checkout
- ✅ Search with different parameters
- ✅ Empty cart state
- ✅ Navigation between buyer pages
- ✅ Product freshness indicators

### Seller Journey (7 tests)
- ✅ Full journey: Register → Add Product → View Orders
- ✅ Product form validation
- ✅ Product deletion
- ✅ Navigation between seller pages
- ✅ Empty products state
- ✅ Product freshness warnings
- ✅ Profile updates

**Total: 18 E2E tests**

## 🎯 Test Philosophy

These E2E tests focus on **critical user paths** rather than exhaustive coverage:

- ✅ **Happy paths**: Test main user flows
- ✅ **Integration**: Test frontend + backend together
- ✅ **Real browser**: Test in Chrome and Firefox
- ❌ **Not unit tests**: Don't test individual functions
- ❌ **Not API tests**: Backend has separate Jest tests

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)

```typescript
{
  testDir: './e2e',
  timeout: 60000,               // 60s per test
  fullyParallel: false,         // Run tests sequentially
  workers: 1,                   // Single worker
  baseURL: 'http://localhost:3000',
  browsers: ['chromium', 'firefox']
}
```

### Test Database (`e2e/setup/database.ts`)

```javascript
{
  database: 'chenda_e2e_test',  // Separate test DB
  host: 'localhost',
  port: 5432,
  // Uses same credentials as dev database
}
```

## 📝 Writing New Tests

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { registerUser, generateTestUser } from '../helpers/testHelpers';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    const user = generateTestUser('buyer');
    
    await registerUser(page, user);
    await page.goto('/buyer');
    
    // Your test actions
    await page.click('button:has-text("Search")');
    
    // Assertions
    await expect(page).toHaveURL(/\/buyer/);
    await expect(page.locator('h1')).toContainText('Products');
  });
});
```

### Helper Functions

Common helpers available in `e2e/helpers/testHelpers.ts`:

```typescript
// User management
generateTestUser(type)           // Create test user data
registerUser(page, userData)     // Register through UI
loginUser(page, email, password) // Login through UI
logoutUser(page)                 // Logout through UI

// Buyer actions
searchProducts(page, options)    // Perform search
addToCart(page, productIndex)    // Add product to cart
completeCheckout(page, method)   // Complete checkout

// Seller actions
createProduct(page, productData) // Create product listing

// Utilities
waitForToast(page, text)         // Wait for notification
takeTimestampedScreenshot(page, name) // Debug screenshot
```

## 🐛 Debugging Tests

### 1. Run in Headed Mode

```bash
npm run e2e:test:headed
```

Watch the browser as tests run.

### 2. Use Debug Mode

```bash
npm run e2e:test:debug
```

Step through tests interactively with Playwright Inspector.

### 3. View Screenshots and Videos

After test failures:

```
e2e/test-results/
├── test-name-chromium/
│   ├── screenshot.png     # Failure screenshot
│   └── video.webm         # Test recording
└── trace.zip              # Detailed trace
```

### 4. Verbose Logs

Add console logs in tests:

```typescript
test('my test', async ({ page }) => {
  console.log('Current URL:', page.url());
  await page.screenshot({ path: 'debug.png' });
});
```

### 5. Check Test Database

Connect to test database to verify data:

```bash
psql -d chenda_e2e_test -U postgres

\dt                           # List tables
SELECT * FROM users;          # Check test users
SELECT * FROM products;       # Check test products
```

## 🔍 Troubleshooting

### Tests Fail with "Navigation timeout"

**Problem**: Page takes too long to load

**Solution**:
- Ensure both servers are running
- Check server logs for errors
- Increase timeout in test:

```typescript
await page.goto('/buyer', { timeout: 30000 });
```

### Database Connection Errors

**Problem**: Cannot connect to test database

**Solution**:
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check `.env` file in `server/` directory
- Ensure database user has CREATE DATABASE permission
- Run setup again: `npm run e2e:setup`

### Tests Pass Locally but Fail in CI

**Problem**: CI environment differences

**Solution**:
- Set `CI=true` environment variable
- Configure retries: `retries: process.env.CI ? 2 : 0`
- Use headless mode (default)

### "Element not found" Errors

**Problem**: Selectors don't match UI

**Solution**:
- Update selectors in helpers
- Use more flexible selectors:
  ```typescript
  // ❌ Fragile
  await page.click('button.specific-class');
  
  // ✅ Better
  await page.click('button:has-text("Search")');
  ```

### Flaky Tests

**Problem**: Tests sometimes pass, sometimes fail

**Solution**:
- Add explicit waits:
  ```typescript
  await page.waitForSelector('[data-testid="product"]');
  ```
- Wait for network: `await page.waitForLoadState('networkidle');`
- Increase timeouts for slow operations

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          npm install
          cd server && npm install
          cd ../chenda-frontend && npm install
      
      - name: Setup test database
        run: npm run e2e:setup
      
      - name: Start backend
        run: cd server && npm start &
      
      - name: Start frontend
        run: cd chenda-frontend && npm run dev &
      
      - name: Run E2E tests
        run: npm run e2e:test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: e2e/test-results/html
```

## 📚 Resources

- **Playwright Docs**: https://playwright.dev/docs/intro
- **Best Practices**: https://playwright.dev/docs/best-practices
- **Selectors Guide**: https://playwright.dev/docs/selectors
- **Debugging Guide**: https://playwright.dev/docs/debug

## 🤝 Contributing

When adding new E2E tests:

1. Follow existing test structure
2. Use helper functions for common actions
3. Add descriptive console logs for debugging
4. Test in both Chrome and Firefox
5. Clean up test data if needed
6. Update this README if adding new test suites

## 📄 License

ISC
