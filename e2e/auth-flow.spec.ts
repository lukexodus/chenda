/**
 * E2E Test: Authentication Flow
 * 
 * Tests: Login → Logout → Login again
 * 
 * This test verifies complete authentication lifecycle including:
 * - User registration
 * - Login with credentials
 * - Session persistence
 * - Logout functionality
 * - Re-login after logout
 */

import { test, expect } from '@playwright/test';
import { 
  generateTestUser, 
  registerUser, 
  loginUser, 
  logoutUser,
  isAuthenticated 
} from './helpers/testHelpers';

test.describe('Authentication Flow', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeEach(() => {
    // Generate unique test user for each test
    testUser = generateTestUser('buyer');
  });

  test('should complete full auth cycle: Register → Login → Logout → Login', async ({ page }) => {
    console.log('\n🧪 Starting Authentication Flow Test\n');

    // ===================================================================
    // STEP 1: Register new user
    // ===================================================================
    console.log('📝 STEP 1: Registering new user...');
    
    await registerUser(page, testUser);
    
    // Verify we're on buyer dashboard
    await expect(page).toHaveURL(/\/buyer/);
    expect(await isAuthenticated(page)).toBeTruthy();
    
    console.log('✅ Registration successful\n');

    // ===================================================================
    // STEP 2: Logout
    // ===================================================================
    console.log('🚪 STEP 2: Logging out...');
    
    await logoutUser(page);
    
    // Verify we're on login page
    await expect(page).toHaveURL('/login');
    expect(await isAuthenticated(page)).toBeFalsy();
    
    console.log('✅ Logout successful\n');

    // ===================================================================
    // STEP 3: Login again with same credentials
    // ===================================================================
    console.log('🔐 STEP 3: Logging in again...');
    
    await loginUser(page, testUser.email, testUser.password);
    
    // Verify we're back on buyer dashboard
    await expect(page).toHaveURL(/\/buyer/);
    expect(await isAuthenticated(page)).toBeTruthy();
    
    // Verify user info is displayed
    await expect(page.locator('body')).toContainText(testUser.name);
    
    console.log('✅ Re-login successful\n');

    console.log('✅ Authentication Flow Test PASSED\n');
  });

  test('should reject invalid login credentials', async ({ page }) => {
    console.log('\n🧪 Testing invalid login credentials\n');

    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should see error message
    await expect(page.locator('body')).toContainText(/invalid|incorrect|error/i);
    
    // Should still be on login page
    await expect(page).toHaveURL('/login');
    
    console.log('✅ Invalid credentials rejected correctly\n');
  });

  test('should prevent access to protected routes when not authenticated', async ({ page }) => {
    console.log('\n🧪 Testing protected route access\n');

    // Try to access buyer dashboard without authentication
    await page.goto('/buyer');
    
    // Should redirect to login
    await page.waitForURL('/login', { timeout: 5000 });
    await expect(page).toHaveURL('/login');
    
    // Try seller dashboard
    await page.goto('/seller/products');
    await page.waitForURL('/login', { timeout: 5000 });
    await expect(page).toHaveURL('/login');
    
    console.log('✅ Protected routes secured correctly\n');
  });

  test('should maintain session across page reloads', async ({ page }) => {
    console.log('\n🧪 Testing session persistence\n');

    // Register and login
    await registerUser(page, testUser);
    await expect(page).toHaveURL(/\/buyer/);
    
    // Reload page
    await page.reload();
    
    // Should still be authenticated
    await expect(page).toHaveURL(/\/buyer/);
    expect(await isAuthenticated(page)).toBeTruthy();
    
    console.log('✅ Session persisted across reload\n');
  });

  test('should handle both buyer and seller account types', async ({ page, context }) => {
    console.log('\n🧪 Testing different account types\n');

    // Test buyer account
    const buyer = generateTestUser('buyer');
    await registerUser(page, buyer);
    await expect(page).toHaveURL(/\/buyer/);
    await logoutUser(page);
    
    // Test seller account in new page
    const sellerPage = await context.newPage();
    const seller = generateTestUser('seller');
    await registerUser(sellerPage, seller);
    await expect(sellerPage).toHaveURL(/\/seller/);
    
    console.log('✅ Both account types work correctly\n');
  });

  test('should display proper error for registration with existing email', async ({ page }) => {
    console.log('\n🧪 Testing duplicate email registration\n');

    // Register first user
    await registerUser(page, testUser);
    await logoutUser(page);
    
    // Try to register again with same email
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Different Name');
    await page.fill('input[name="email"]', testUser.email); // Same email
    await page.fill('input[name="password"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');
    await page.click('input[value="buyer"]');
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    // Should see error about existing email
    await expect(page.locator('body')).toContainText(/already|exists|registered/i);
    
    console.log('✅ Duplicate email rejected correctly\n');
  });
});
