# Manual E2E Testing Guide

> **Purpose**: This document provides comprehensive manual testing procedures for verifying all end-to-end functionality of the Chenda application.

## Prerequisites

Before starting manual testing, ensure:

- ✅ Backend server is running on `http://localhost:3001`
- ✅ Frontend dev server is running on `http://localhost:3000`
- ✅ PostgreSQL database is running with test data seeded
- ✅ Rate limiting is disabled in `server/app.js` (for consistent testing)

---

## Test Suite 1: Authentication Flow

### Test 1.1: Complete Registration → Login → Logout → Re-login Cycle

**Objective**: Verify the full authentication lifecycle works correctly.

**Steps**:

1. **Navigate to Registration Page**
   - Open browser to `http://localhost:3000/register`
   - ✅ Verify registration form displays

2. **Register New User**
   - Fill in the following fields:
     - Name: `Test Buyer` (use unique name each test)
     - Email: `testbuyer_[timestamp]@example.com` (ensure unique)
     - Password: `TestPass123!`
     - Confirm Password: `TestPass123!`
   - Select user type: **Buyer** (click "Buy Fresh Products" option)
   - Check "I accept the Terms & Conditions" checkbox
   - Click **"Create Account"** button
   - ✅ Verify redirect to `/buyer` (buyer dashboard)
   - ✅ Verify user name appears in header/navigation

3. **Logout**
   - Click the logout button (top-right corner, logout icon)
   - ✅ Verify redirect to `/login` page
   - ✅ Verify no user information is visible

4. **Re-login with Same Credentials**
   - Fill in:
     - Email: (use the email from step 2)
     - Password: `TestPass123!`
   - Click **"Sign In"** button
   - ✅ Verify redirect to `/buyer` dashboard
   - ✅ Verify user name appears again

**Expected Results**:
- ✅ Registration creates account and logs user in automatically
- ✅ Logout clears session and redirects to login
- ✅ Re-login restores session successfully

---

### Test 1.2: Invalid Login Credentials

**Objective**: Verify authentication properly rejects invalid credentials.

**Steps**:

1. Navigate to `http://localhost:3000/login`
2. Enter invalid credentials:
   - Email: `invalid@example.com`
   - Password: `wrongpassword`
3. Click **"Sign In"**
4. ✅ Verify error message appears (e.g., "Invalid credentials", "Login failed")
5. ✅ Verify user remains on `/login` page
6. ✅ Verify no navigation to dashboard occurs

**Expected Results**:
- ✅ Invalid credentials are rejected
- ✅ Appropriate error message is displayed
- ✅ User cannot access protected routes

---

### Test 1.3: Protected Route Access

**Objective**: Verify unauthenticated users cannot access protected routes.

**Steps**:

1. **Ensure logged out** (open incognito/private window or clear cookies)
2. **Try accessing buyer dashboard**:
   - Navigate to `http://localhost:3000/buyer`
   - ✅ Verify automatic redirect to `/login`
3. **Try accessing seller dashboard**:
   - Navigate to `http://localhost:3000/seller/dashboard`
   - ✅ Verify automatic redirect to `/login`
4. **Try accessing orders page**:
   - Navigate to `http://localhost:3000/buyer/orders`
   - ✅ Verify automatic redirect to `/login`

**Expected Results**:
- ✅ All protected routes redirect to login when not authenticated
- ✅ No sensitive data is visible without authentication

---

### Test 1.4: Session Persistence Across Page Reloads

**Objective**: Verify user session persists after page refresh.

**Steps**:

1. Register and login as buyer (follow Test 1.1 steps 1-2)
2. ✅ Verify you're on `/buyer` dashboard
3. **Refresh the page** (F5 or Ctrl+R)
4. ✅ Verify you remain on `/buyer` dashboard
5. ✅ Verify user name still appears
6. ✅ Verify no redirect to login occurs

**Expected Results**:
- ✅ Session is maintained across page reloads
- ✅ User doesn't need to log in again

---

### Test 1.5: Different Account Types (Buyer vs Seller)

**Objective**: Verify both buyer and seller accounts work correctly.

**Steps**:

1. **Test Buyer Account**:
   - Register new user with type **"Buyer"**
   - ✅ Verify redirect to `/buyer`
   - ✅ Verify buyer-specific navigation (Search, Orders, Profile)
   - Logout

