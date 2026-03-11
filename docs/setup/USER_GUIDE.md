# Chenda — User Guide

> This guide covers everything you need to use Chenda as a buyer or seller.

---

## Table of Contents

1. [Getting Started](#getting-started)
   - [Creating an Account](#creating-an-account)
   - [Logging In](#logging-in)
   - [Account Roles](#account-roles)
2. [Buyer Guide](#buyer-guide)
   - [Searching for Products](#searching-for-products)
   - [Understanding Search Results](#understanding-search-results)
   - [Viewing Product Details](#viewing-product-details)
   - [Using the Map View](#using-the-map-view)
   - [Shopping Cart](#shopping-cart)
   - [Checkout and Payment](#checkout-and-payment)
   - [Order History](#order-history)
3. [Seller Guide](#seller-guide)
   - [Adding a Product](#adding-a-product)
   - [Managing Your Products](#managing-your-products)
   - [Managing Orders](#managing-orders)
   - [Seller Analytics](#seller-analytics)
4. [Profile and Preferences](#profile-and-preferences)
   - [Updating Your Profile](#updating-your-profile)
   - [Setting Your Location](#setting-your-location)
   - [Algorithm Preferences](#algorithm-preferences)
   - [Changing Your Password](#changing-your-password)
5. [Test Accounts](#test-accounts)

---

## Getting Started

### Creating an Account

1. Navigate to `http://localhost:3000` in your browser.
2. Click **Register** on the login page.
3. Fill in the registration form:
   - **Full Name** — your display name
   - **Email address** — used to log in
   - **Password** — minimum 6 characters
   - **Account type** — choose one:
     - **Buyer** — browse and purchase products
     - **Seller** — list and sell products
     - **Both** — access both buyer and seller features
4. Click **Create Account**.

You will be redirected to your dashboard immediately after registration.

---

### Logging In

1. Go to `http://localhost:3000/login`.
2. Enter your **email** and **password**.
3. Check **Remember me** to stay logged in across browser sessions.
4. Click **Sign In**.

To log out, click your name in the top navigation and select **Logout**.

---

### Account Roles

| Role | What you can do |
|------|----------------|
| **Buyer** | Search products, view product details, add to cart, checkout, view orders |
| **Seller** | List products, upload images, manage orders, view analytics |
| **Both** | Full access to all buyer and seller features |

If you registered as a buyer but want to sell, you would need to register a new account with the seller or both role (role changes are not available after registration in the current version).

---

## Buyer Guide

### Searching for Products

The search page is your primary destination as a buyer. Access it from the **Search** tab at the bottom of the screen.

#### Setting your location

You have three options:

1. **Type an address** — enter any address in the Philippines into the location field. Suggestions will appear as you type; click one to select it.
2. **Use current location** — click the location button to use your device's GPS. Your browser will ask for permission.
3. **Use saved location** — if you have set a location in your profile, click **Use Saved Location** to apply it instantly.

#### Adjusting algorithm weights

Two sliders control how the Chenda algorithm ranks results:

- **Proximity weight** — how much distance matters (closer = higher rank)
- **Freshness weight** — how much remaining shelf life matters (fresher = higher rank)

The two weights always sum to 100%. Moving one slider automatically adjusts the other.

**Presets** (accessible from the preset buttons):

| Preset | Proximity | Freshness | Best for |
|--------|-----------|-----------|----------|
| Balanced | 50% | 50% | General use |
| Proximity-First | 70% | 30% | You want the nearest option |
| Freshness-First | 30% | 70% | You need the longest shelf life |

#### Advanced options

Click **Advanced Options** to reveal:

- **Max radius** — maximum search distance (5–100 km)
- **Min freshness score** — exclude products below this freshness threshold (0–100%)

Once your location and weights are set, click **Search**.

---

### Understanding Search Results

Each product card in the results grid shows:

| Element | Description |
|---------|-------------|
| **Rank badge** | Gold #1, Silver #2, Bronze #3 — the algorithm's ranking |
| **Freshness bar** | Green (≥75%) / Yellow (50–74%) / Red (<50%) |
| **Days remaining** | How many days of shelf life remain |
| **Distance** | Distance from your search location |
| **Score** | The combined algorithm score (0–100) |
| **Price** | Price per unit (e.g. ₱45.00/kg) |

Results are sorted by the combined algorithm score by default. Use the **Sort** controls above the grid to re-sort by price, distance, or freshness alone.

---

### Viewing Product Details

Click any product card to open the detail modal. It shows:

- Full product description
- Seller name and location
- Exact expiration date
- Storage condition requirement (room temperature / refrigerated / frozen)
- An interactive map centred on the seller's location
- **Add to Cart** button

---

### Using the Map View

Click the **Map** toggle above the results to switch from the grid to a map view. The map shows:

- **Blue marker** — your search location
- **Green markers** — fresh products (freshness ≥ 75%)
- **Yellow markers** — moderately fresh products (50–74%)
- **Red markers** — expiring soon (< 50%)
- **Grey radius circle** — your maximum search radius

Click any marker to see a popup with the product name, price, freshness score, and a link to view details.

Click **List** to return to the card grid.

---

### Shopping Cart

Click **Add to Cart** on any product card or in the product detail modal. The cart icon in the navigation updates to show the item count.

Access your cart from the **Cart** tab in the navigation. From the cart page you can:

- Adjust item quantities
- Remove individual items
- See the running subtotal
- Proceed to checkout

---

### Checkout and Payment

From the cart, click **Proceed to Checkout**.

The checkout page shows:

1. **Order summary** — items, quantities, prices, and total
2. **Delivery address** — pre-filled from your profile location; you can enter a different address
3. **Delivery notes** — optional instructions for the seller
4. **Payment method** — select one:
   - Cash on delivery
   - GCash
   - Credit / Debit Card

> ⚠️ **All payments are simulated.** No real transactions occur. This is a demonstration system.

Click **Place Order** to confirm. A payment processing animation runs for a few seconds, then you are directed to the order confirmation page showing your order ID and mock transaction reference.

---

### Order History

Access your past orders from the **Orders** tab in the navigation.

Each order shows:

- Order date and ID
- Product name and quantity
- Total amount
- Current status: **Pending → Paid → Completed** or **Cancelled**

Click any order to view the full detail, including payment method and status timeline.

Use the status filter tabs at the top (All / Pending / Paid / Completed / Cancelled) to narrow the list.

---

## Seller Guide

### Adding a Product

Go to **Products → Add Product** in the seller navigation.

Fill in the product form:

| Field | Description |
|-------|-------------|
| **Product type** | Choose from 180 USDA product categories; type to search |
| **Product name** | A descriptive name for your listing |
| **Price** | Price in Philippine Peso (₱) |
| **Unit** | kg, piece, bunch, pack, etc. |
| **Quantity available** | How many units you have |
| **Total shelf life (days)** | The product's full shelf life from harvest/production |
| **Days already used** | How many days of shelf life have already passed |
| **Storage condition** | Room temperature, refrigerated, or frozen |
| **Description** | Optional details about the product |
| **Image** | Upload a photo (JPEG/PNG/GIF/WebP, max 5 MB) |
| **Location** | Auto-filled from your profile; you can change it per listing |

Click **Add Product** to publish the listing. It will immediately appear in buyer search results.

> **Freshness tip**: The algorithm computes freshness as `(total_shelf_life - days_already_used) / total_shelf_life`. The more accurate these values are, the better ranked your fresh products will be.

---

### Managing Your Products

The **Products** page shows a table of all your listings with:

- Product name and image thumbnail
- Price and unit
- Stock quantity
- Freshness bar and days remaining
- A warning badge if the product expires within **3 days**
- Edit and Delete actions

#### Editing a product

Click **Edit** (pencil icon) on any row to open the edit form, pre-filled with existing values. Update any field and click **Save Changes**.

#### Deleting a product

Click **Delete** (trash icon). A confirmation dialog will appear before the product is removed.

---

### Managing Orders

Go to **Orders** in the seller navigation to see all orders placed for your products.

Each order row shows:

- Order date
- Buyer's name
- Product name and quantity
- Total amount
- Current status

#### Completing an order

Once you have fulfilled an order, click **Mark as Completed** on the order row. This updates the status to **Completed**, which the buyer can see in their order history.

Use the status filter tabs to view orders by status.

---

### Seller Analytics

The **Dashboard** page (home tab in seller navigation) shows key metrics:

| Metric | Description |
|--------|-------------|
| Active listings | Number of products currently listed |
| Total orders | Orders received across all products |
| Average freshness | Mean freshness score across your active listings |
| Expiring soon | Products with ≤ 3 days remaining |

Scroll down for a breakdown of your most listed product types and recent order activity.

---

## Profile and Preferences

Access your profile from the **Profile** tab in the navigation (bottom right).

### Updating Your Profile

The **Profile** tab on the profile page lets you update:

- Your display name
- Your email address

Click **Save Changes** to apply.

---

### Setting Your Location

The **Location** tab shows your current saved address and an interactive map marker.

To update:

1. Type a new address in the search field — suggestions appear as you type.
2. Click a suggestion to move the map marker to that location.
3. Alternatively, drag the marker on the map to fine-tune the exact position.
4. Click **Save Location**.

Your saved location is used as the default in the buyer search form.

---

### Algorithm Preferences

The **Preferences** tab (visible for buyer and both accounts) lets you set your default search configuration.

**Weight presets**: Click Balanced, Proximity-First, or Freshness-First to apply predefined weights.

**Custom weights**: Use the proximity and freshness sliders to set any combination that totals 100%.

**Other defaults**:

- **Default max radius** — default search distance when you open the search page
- **Default min freshness** — default minimum freshness threshold
- **Storage conditions** — check the storage types you have at home (room temperature, refrigerated, frozen); the search will prefer products that match

Click **Save Preferences** to apply. These values pre-fill the search form on your next search.

---

### Changing Your Password

The **Security** tab has a password change form:

1. Enter your **current password**.
2. Enter and confirm your **new password** (minimum 6 characters).
3. Click **Update Password**.

---

## Test Accounts

After running the seed script (`node seeds/seed.js`), these accounts are available immediately:

| Role | Email | Password |
|------|-------|----------|
| Buyer | `maria@test.com` | `password123` |
| Seller | `pedro@test.com` | `password123` |
| Both | `ana@test.com` | `password123` |

Additional seeded users follow the same `password123` password. See `seeds/mock_users.sql` for the full list.
