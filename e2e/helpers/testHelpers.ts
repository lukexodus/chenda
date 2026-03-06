/**
 * E2E Test Helpers
 * 
 * Reusable helper functions for common test actions
 */

import { Page, expect } from '@playwright/test';

/**
 * Generate unique test email
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${prefix}_${timestamp}_${random}@e2etest.com`;
}

/**
 * Generate test user data
 */
export function generateTestUser(type: 'buyer' | 'seller' | 'both' = 'buyer') {
  return {
    name: `Test ${type.charAt(0).toUpperCase() + type.slice(1)} ${Date.now()}`,
    email: generateTestEmail(type),
    password: 'Test123456!',
    type,
    location: {
      lat: 14.5995,
      lng: 120.9842,
      address: 'Quezon City, Metro Manila, Philippines'
    }
  };
}

/**
 * Register a new user through the UI
 */
export async function registerUser(
  page: Page,
  userData: { name: string; email: string; password: string; type: string }
) {
  await page.goto('/register');
  
  await page.fill('input[name="name"]', userData.name);
  await page.fill('input[name="email"]', userData.email);
  await page.fill('input[name="password"]', userData.password);
  await page.fill('input[name="confirmPassword"]', userData.password);
  
  // Select user type by clicking the label (which is connected via htmlFor to the radio input)
  await page.click(`label[for="${userData.type}"]`);
  
  // Accept terms - shadcn Checkbox is rendered as button[role="checkbox"]
  await page.getByRole('checkbox', { name: /accept the terms/i }).click();
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for redirect (either to buyer or seller dashboard)
  await page.waitForURL(/\/(buyer|seller)/, { timeout: 10000 });
  
  console.log(`✅ Registered user: ${userData.email}`);
}

/**
 * Login user through the UI
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string
) {
  await page.goto('/login');
  
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for redirect
  await page.waitForURL(/\/(buyer|seller)/, { timeout: 10000 });
  
  console.log(`✅ Logged in: ${email}`);
}

/**
 * Logout user through the UI
 */
export async function logoutUser(page: Page) {
  // Click user menu dropdown
  await page.click('[data-testid="user-menu"], button:has-text("Account")');
  
  // Click logout
  await page.click('text=Logout, text=Log out, text=Sign out');
  
  // Wait for redirect to login
  await page.waitForURL('/login', { timeout: 10000 });
  
  console.log('✅ Logged out');
}

/**
 * Perform product search
 */
export async function searchProducts(
  page: Page,
  options: {
    address?: string;
    proximityWeight?: number;
    freshnessWeight?: number;
    maxRadius?: number;
  } = {}
) {
  await page.goto('/buyer');
  
  // Fill search form
  if (options.address) {
    await page.fill('input[placeholder*="address"], input[placeholder*="location"]', options.address);
    await page.waitForTimeout(500); // Wait for autocomplete
  }
  
  // Adjust weights if provided
  if (options.proximityWeight !== undefined) {
    const slider = page.locator('input[type="range"]').first();
    await slider.fill(options.proximityWeight.toString());
  }
  
  // Click search button
  await page.click('button:has-text("Search")');
  
  // Wait for results
  await page.waitForSelector('[data-testid="product-card"], .product-card', { timeout: 15000 });
  
  console.log('✅ Search completed');
}

/**
 * Add product to cart
 */
export async function addToCart(page: Page, productIndex: number = 0) {
  // Click first product card to open details
  const productCards = page.locator('[data-testid="product-card"], .product-card');
  await productCards.nth(productIndex).click();
  
  // Wait for modal/detail view
  await page.waitForSelector('button:has-text("Add to Cart")', { timeout: 5000 });
  
  // Click add to cart
  await page.click('button:has-text("Add to Cart")');
  
  // Wait for confirmation (toast or cart update)
  await page.waitForTimeout(1000);
  
  console.log('✅ Added product to cart');
}

/**
 * Complete checkout process
 */
export async function completeCheckout(
  page: Page,
  paymentMethod: 'cash' | 'gcash' | 'card' = 'cash'
) {
  // Go to cart
  await page.goto('/buyer/cart');
  
  // Click checkout
  await page.click('button:has-text("Checkout"), button:has-text("Proceed")');
  
  // Wait for checkout page
  await page.waitForURL('/buyer/checkout', { timeout: 10000 });
  
  // Select payment method
  await page.click(`input[value="${paymentMethod}"]`);
  
  // Place order
  await page.click('button:has-text("Place Order")');
  
  // Wait for payment processing (mock 2-second delay)
  await page.waitForTimeout(3000);
  
  // Should redirect to order confirmation
  await page.waitForURL(/\/buyer\/orders\/\d+/, { timeout: 10000 });
  
  console.log(`✅ Checkout completed with ${paymentMethod}`);
}

/**
 * Create a new product (seller)
 */
export async function createProduct(
  page: Page,
  productData: {
    productType: string;
    price: number;
    quantity: number;
    unit: string;
    daysAlreadyUsed: number;
    description?: string;
  }
) {
  await page.goto('/seller/products/add');
  
  // Open product type combobox and search
  await page.click('button:has-text("Select product type")');
  await page.fill('input[placeholder*="Search"]', productData.productType);
  await page.waitForTimeout(500);
  
  // Click first result
  await page.click(`[role="option"]:has-text("${productData.productType}")`);
  
  // Fill form fields
  await page.fill('input[name="price"]', productData.price.toString());
  await page.fill('input[name="quantity"]', productData.quantity.toString());
  
  // Select unit
  await page.click('button:has-text("Select unit")');
  await page.click(`[role="option"]:has-text("${productData.unit}")`);
  
  await page.fill('input[name="days_already_used"]', productData.daysAlreadyUsed.toString());
  
  if (productData.description) {
    await page.fill('textarea[name="description"]', productData.description);
  }
  
  // Submit form
  await page.click('button[type="submit"]:has-text("Create")');
  
  // Wait for redirect to products list
  await page.waitForURL('/seller/products', { timeout: 10000 });
  
  console.log(`✅ Product created: ${productData.productType}`);
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, expectedText?: string) {
  const toast = page.locator('[role="alert"], .toast, [data-sonner-toast]').first();
  await toast.waitFor({ timeout: 5000 });
  
  if (expectedText) {
    await expect(toast).toContainText(expectedText);
  }
  
  console.log('✅ Toast notification appeared');
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check if we're on a protected route
    const url = page.url();
    return url.includes('/buyer') || url.includes('/seller');
  } catch {
    return false;
  }
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `e2e/screenshots/${name}_${timestamp}.png`, fullPage: true });
  console.log(`📸 Screenshot saved: ${name}_${timestamp}.png`);
}