2. **Test Seller Account**:
   - Register new user with type **"Seller"**
   - ✅ Verify redirect to `/seller/dashboard` or `/seller/orders`
   - ✅ Verify seller-specific navigation (Dashboard, Products, Orders, Profile)
   - ✅ Verify "Add Product" button visible
   - Logout

3. **Test "Both" Account** (if implemented):
   - Register new user with type **"Both"**
   - ✅ Verify access to both buyer and seller features
   - ✅ Verify appropriate navigation based on context

**Expected Results**:
- ✅ Buyer accounts have buyer-specific interface
- ✅ Seller accounts have seller-specific interface
- ✅ Each user type redirects to appropriate dashboard

---

### Test 1.6: Duplicate Email Registration

**Objective**: Verify system prevents duplicate email registration.

**Steps**:

1. Register a new user with email `duplicate@test.com`
2. Logout
3. Attempt to register again with the **same email**:
   - Name: `Different Name`
   - Email: `duplicate@test.com` (same)
   - Password: `NewPassword123!`
   - Confirm Password: `NewPassword123!`
   - Select user type and accept terms
4. Click **"Create Account"**
5. ✅ Verify error message appears (e.g., "Email already exists", "Account already registered")
6. ✅ Verify registration is rejected
7. ✅ Verify user remains on `/register` page

**Expected Results**:
- ✅ Duplicate emails are rejected
- ✅ Clear error message is shown
- ✅ Existing account is not overwritten

---

## Test Suite 2: Buyer Journey

### Test 2.1: Complete Buyer Flow (Search → View → Checkout)

**Objective**: Verify the complete buyer experience from search to order completion.

**Steps**:

#### Part A: Registration and Initial Setup

1. Register new buyer account (see Test 1.1)
2. ✅ Verify arrival at `/buyer` dashboard
3. ✅ Verify search form is visible

#### Part B: Product Search

4. **Perform product search**:
   - Enter location/address in search field (e.g., "Quezon City")
   - Adjust preferences (optional):
     - Proximity weight slider
     - Freshness weight slider
     - Max radius slider
   - Click **"Search"** button
5. ✅ Verify loading indicator appears
6. ✅ Verify product cards/list displays
7. ✅ Verify each product shows:
   - Product name and image
   - Price
   - Freshness score
   - Distance from you
   - Combined score (if applicable)
8. ✅ Verify products can be sorted (by score, price, distance, freshness)

#### Part C: View Product Details

9. **Click on a product card**
10. ✅ Verify product detail modal/page opens
11. ✅ Verify detailed information shows:
    - Product name and description
    - Price per unit
    - Available quantity
    - Freshness score and days since harvest
    - Estimated shelf life
    - Storage condition
    - Distance from buyer
    - Seller information
12. ✅ Verify **"Add to Cart"** button is visible

#### Part D: Add to Cart

13. **Add product to cart**:
    - Select quantity (if quantity selector exists)
    - Click **"Add to Cart"** button
14. ✅ Verify success toast/notification appears
15. ✅ Verify cart icon updates with item count
16. Close product detail modal (if applicable)

#### Part E: View Cart

17. **Navigate to cart**:
    - Click cart icon in header OR
    - Navigate to `/cart` or `/buyer/cart`
18. ✅ Verify cart page displays
19. ✅ Verify cart contains added product(s)
20. ✅ Verify cart shows:
    - Product details (name, price, quantity)
    - Subtotal per item
    - Total amount
    - Quantity adjustment controls
    - Remove item button
21. **Test quantity adjustment** (optional):
    - Increase quantity
    - ✅ Verify total price updates
    - Decrease quantity
    - ✅ Verify total price updates

#### Part F: Checkout

22. **Proceed to checkout**:
    - Click **"Proceed to Checkout"** or **"Checkout"** button
23. ✅ Verify redirect to checkout page (`/checkout`)
24. **Fill checkout form**:
    - Delivery address (if required)
    - Contact phone number
    - Payment method:
      - Select **"Cash on Delivery"**
      - OR select **"GCash"** (test mock payment)
25. ✅ Verify order summary displays:
    - Items in order
    - Subtotal
    - Delivery fee (if applicable)
    - Total amount
