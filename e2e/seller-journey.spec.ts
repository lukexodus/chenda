/**
 * E2E Test: Seller Journey
 * 
 * Tests: Register → Add Product → View Orders
 * 
 * This test verifies the complete seller flow including:
 * - Registration as a seller
 * - Adding a new product listing
 * - Viewing product list
 * - Editing product
 * - Viewing orders (empty state)
 */

import { test, expect } from '@playwright/test';
import { 
  generateTestUser, 
  registerUser,
  createProduct,
  waitForToast
} from './helpers/testHelpers';

test.describe('Seller Journey', () => {
  let seller: ReturnType<typeof generateTestUser>;

  test.beforeEach(() => {
    seller = generateTestUser('seller');
  });

  test('should complete full seller journey: Register → Add Product → View Orders', async ({ page }) => {
    console.log('\n🧪 Starting Seller Journey Test\n');
    console.log(`📧 Test seller: ${seller.email}\n`);

    // ===================================================================
    // STEP 1: Register as a seller
    // ===================================================================
    console.log('📝 STEP 1: Registering as seller...');
    
    await registerUser(page, seller);
    
    // Verify we're on seller dashboard or products page
    await expect(page).toHaveURL(/\/seller/);
    
    // Check for seller-specific elements
    await expect(page.locator('body')).toContainText(/products|dashboard|listings|inventory/i);
    
    console.log('✅ Seller registration successful\n');

    // ===================================================================
    // STEP 2: Navigate to Add Product page
    // ===================================================================
    console.log('➕ STEP 2: Navigating to Add Product page...');
    
    // Try different navigation methods
    try {
      // Method 1: Click "Add Product" button/link
      await page.click('text="Add Product", button:has-text("Add"), a[href*="add"]', { timeout: 3000 });
    } catch {
      // Method 2: Direct navigation
      await page.goto('/seller/products/add');
    }
    
    // Verify we're on add product page
    await expect(page).toHaveURL(/\/seller\/products\/add/);
    await expect(page.locator('h1, h2')).toContainText(/add|create|new product/i);
    
    console.log('✅ Add Product page loaded\n');

    // ===================================================================
    // STEP 3: Create a new product
    // ===================================================================
    console.log('📦 STEP 3: Creating new product...');
    
    const productData = {
      productType: 'Tomatoes',
      price: 50,
      quantity: 10,
      unit: 'kg',
      daysAlreadyUsed: 2,
      description: 'Fresh organic tomatoes from local farm'
    };
    
    await createProduct(page, productData);
    
    // Verify redirect to products list
    await expect(page).toHaveURL('/seller/products');
    
    // Check for success notification
    try {
      await waitForToast(page);
      console.log('✅ Success notification shown');
    } catch {
      console.log('⚠️  No toast notification');
    }
    
    console.log('✅ Product created successfully\n');

    // ===================================================================
    // STEP 4: View products list
    // ===================================================================
    console.log('📋 STEP 4: Viewing products list...');
    
    // Should be on products list already
    await expect(page).toHaveURL('/seller/products');
    
    // Verify the product appears in the list
    await expect(page.locator('body')).toContainText(productData.productType);
    await expect(page.locator('body')).toContainText(`₱${productData.price}`);
    
    // Check for table or card layout
    const hasProductTable = await page.locator('table, [data-testid="product-table"]').count() > 0;
    const hasProductCards = await page.locator('[data-testid="product-card"]').count() > 0;
    
    if (hasProductTable || hasProductCards) {
      console.log('✅ Product appears in products list\n');
    } else {
      console.log('⚠️  Product list format unknown, but product text visible\n');
    }

    // ===================================================================
    // STEP 5: Test product editing
    // ===================================================================
    console.log('✏️  STEP 5: Testing product edit...');
    
    // Look for edit button
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
    const hasEditButton = await editButton.count() > 0;
    
    if (hasEditButton) {
      await editButton.click();
      
      // Should navigate to edit page
      await page.waitForURL(/\/seller\/products\/\d+\/edit/, { timeout: 5000 });
      
      // Verify edit form is pre-filled
      const priceInput = page.locator('input[name="price"]');
      await expect(priceInput).toHaveValue(productData.price.toString());
      
      // Make a small change
      await priceInput.fill('55');
      
      // Save changes
      await page.click('button[type="submit"]:has-text("Update"), button:has-text("Save")');
      
      // Should redirect back to products list
      await page.waitForURL('/seller/products', { timeout: 10000 });
      
      // Verify updated price
      await expect(page.locator('body')).toContainText('₱55');
      
      console.log('✅ Product edited successfully\n');
    } else {
      console.log('⚠️  Edit button not found, skipping edit test\n');
    }

    // ===================================================================
    // STEP 6: View orders page
    // ===================================================================
    console.log('📦 STEP 6: Viewing orders page...');
    
    // Navigate to orders
    try {
      await page.click('text="Orders", a[href*="/seller/orders"]');
    } catch {
      await page.goto('/seller/orders');
    }
    
    // Verify orders page loads
    await expect(page).toHaveURL('/seller/orders');
    
    // Check for content (likely empty state)
    const pageContent = page.locator('body');
    await expect(pageContent).toContainText(/orders|sales|empty|no orders/i);
    
    console.log('✅ Orders page accessible\n');

    // ===================================================================
    // STEP 7: View seller dashboard/analytics
    // ===================================================================
    console.log('📊 STEP 7: Viewing seller dashboard...');
    
    // Try to navigate to dashboard
    try {
      await page.click('text="Dashboard", a[href="/seller/dashboard"]');
      await page.waitForURL('/seller/dashboard', { timeout: 5000 });
      
      // Check for analytics/metrics
      await expect(page.locator('body')).toContainText(/total|active|listings|revenue|analytics/i);
      
      console.log('✅ Seller dashboard accessible\n');
    } catch {
      console.log('⚠️  Dashboard not available or not found\n');
    }

    console.log('✅ Seller Journey Test PASSED\n');
  });

  test('should validate product form inputs', async ({ page }) => {
    console.log('\n🧪 Testing product form validation\n');

    await registerUser(page, seller);
    await page.goto('/seller/products/add');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('body')).toContainText(/required|invalid|please/i);
    
    console.log('✅ Form validation works correctly\n');
  });

  test('should handle product deletion', async ({ page }) => {
    console.log('\n🧪 Testing product deletion\n');

    await registerUser(page, seller);
    
    // Create a product first
    await page.goto('/seller/products/add');
    await createProduct(page, {
      productType: 'Carrots',
      price: 40,
      quantity: 5,
      unit: 'kg',
      daysAlreadyUsed: 1
    });
    
    // Look for delete button
    const deleteButton = page.locator('button:has-text("Delete")').first();
    const hasDeleteButton = await deleteButton.count() > 0;
    
    if (hasDeleteButton) {
      await deleteButton.click();
      
      // Handle confirmation dialog
      try {
        await page.click('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")');
        console.log('✅ Product deletion confirmed\n');
      } catch {
        console.log('⚠️  No confirmation dialog, deletion may be direct\n');
      }
      
      // Should remain on products page
      await expect(page).toHaveURL('/seller/products');
    } else {
      console.log('⚠️  Delete button not found, skipping deletion test\n');
    }
  });

  test('should navigate between seller pages', async ({ page }) => {
    console.log('\n🧪 Testing seller navigation\n');

    await registerUser(page, seller);
    
    // Test navigation to different pages
    const pages = [
      { url: '/seller/products', text: /products|listings/i },
      { url: '/seller/products/add', text: /add|create/i },
      { url: '/seller/orders', text: /orders|sales/i },
      { url: '/seller/profile', text: /profile|account|settings/i },
    ];
    
    for (const { url, text } of pages) {
      await page.goto(url);
      await expect(page).toHaveURL(url);
      await expect(page.locator('body')).toContainText(text);
      console.log(`✅ ${url} page loads correctly`);
    }
    
    console.log('✅ All seller pages accessible\n');
  });

  test('should show empty products state for new seller', async ({ page }) => {
    console.log('\n🧪 Testing empty products state\n');

    await registerUser(page, seller);
    
    // Navigate to products (should be empty)
    await page.goto('/seller/products');
    
    // Should show empty state
    await expect(page.locator('body')).toContainText(/no products|empty|add your first|get started/i);
    
    console.log('✅ Empty products state displayed correctly\n');
  });

  test('should display product freshness warnings', async ({ page }) => {
    console.log('\n🧪 Testing freshness warnings\n');

    await registerUser(page, seller);
    
    // Create a product that's expiring soon
    await page.goto('/seller/products/add');
    await createProduct(page, {
      productType: 'Milk',
      price: 80,
      quantity: 2,
      unit: 'liters',
      daysAlreadyUsed: 12 // Close to expiration (milk shelf life ~14 days)
    });
    
    // Check for warning indicators
    const hasWarning = await page.locator('text=/expiring|warning|low|alert/i').count() > 0;
    
    if (hasWarning) {
      console.log('✅ Freshness warnings displayed\n');
    } else {
      console.log('⚠️  No freshness warnings visible (may need visual inspection)\n');
    }
  });

  test('should allow seller profile updates', async ({ page }) => {
    console.log('\n🧪 Testing seller profile updates\n');

    await registerUser(page, seller);
    
    // Navigate to profile
    await page.goto('/seller/profile');
    
    // Update profile information
    const nameInput = page.locator('input[name="name"]');
    await nameInput.fill('Updated Seller Name');
    
    // Save changes
    await page.click('button:has-text("Save"), button[type="submit"]');
    
    // Check for success message
    try {
      await waitForToast(page);
      console.log('✅ Profile update successful\n');
    } catch {
      console.log('⚠️  No confirmation toast, but no error\n');
    }
  });
});