26. **Place order**:
    - Click **"Place Order"** or **"Confirm Order"** button
27. ✅ Verify redirect to order confirmation page (`/buyer/orders/[orderId]`)
28. ✅ Verify order confirmation shows:
    - Order ID/number
    - Order status (e.g., "Pending", "Confirmed")
    - Items ordered
    - Total amount paid
    - Payment method
    - Delivery address
    - Estimated delivery date/time

#### Part G: View Order History

29. **Navigate to orders page**:
    - Click **"Orders"** in bottom navigation
30. ✅ Verify redirect to `/buyer/orders`
31. ✅ Verify order list displays
32. ✅ Verify the recent order appears in the list
33. **Click on the order** to view details
34. ✅ Verify order detail page shows complete information

**Expected Results**:
- ✅ Complete buyer flow works end-to-end
- ✅ Products can be searched and filtered by Chenda algorithm
- ✅ Cart functionality works (add, update, remove)
- ✅ Checkout creates order successfully
- ✅ Order appears in order history

---

### Test 2.2: Search with Different Parameters

**Objective**: Verify search algorithm respects user preferences.

**Steps**:

1. Login as buyer
2. **Test proximity-focused search**:
   - Set Proximity Weight to **80%**
   - Set Freshness Weight to **20%**
   - Set Max Radius to **10 km**
   - Perform search
   - ✅ Verify closer products appear first
   - ✅ Verify distance values are low

3. **Test freshness-focused search**:
   - Set Proximity Weight to **20%**
   - Set Freshness Weight to **80%**
   - Set Max Radius to **50 km**
   - Perform search
   - ✅ Verify fresher products (higher freshness score) appear first
   - ✅ Verify products may be farther away

4. **Test balanced search**:
   - Set both weights to **50%**
   - Perform search
   - ✅ Verify products are balanced between proximity and freshness

**Expected Results**:
- ✅ Weight sliders affect product ranking
- ✅ Algorithm combines proximity and freshness correctly
- ✅ Max radius filters out distant products

---

### Test 2.3: Empty Cart State

**Objective**: Verify cart handles empty state gracefully.

**Steps**:

1. Login as buyer
2. Navigate to `/cart` or `/buyer/cart`
3. **If cart has items, remove all items**
4. ✅ Verify empty state message displays (e.g., "Your cart is empty")
5. ✅ Verify "Continue Shopping" or similar CTA button appears
6. Click the CTA button
7. ✅ Verify redirect to products/search page

**Expected Results**:
- ✅ Empty cart shows appropriate message
- ✅ User can easily return to shopping

---

### Test 2.4: Update Product Quantity in Cart

**Objective**: Verify cart quantity adjustments work correctly.

**Steps**:

1. Login as buyer and add a product to cart
2. Navigate to cart
3. **Increase quantity**:
   - Click "+" or increment button
   - ✅ Verify quantity increases by 1
   - ✅ Verify subtotal updates correctly
   - ✅ Verify total updates correctly
4. **Decrease quantity**:
   - Click "-" or decrement button
   - ✅ Verify quantity decreases by 1
   - ✅ Verify subtotal updates correctly
5. **Set quantity to 0 or remove item**:
   - Decrease to 0 OR click "Remove" button
   - ✅ Verify item is removed from cart
   - ✅ Verify cart updates appropriately

**Expected Results**:
- ✅ Quantity changes reflected immediately
- ✅ Price calculations are accurate
- ✅ Items can be removed

---

### Test 2.5: Empty Order History

**Objective**: Verify orders page handles empty state.

**Steps**:

1. Register brand new buyer account
2. Navigate to `/buyer/orders`
3. ✅ Verify empty state message displays
4. ✅ Verify message encourages user to start shopping
5. ✅ Verify CTA button to browse products (if exists)

**Expected Results**:
- ✅ Empty orders page is user-friendly
- ✅ Clear guidance for new users

---

## Test Suite 3: Seller Journey

### Test 3.1: Complete Seller Flow (Register → Add Product → Manage)

**Objective**: Verify the complete seller experience from registration to product management.

**Steps**:

#### Part A: Seller Registration

1. Navigate to `http://localhost:3000/register`
2. **Register as seller**:
   - Name: `Test Seller [timestamp]`
   - Email: `testseller_[timestamp]@example.com`
   - Password: `TestPass123!`
   - Confirm Password: `TestPass123!`
   - Select user type: **Seller** (click "Sell Fresh Products" option)
   - Check terms checkbox
   - Click **"Create Account"**
3. ✅ Verify redirect to `/seller/dashboard` or `/seller/orders`
4. ✅ Verify seller interface displays:
   - Dashboard tab/link
   - Products tab/link
   - Orders tab/link
   - Profile tab/link
5. ✅ Verify **"Add Product"** button is visible

#### Part B: Navigate to Add Product

6. **Click "Add Product"** button (or navigate to Products → Add Product)
7. ✅ Verify redirect to `/seller/products/add`
8. ✅ Verify product form displays with fields:
   - Product Type (dropdown/autocomplete)
   - Price
   - Quantity
   - Unit (kg, pcs, etc.)
   - Days Since Harvest / Days Already Used
   - Storage Condition (dropdown)
   - Description (text area)

#### Part C: Create New Product

9. **Fill product form**:
   - Product Type: **"Tomatoes"** (select from dropdown)
   - Price: **50**
   - Quantity: **10**
   - Unit: **kg**
   - Days Already Used: **2**
   - Storage Condition: **"Refrigerated"** (if applicable)
   - Description: **"Fresh organic tomatoes from local farm"**
10. ✅ Verify form validation works (try submitting empty form)
11. **Submit the form**:
    - Click **"Add Product"** or **"Create Product"** button
12. ✅ Verify success toast/notification appears
13. ✅ Verify redirect to `/seller/products` (product list page)

#### Part D: View Products List

14. ✅ Verify products list page displays
15. ✅ Verify the newly created product appears
16. ✅ Verify product information is correct:
    - Product name: "Tomatoes"
    - Price: "₱50"
    - Quantity: "10 kg"
    - Freshness score (calculated)
    - Estimated shelf life
17. ✅ Verify **"Edit"** button/link is visible for the product
18. ✅ Verify **"Delete"** button/link is visible (if applicable)

#### Part E: Edit Product

19. **Click "Edit"** button on the product
20. ✅ Verify redirect to `/seller/products/[id]/edit`
21. ✅ Verify form is pre-filled with existing data
22. **Modify the product**:
    - Change Price from **50** to **55**
    - Update Description (optional)
23. **Save changes**:
    - Click **"Update Product"** or **"Save Changes"** button
24. ✅ Verify success notification appears
25. ✅ Verify redirect back to `/seller/products`
26. ✅ Verify updated price "₱55" now displays
27. ✅ Verify other changes are reflected

#### Part F: View Seller Orders

28. **Navigate to Orders**:
    - Click **"Orders"** tab in bottom navigation
29. ✅ Verify redirect to `/seller/orders`
30. ✅ Verify orders page loads (likely empty state for new seller)
31. ✅ Verify page shows:
    - Empty state message OR
    - List of incoming orders (if any exist)
32. If orders exist:
    - ✅ Verify order details display (buyer name, products, total, status)
    - ✅ Verify order status can be updated (Pending → Preparing → Ready, etc.)

#### Part G: View Seller Dashboard

33. **Navigate to Dashboard**:
    - Click **"Dashboard"** tab (if available)
34. ✅ Verify redirect to `/seller/dashboard`
35. ✅ Verify dashboard displays analytics:
    - Total products listed
    - Active/available products
    - Total orders (if any)
    - Revenue/earnings (if applicable)
36. ✅ Verify quick action buttons:
    - "Add Product"
    - "View All Products"

**Expected Results**:
- ✅ Seller can register and access seller interface
- ✅ Products can be created with full details
- ✅ Products can be edited and updated
- ✅ Product list displays all seller's products
- ✅ Orders page is accessible
- ✅ Dashboard shows relevant metrics

---

### Test 3.2: Product Form Validation

**Objective**: Verify product form properly validates inputs.

**Steps**:

1. Login as seller
2. Navigate to `/seller/products/add`
3. **Test required fields**:
   - Leave all fields empty
   - Click **"Add Product"**
   - ✅ Verify validation errors appear for required fields
4. **Test price validation**:
   - Enter negative price: **-10**
   - ✅ Verify error appears
   - Enter zero price: **0**
   - ✅ Verify error or warning appears
   - Enter valid price: **50**
   - ✅ Verify error clears
5. **Test quantity validation**:
   - Enter negative quantity: **-5**
   - ✅ Verify error appears
   - Enter zero quantity: **0**
   - ✅ Verify warning or error appears
6. **Test days used validation**:
   - Enter negative days: **-1**
   - ✅ Verify error appears
   - Enter unrealistically high days: **365**
   - ✅ Verify warning appears (product would be spoiled)

**Expected Results**:
- ✅ All required fields are enforced
- ✅ Numeric fields have proper min/max constraints
- ✅ Validation messages are clear and helpful

---

### Test 3.3: Delete Product

**Objective**: Verify sellers can delete their products.

**Steps**:

1. Login as seller
2. Create a test product (follow Test 3.1 Part C)
3. Navigate to `/seller/products`
4. **Locate the test product**
5. **Click "Delete"** button (if available)
6. ✅ Verify confirmation dialog appears (e.g., "Are you sure?")
7. **Confirm deletion**
8. ✅ Verify success notification appears
9. ✅ Verify product is removed from list
10. **Refresh the page**
11. ✅ Verify product remains deleted (not in list)

**Expected Results**:
- ✅ Products can be deleted
- ✅ Deletion requires confirmation
- ✅ Deleted products are permanently removed

---

### Test 3.4: Product Availability Toggle

**Objective**: Verify sellers can mark products as available/unavailable.

**Steps**:

1. Login as seller with existing products
2. Navigate to `/seller/products`
3. **Locate an active product**
4. **Toggle availability**:
   - Click toggle/switch to mark as "Unavailable"
   - ✅ Verify product status updates
   - ✅ Verify visual indicator changes (grayed out, badge, etc.)
5. **Toggle back to available**:
   - Click toggle/switch again
   - ✅ Verify product is marked "Available" again

**Expected Results**:
- ✅ Availability can be toggled easily
- ✅ Status changes are persisted
- ✅ Visual feedback is clear

---

### Test 3.5: Empty Products List

**Objective**: Verify products page handles empty state.

**Steps**:

1. Register brand new seller account
2. Navigate to `/seller/products`
3. ✅ Verify empty state message displays
4. ✅ Verify message encourages adding first product
5. ✅ Verify **"Add Product"** CTA button is prominent

**Expected Results**:
- ✅ Empty state is welcoming for new sellers
- ✅ Clear guidance to add first product

---

## Test Suite 4: Profile & Settings

### Test 4.1: Update Profile Information

**Objective**: Verify users can update their profile.

**Steps**:

1. Login as any user (buyer or seller)
2. Navigate to **Profile** page (`/buyer/profile` or `/seller/profile`)
3. ✅ Verify profile form displays with current information
4. **Update profile**:
   - Change Name to **"Updated Name"**
   - Update Address (if applicable)
   - Click **"Save Changes"** button
5. ✅ Verify success notification appears
6. ✅ Verify updated name displays in header/navigation
7. **Refresh the page**
8. ✅ Verify changes persist

**Expected Results**:
- ✅ Profile can be updated
- ✅ Changes are saved permanently
- ✅ UI updates reflect changes

---

### Test 4.2: Update Location (Buyer)

**Objective**: Verify buyers can update their location for search.

**Steps**:

1. Login as buyer
2. Navigate to Profile → **Location** tab
3. ✅ Verify map component displays (if implemented)
4. **Update location**:
   - Either: Click on map to select location
   - Or: Enter address in search field
   - ✅ Verify location marker updates on map
5. **Save location**:
   - Click **"Save Location"** button
6. ✅ Verify success notification
7. Navigate back to search page
8. ✅ Verify new location is used for search by default

**Expected Results**:
- ✅ Location can be updated via map or address
- ✅ Location setting persists across sessions
- ✅ Search uses updated location

---

### Test 4.3: Update Algorithm Preferences (Buyer)

**Objective**: Verify buyers can save algorithm preferences.

**Steps**:

1. Login as buyer
2. Navigate to Profile → **Preferences** tab
3. ✅ Verify preference sliders display:
   - Proximity Weight
   - Freshness Weight
   - Max Radius
   - Min Freshness Score (if applicable)
4. **Adjust preferences**:
   - Set Proximity Weight to **70%**
   - Set Freshness Weight to **30%**
   - Set Max Radius to **25 km**
5. **Save preferences**:
   - Click **"Save Preferences"** button
6. ✅ Verify success notification appears
7. Navigate to search page
8. ✅ Verify sliders are pre-set to saved preferences

**Expected Results**:
- ✅ Preferences can be customized
- ✅ Saved preferences apply to future searches
- ✅ Preferences persist across sessions

---

### Test 4.4: Change Password (Security Tab)

**Objective**: Verify users can change their password.

**Steps**:

1. Login as any user
2. Navigate to Profile → **Security** tab
3. ✅ Verify password change form displays
4. **Change password**:
   - Current Password: (enter current password)
   - New Password: **"NewTestPass123!"**
   - Confirm New Password: **"NewTestPass123!"**
   - Click **"Update Password"** button
5. ✅ Verify success notification appears
6. **Logout**
7. **Login with new password**:
   - Email: (your email)
   - Password: **"NewTestPass123!"**
8. ✅ Verify login succeeds

**Expected Results**:
- ✅ Password can be changed
- ✅ Old password is required for verification
- ✅ New password works for login

---

## Test Suite 5: Edge Cases & Error Handling

### Test 5.1: Network Errors

**Objective**: Verify app handles network errors gracefully.

**Steps**:

1. Login to application
2. **Stop the backend server** (kill `npm start` in server folder)
3. **Attempt an action** (e.g., search products, view orders)
4. ✅ Verify error message displays (e.g., "Network error", "Unable to connect")
5. ✅ Verify app doesn't crash
6. ✅ Verify loading state resolves
7. **Restart backend server**
8. **Retry the action**
9. ✅ Verify action now succeeds

**Expected Results**:
- ✅ Network errors are caught and displayed
- ✅ App remains functional after errors
- ✅ Retry logic works

---

### Test 5.2: Session Expiration

**Objective**: Verify app handles expired sessions.

**Steps**:

1. Login to application
2. **Manually clear session cookie**:
   - Open browser DevTools → Application/Storage
   - Delete `connect.sid` cookie
3. **Attempt to navigate to protected route** (e.g., `/buyer/orders`)
4. ✅ Verify automatic redirect to `/login`
5. ✅ Verify error message about session expiration (optional)

**Expected Results**:
- ✅ Expired sessions redirect to login
- ✅ User must re-authenticate

---

### Test 5.3: Browser Back/Forward Navigation

**Objective**: Verify app handles browser navigation correctly.

**Steps**:

1. Login as buyer
2. Navigate through pages: Search → Product Detail → Cart → Checkout
3. **Click browser back button** several times
4. ✅ Verify each page loads correctly
5. ✅ Verify no errors occur
6. **Click browser forward button**
7. ✅ Verify navigation works forward as well

**Expected Results**:
- ✅ Browser navigation works smoothly
- ✅ State is preserved appropriately
- ✅ No broken pages

---

### Test 5.4: Concurrent User Sessions

**Objective**: Verify multiple users can use the app simultaneously.

**Steps**:

1. Open **Browser Window 1**: Login as Buyer
2. Open **Browser Window 2** (incognito): Login as Seller
3. **In Browser 1** (Buyer):
   - Search for products
   - Add product to cart
4. **In Browser 2** (Seller):
   - View products list
   - Edit a product
5. ✅ Verify both sessions work independently
6. ✅ Verify no session conflicts
7. ✅ Verify actions in one session don't affect the other

**Expected Results**:
- ✅ Multiple concurrent sessions work correctly
- ✅ No session interference
- ✅ Changes are user-specific

---

## Test Suite 6: Mobile Responsiveness

### Test 6.1: Mobile Layout

**Objective**: Verify app is usable on mobile devices.

**Steps**:

1. Open browser DevTools
2. **Enable device emulation** (e.g., iPhone 12, Galaxy S20)
3. Navigate through key pages:
   - Login/Register
   - Buyer dashboard
   - Product search
   - Product details
   - Cart
   - Checkout
   - Seller dashboard
   - Add product form
4. ✅ Verify all pages are responsive
5. ✅ Verify bottom navigation is accessible
6. ✅ Verify touch targets are appropriately sized
7. ✅ Verify no horizontal scrolling
8. ✅ Verify modals/dialogs fit screen

**Expected Results**:
- ✅ App is fully functional on mobile
- ✅ Layout adapts appropriately
- ✅ Navigation is mobile-friendly

---

### Test 6.2: Touch Interactions

**Objective**: Verify touch gestures work on mobile.

**Steps**:

1. Enable mobile device emulation
2. **Test scrolling**:
   - Scroll product lists
   - ✅ Verify smooth scrolling
3. **Test tap interactions**:
   - Tap buttons
   - Tap product cards
   - ✅ Verify touch responses
4. **Test forms**:
   - Focus input fields
   - Use number keyboards (for price/quantity)
   - ✅ Verify appropriate keyboards appear

**Expected Results**:
- ✅ Touch interactions are smooth
- ✅ Mobile keyboards appear correctly
- ✅ Gestures work as expected

---

## Quick Smoke Test Checklist

For rapid verification after deployments or major changes:

### Authentication (2 minutes)
- [ ] Register new user → redirects to appropriate dashboard
- [ ] Logout → redirects to login
- [ ] Login again → redirects to dashboard

### Buyer Flow (3 minutes)
- [ ] Search products → results display
- [ ] Click product → details modal opens
- [ ] Add to cart → cart count updates
- [ ] View cart → products listed
- [ ] Checkout → order created

### Seller Flow (3 minutes)
- [ ] Navigate to Add Product page
- [ ] Fill form and create product → success
- [ ] View products list → new product appears
- [ ] Edit product → changes saved

### Profile (1 minute)
- [ ] Update profile name → saves successfully
- [ ] Change password → works on next login

**Total Time: ~10 minutes**

---

## Testing Completion Checklist

Use this to track testing progress:

### Authentication Tests
- [ ] Test 1.1: Complete auth cycle
- [ ] Test 1.2: Invalid credentials
- [ ] Test 1.3: Protected routes
- [ ] Test 1.4: Session persistence
- [ ] Test 1.5: Account types
- [ ] Test 1.6: Duplicate email

### Buyer Tests
- [ ] Test 2.1: Complete buyer flow
- [ ] Test 2.2: Search parameters
- [ ] Test 2.3: Empty cart
- [ ] Test 2.4: Quantity updates
- [ ] Test 2.5: Empty orders

### Seller Tests
- [ ] Test 3.1: Complete seller flow
- [ ] Test 3.2: Form validation
- [ ] Test 3.3: Delete product
- [ ] Test 3.4: Availability toggle
- [ ] Test 3.5: Empty products

### Profile Tests
- [ ] Test 4.1: Update profile
- [ ] Test 4.2: Update location
- [ ] Test 4.3: Algorithm preferences
- [ ] Test 4.4: Change password

### Edge Cases
- [ ] Test 5.1: Network errors
- [ ] Test 5.2: Session expiration
- [ ] Test 5.3: Browser navigation
- [ ] Test 5.4: Concurrent sessions

### Mobile Tests
- [ ] Test 6.1: Mobile layout
- [ ] Test 6.2: Touch interactions

---

## Bug Reporting Template

When you encounter a bug during testing, document it as follows:

```markdown
### Bug: [Brief Description]

**Severity**: Critical / High / Medium / Low

**Test**: [Which test this was found in]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots/Video**:
[Attach if available]

**Browser/Device**:
- Browser: Chrome 120
- OS: Windows 11
- Screen Size: 1920x1080

**Additional Notes**:
[Any other relevant information]
```

---

## Notes for Testers

- **Use unique emails**: For each test run, use unique email addresses (e.g., append timestamp)
- **Clear browser data**: Between test suites, clear cookies/localStorage to start fresh
- **Document issues**: Note any unexpected behavior, even if minor
- **Test on multiple browsers**: Chrome, Firefox, Safari, Edge
- **Test on real devices**: If possible, test on actual mobile devices, not just emulation
- **Check console**: Keep browser console open and note any errors

---

## Success Criteria

All tests should:
- ✅ Complete without errors
- ✅ Display appropriate feedback (success/error messages)
- ✅ Maintain data integrity
- ✅ Provide good user experience
- ✅ Work across different browsers
- ✅ Be responsive on mobile devices

---

*Last Updated: March 6, 2026*
