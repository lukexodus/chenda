# Component Catalog

Inventory of all React components in `chenda-frontend`, organized by domain. Each entry lists the component's purpose, its props interface, and the pages/components that use it.

---

## Table of Contents

1. [Auth Components](#1-auth-components)
2. [Buyer Components](#2-buyer-components)
3. [Product Components](#3-product-components)
4. [Order Components](#4-order-components)
5. [Cart Components](#5-cart-components)
6. [Payment Components](#6-payment-components)
7. [Seller Components](#7-seller-components)
8. [Profile Components](#8-profile-components)
9. [Map Components](#9-map-components)
10. [Layout Components](#10-layout-components)
11. [Provider Components](#11-provider-components)
12. [UI Primitives (shadcn/ui)](#12-ui-primitives-shadcnui)

---

## 1. Auth Components

### `LoginForm`
**File:** `src/components/auth/LoginForm.tsx`  
**Purpose:** Email/password login form with "Remember Me" checkbox. On success, redirects to `/seller/dashboard` (sellers) or `/buyer` (buyers).

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| *(none)* | — | — | All state is internal; pulls auth from `useAuthStore` |

**Used in:**
- `app/(auth)/login/page.tsx`

---

### `RegisterForm`
**File:** `src/components/auth/RegisterForm.tsx`  
**Purpose:** New user registration form. Collects name, email, password, and user type (`buyer` / `seller` / `both`).

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| *(none)* | — | — | All state is internal; pulls auth from `useAuthStore` |

**Used in:**
- `app/(auth)/register/page.tsx`

---

### `ProtectedRoute`
**File:** `src/components/auth/ProtectedRoute.tsx`  
**Purpose:** Route wrapper that redirects unauthenticated users to `/login`. Optionally enforces user-type restrictions.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | ✓ | Content to render if user is authenticated |
| `requiredType` | `"buyer" \| "seller" \| "both"` | — | Exact type the user must be |
| `allowedTypes` | `Array<"buyer" \| "seller" \| "both">` | — | Any one of these types is acceptable |

**Used in:**
- `app/(buyer)/layout.tsx`
- `app/seller/layout.tsx`

---

## 2. Buyer Components

### `SearchForm`
**File:** `src/components/buyer/SearchForm.tsx`  
**Purpose:** Main product search form for buyers. Supports address autocomplete, GPS geolocation, and advanced sliders for proximity/freshness weighting and search radius/min-freshness filters.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| *(none)* | — | — | All state driven by `useSearchStore` and `useAuthStore` |

**Internal dependencies:** `AddressAutocomplete`, `GeolocationButton`

**Used in:**
- `app/(buyer)/buyer/page.tsx`

---

## 3. Product Components

### `ProductCard`
**File:** `src/components/products/ProductCard.tsx`  
**Purpose:** Displays a single product in a card layout. Shows image, name, price, freshness progress bar, distance, and algorithm score with a rank badge. Includes an "Add to Cart" button that integrates with `useCartStore`.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `product` | `Product` | ✓ | Product data object from search store |
| `onViewDetails` | `(product: Product) => void` | — | Callback when the card is clicked |

**Used in:**
- `ProductGrid` (internal)

---

### `ProductDetail`
**File:** `src/components/products/ProductDetail.tsx`  
**Purpose:** Full-screen dialog showing detailed product info: image, description, seller contact, quantity selector, and a Leaflet map of the seller's location. Integrates with `useCartStore` for add/update cart.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `product` | `Product \| null` | ✓ | Product to display; `null` closes the dialog |
| `open` | `boolean` | ✓ | Controls dialog visibility |
| `onOpenChange` | `(open: boolean) => void` | ✓ | Called when dialog open state changes |

**Internal dependencies:** `ProductMap` (dynamically imported), `MapSkeleton`

**Used in:**
- `app/(buyer)/buyer/page.tsx` (dynamic import)

---

### `ProductGrid`
**File:** `src/components/products/ProductGrid.tsx`  
**Purpose:** Responsive grid that renders a list of `ProductCard` components. Shows `CardGridSkeleton` while loading and `NoResults` when the list is empty.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `products` | `Product[]` | ✓ | Array of products to display |
| `loading` | `boolean` | — | Shows skeleton loading state when `true` |
| `onProductClick` | `(product: Product) => void` | — | Forwarded to each `ProductCard` as `onViewDetails` |

**Internal dependencies:** `ProductCard`, `CardGridSkeleton`, `NoResults`

**Used in:**
- `app/(buyer)/buyer/page.tsx`

---

### `ProductMap`
**File:** `src/components/products/ProductMap.tsx`  
**Purpose:** Leaflet map showing the seller's location with a single pin marker. SSR-disabled (dynamically imported).

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `latitude` | `number` | ✓ | Seller latitude coordinate |
| `longitude` | `number` | ✓ | Seller longitude coordinate |
| `productName` | `string` | ✓ | Used as the marker tooltip label |

**Used in:**
- `ProductDetail` (dynamic import)

---

### `SortControls`
**File:** `src/components/products/SortControls.tsx`  
**Purpose:** Dropdown select for sorting search results. Options: Algorithm Score, Price Low→High, Price High→Low, Distance, Freshness. Displays the current result count.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `SortOption` | ✓ | Currently selected sort option |
| `onChange` | `(value: SortOption) => void` | ✓ | Called when sort selection changes |
| `resultCount` | `number` | — | Number of results shown next to the label |

**`SortOption` values:** `"score" \| "price_low" \| "price_high" \| "distance" \| "freshness"`

**Used in:**
- `app/(buyer)/buyer/page.tsx`

---

## 4. Order Components

### `OrderCard`
**File:** `src/components/orders/OrderCard.tsx`  
**Purpose:** Compact card summarising one order. Displays product image, name, order ID, status badge, date/time, quantity, price, and either buyer or seller name depending on `viewAs`. In buyer context it renders as a `<Link>`; in seller context it renders as a `<div>` that calls `onClick` to open a modal.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `order` | `Order` | ✓ | Order data object |
| `viewAs` | `"buyer" \| "seller"` | — | Determines which perspective fields to show (default: `"buyer"`) |
| `onClick` | `() => void` | — | Click handler used in seller context (renders div instead of Link) |

**Used in:**
- `app/(buyer)/buyer/orders/page.tsx`
- `app/seller/orders/page.tsx`

---

### `OrderDetail`
**File:** `src/components/orders/OrderDetail.tsx`  
**Purpose:** Detailed order view with a status timeline, product info, pricing breakdown, payment method, and delivery address. Adapts display based on `viewAs`.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `order` | `Order` | ✓ | Full order data object |
| `viewAs` | `"buyer" \| "seller"` | — | Controls which fields (buyer vs seller name) are shown (default: `"buyer"`) |

**Used in:**
- `app/(buyer)/orders/[id]/page.tsx`
- `app/seller/orders/page.tsx` (dynamic import in a modal)

---

## 5. Cart Components

### `CartSummary`
**File:** `src/components/cart/CartSummary.tsx`  
**Purpose:** Displays all items in the cart with quantity controls and subtotals. Reads from and writes to `useCartStore`. Shows an empty-state illustration when the cart has no items.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `showActions` | `boolean` | — | Shows ± quantity buttons and remove button (default: `true`) |
| `showCheckoutButton` | `boolean` | — | Shows the proceed-to-checkout button (default: `true`) |
| `onCheckout` | `() => void` | — | Called when the checkout button is pressed |

**Used in:**
- `app/(buyer)/cart/page.tsx`
- `app/(buyer)/checkout/page.tsx`

---

## 6. Payment Components

### `PaymentModal`
**File:** `src/components/payment/PaymentModal.tsx`  
**Purpose:** Dialog that simulates payment processing. Auto-starts when opened, transitions through `idle → processing → success/error` states, and calls `onSuccess` on completion. SSR-disabled (dynamically imported).

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✓ | Controls dialog visibility |
| `onClose` | `() => void` | ✓ | Called when dialog is dismissed |
| `orderId` | `number` | ✓ | ID of the order to pay |
| `paymentMethod` | `PaymentMethodOption` | ✓ | Selected payment method object |
| `totalAmount` | `number` | ✓ | Total amount to display during processing |
| `onSuccess` | `(orderId: number) => void` | — | Callback after successful payment |

**Used in:**
- `app/(buyer)/checkout/page.tsx` (dynamic import)

---

## 7. Seller Components

### `ProductForm`
**File:** `src/components/seller/ProductForm.tsx`  
**Purpose:** Create/Edit form for seller products. Collects product type (via `ProductTypeCombobox`), price, quantity, unit, shelf-life usage, description, storage condition, and image upload. Validates that the seller has set a location before allowing submission.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `product` | `SellerProduct` | — | Existing product data when editing |
| `isEdit` | `boolean` | — | Switches between create and edit mode (default: `false`) |

**Internal dependencies:** `ProductTypeCombobox`

**Used in:**
- `app/seller/products/add/page.tsx`
- `app/seller/products/[id]/edit/page.tsx`

---

### `ProductTable`
**File:** `src/components/seller/ProductTable.tsx`  
**Purpose:** Table listing all of a seller's products with columns for image thumbnail, product name, price, quantity, freshness bar, and an actions dropdown (Edit / Delete). Shows a skeleton loading state.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `products` | `SellerProduct[]` | ✓ | List of seller's products |
| `onEdit` | `(product: SellerProduct) => void` | ✓ | Called when Edit is selected from the dropdown |
| `onDelete` | `(product: SellerProduct) => void` | ✓ | Called when Delete is selected from the dropdown |
| `isLoading` | `boolean` | — | Shows skeleton rows when `true` |

**Used in:**
- `app/seller/products/page.tsx`

---

### `ProductTypeCombobox`
**File:** `src/components/seller/ProductTypeCombobox.tsx`  
**Purpose:** Searchable dialog/combobox for selecting a product type from the backend catalogue. Fetches all types on mount and filters them client-side.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `number` | — | Pre-selected product type ID (for edit mode) |
| `onSelect` | `(productType: ProductType) => void` | ✓ | Called with the full `ProductType` object when a type is chosen |
| `disabled` | `boolean` | — | Disables the trigger button |

**Used in:**
- `ProductForm` (internal)

---

### `SellerAnalytics`
**File:** `src/components/seller/SellerAnalytics.tsx`  
**Purpose:** Dashboard analytics panel. Computes and displays four metric cards from the seller's product list: Total Products, Average Freshness, Expiring Soon (< 3 days), and Expired Products.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `products` | `SellerProduct[]` | ✓ | Current seller product list to calculate metrics from |

**Used in:**
- `app/seller/dashboard/page.tsx` (dynamic import)

---

## 8. Profile Components

### `ProfileForm`
**File:** `src/components/profile/ProfileForm.tsx`  
**Purpose:** Tabbed profile management hub. Contains tabs for: Account (name, user type), Location (dynamically loaded `LocationSettings`), Preferences (`AlgorithmPreferences`), Security (`PasswordChangeForm`), and Logout.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | — | Additional content passed from parent |

**Internal dependencies:** `AlgorithmPreferences`, `PasswordChangeForm`, `LocationSettings` (dynamic import), `FormSkeleton`

**Used in:**
- `app/(buyer)/buyer/profile/page.tsx`
- `app/seller/profile/page.tsx`

---

### `AlgorithmPreferences`
**File:** `src/components/profile/AlgorithmPreferences.tsx`  
**Purpose:** Lets the user configure their product-search algorithm weights (proximity vs freshness), display mode (ranking/filter), search radius, minimum freshness threshold, and storage condition preferences.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| *(none)* | — | — | All state from `useAuthStore` |

**Internal dependencies:** `StoragePreference`

**Used in:**
- `ProfileForm` (internal)

---

### `LocationSettings`
**File:** `src/components/profile/LocationSettings.tsx`  
**Purpose:** Interactive Leaflet map for setting the user's home/delivery location. Supports address autocomplete, GPS geolocation, and draggable/clickable marker. SSR-disabled.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| *(none)* | — | — | All state from `useAuthStore` and `usersApi` |

**Internal dependencies:** `AddressAutocomplete`, `GeolocationButton`

**Used in:**
- `ProfileForm` (dynamic import)

---

### `PasswordChangeForm`
**File:** `src/components/profile/PasswordChangeForm.tsx`  
**Purpose:** Form for changing the authenticated user's password. Includes a real-time strength indicator and match validation.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| *(none)* | — | — | All state is internal; calls `/api/users/change-password` directly |

**Used in:**
- `ProfileForm` (internal)

---

### `StoragePreference`
**File:** `src/components/profile/StoragePreference.tsx`  
**Purpose:** Checkbox group for selecting the storage conditions the user can accommodate (`pantry`, `refrigerated`, `frozen`). Used as a sub-form inside `AlgorithmPreferences`.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string[]` | ✓ | Currently selected condition keys |
| `onChange` | `(value: string[]) => void` | ✓ | Called with updated selection when a checkbox is toggled |

**Used in:**
- `AlgorithmPreferences` (internal)

---

## 9. Map Components

### `AddressAutocomplete`
**File:** `src/components/maps/AddressAutocomplete.tsx`  
**Purpose:** Text input with debounced address suggestions from the Nominatim (OpenStreetMap) geocoding API. Supports keyboard navigation through suggestions.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | ✓ | Current input value |
| `onChange` | `(value: string) => void` | ✓ | Called on every keystroke |
| `onSelect` | `(lat: number, lng: number, address: string) => void` | ✓ | Called when a suggestion is chosen |
| `placeholder` | `string` | — | Input placeholder text (default: `"Enter address or location..."`) |
| `className` | `string` | — | Additional CSS classes for the wrapper |

**Used in:**
- `SearchForm`
- `LocationSettings`

---

### `GeolocationButton`
**File:** `src/components/maps/GeolocationButton.tsx`  
**Purpose:** Button that triggers the browser Geolocation API and passes the resulting coordinates to a callback. Shows a loading spinner while acquiring position.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onLocationFound` | `(lat: number, lng: number) => void` | ✓ | Called with coordinates on success |
| `variant` | `"default" \| "outline" \| "ghost" \| "secondary"` | — | Button visual variant (default: `"outline"`) |
| `size` | `"default" \| "sm" \| "lg" \| "icon"` | — | Button size (default: `"default"`) |
| `className` | `string` | — | Additional CSS classes |
| `showLabel` | `boolean` | — | Whether to show the text label (default: `true`) |

**Used in:**
- `SearchForm`
- `LocationSettings`
- `SearchResultsMap` (internal)

---

### `SearchResultsMap`
**File:** `src/components/maps/SearchResultsMap.tsx`  
**Purpose:** Full Leaflet map displaying all search result products as pins, the buyer's location, and an optional radius circle. Clicking a pin triggers `onMarkerClick`. SSR-disabled.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `products` | `Product[]` | ✓ | Products to plot as map markers |
| `buyerLocation` | `{ lat: number; lng: number }` | — | Buyer's position (shown as a distinct marker) |
| `searchRadius` | `number` | — | Radius circle in km (default: `50`) |
| `onMarkerClick` | `(product: Product) => void` | ✓ | Called when a product pin is clicked |
| `onLocationUpdate` | `(lat: number, lng: number) => void` | — | Called when the buyer moves their location on the map |
| `className` | `string` | — | Additional CSS classes for the map container |

**Internal dependencies:** `GeolocationButton`

**Used in:**
- `app/(buyer)/buyer/page.tsx` (referenced but toggled via map view toggle)

---

## 10. Layout Components

### `TopHeader`
**File:** `src/components/layout/navigation.tsx`  
**Purpose:** Sticky top app bar showing the Chenda logo, app name, and a cart item count badge for buyers. Includes a logout button.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| *(none)* | — | — | Reads from `useAuthStore` and `useCartStore` |

**Used in:**
- `app/(buyer)/buyer/page.tsx`
- `app/(buyer)/buyer/orders/page.tsx`
- `app/(buyer)/buyer/profile/page.tsx`
- `app/(buyer)/cart/page.tsx`
- `app/(buyer)/orders/[id]/page.tsx`
- `app/seller/layout.tsx`

---

### `BottomNav`
**File:** `src/components/layout/navigation.tsx`  
**Purpose:** Fixed bottom navigation bar. Shows buyer nav items (Search, Orders, Profile) for buyers and seller nav items (Dashboard, Products, Orders, Profile) for sellers.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| *(none)* | — | — | Reads user type from `useAuthStore`; uses `usePathname` for active state |

**Used in:**
- Same pages as `TopHeader`
- `app/seller/layout.tsx`

---

### `PageLoading`
**File:** `src/components/layout/states.tsx`  
**Purpose:** Full-viewport centered spinner for route-level loading states.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| *(none)* | — | — | — |

---

### `ProductCardSkeleton`
**File:** `src/components/layout/states.tsx`  
**Purpose:** Skeleton placeholder matching the exact shape of `ProductCard`. Used inside `CardGridSkeleton`.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| *(none)* | — | — | — |

---

### `CardGridSkeleton`
**File:** `src/components/layout/states.tsx`  
**Purpose:** Grid of `ProductCardSkeleton` items shown while products are loading.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `count` | `number` | — | Number of skeleton cards to render (default: `6`) |

**Used in:**
- `ProductGrid` (internal)

---

### `FormSkeleton`
**File:** `src/components/layout/states.tsx`  
**Purpose:** Generic skeleton for form fields (rows of label + input blocks).

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `rows` | `number` | — | Number of form-row skeletons to render (default: `4`) |

**Used in:**
- `ProfileForm` (internal)

---

### `MapSkeleton`
**File:** `src/components/layout/states.tsx`  
**Purpose:** Rectangular skeleton placeholder shown while a Leaflet map loads.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| *(none)* | — | — | — |

**Used in:**
- `ProductDetail` (internal)

---

### `EmptyState`
**File:** `src/components/layout/states.tsx`  
**Purpose:** Generic empty state with configurable icon, title, description, and optional action element.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `icon` | `React.ElementType` | — | Lucide icon component (default: `Package`) |
| `title` | `string` | — | Heading text (default: `"Nothing here yet"`) |
| `description` | `string` | — | Body text |
| `action` | `ReactNode` | — | CTA button or link |

---

### `NoResults`
**File:** `src/components/layout/states.tsx`  
**Purpose:** Pre-configured `EmptyState` for "no search results found" scenarios.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| *(none)* | — | — | — |

**Used in:**
- `ProductGrid` (internal)

---

### `EmptyOrders`
**File:** `src/components/layout/states.tsx`  
**Purpose:** Pre-configured `EmptyState` for "no orders yet" scenarios.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| *(none)* | — | — | — |

**Used in:**
- `app/(buyer)/buyer/orders/page.tsx`

---

### `PreSearchEmpty`
**File:** `src/components/layout/states.tsx`  
**Purpose:** Illustrated prompt shown on the buyer search page before the user performs their first search.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| *(none)* | — | — | — |

**Used in:**
- `app/(buyer)/buyer/page.tsx`

---

## 11. Provider Components

### `AuthProvider`
**File:** `src/components/providers/auth-provider.tsx`  
**Purpose:** Root-level app provider. On mount, calls `checkAuth()` to restore the session from the backend. Also subscribes to 401 Axios interceptor events and redirects to `/login` on auth failure.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | ✓ | Application tree to wrap |

**Used in:**
- `app/layout.tsx`

---

### `ErrorBoundary`
**File:** `src/components/providers/error-boundary.tsx`  
**Purpose:** React class-based error boundary. Catches render-time exceptions and displays a user-friendly fallback UI instead of a blank screen.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | ✓ | Component tree to guard |
| `fallback` | `ReactNode` | — | Custom fallback UI; defaults to a built-in error card |

**Used in:**
- `app/layout.tsx`

---

## 12. UI Primitives (shadcn/ui)

These are unstyled/lightly-styled base components from [shadcn/ui](https://ui.shadcn.com/). They have no project-specific props — refer to the shadcn/ui documentation for their full API.

| Component | File | Notes |
|-----------|------|-------|
| `Alert`, `AlertDescription` | `ui/alert.tsx` | Inline alert banners |
| `Avatar`, `AvatarFallback` | `ui/avatar.tsx` | User avatar circle |
| `Badge` | `ui/badge.tsx` | Status/label chip |
| `Button` | `ui/button.tsx` | Primary action button with variants |
| `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardFooter` | `ui/card.tsx` | Card container |
| `Checkbox` | `ui/checkbox.tsx` | Single checkbox input |
| `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogTrigger` | `ui/dialog.tsx` | Modal dialog |
| `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger` | `ui/dropdown-menu.tsx` | Contextual dropdown |
| `Form`, `FormControl`, `FormField`, `FormItem`, `FormLabel`, `FormMessage`, `FormDescription` | `ui/form.tsx` | react-hook-form integration |
| `Input` | `ui/input.tsx` | Text input field |
| `Label` | `ui/label.tsx` | Form field label |
| `Progress` | `ui/progress.tsx` | Horizontal progress bar |
| `RadioGroup`, `RadioGroupItem` | `ui/radio-group.tsx` | Radio button group |
| `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` | `ui/select.tsx` | Dropdown select |
| `Separator` | `ui/separator.tsx` | Horizontal/vertical divider |
| `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` | `ui/sheet.tsx` | Side-panel drawer |
| `Skeleton` | `ui/skeleton.tsx` | Shimmer loading placeholder |
| `Slider` | `ui/slider.tsx` | Range slider input |
| `Toaster` (Sonner) | `ui/sonner.tsx` | Global toast notifications |
| `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` | `ui/table.tsx` | Data table structure |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | `ui/tabs.tsx` | Tab navigation |
| `Textarea` | `ui/textarea.tsx` | Multi-line text input |

---

## Component Dependency Tree (Summary)

```
app/layout.tsx
  └── AuthProvider
  └── ErrorBoundary

app/(auth)/login/page.tsx
  └── LoginForm

app/(auth)/register/page.tsx
  └── RegisterForm

app/(buyer)/layout.tsx
  └── ProtectedRoute

app/(buyer)/buyer/page.tsx
  ├── TopHeader, BottomNav
  ├── SearchForm
  │     ├── AddressAutocomplete
  │     └── GeolocationButton
  ├── SortControls
  ├── ProductGrid
  │     └── ProductCard
  ├── ProductDetail (dynamic)
  │     └── ProductMap (dynamic)
  └── SearchResultsMap (dynamic)
        └── GeolocationButton

app/(buyer)/buyer/orders/page.tsx
  ├── TopHeader, BottomNav
  └── OrderCard

app/(buyer)/orders/[id]/page.tsx
  ├── TopHeader, BottomNav
  └── OrderDetail

app/(buyer)/cart/page.tsx
  ├── TopHeader, BottomNav
  └── CartSummary

app/(buyer)/checkout/page.tsx
  ├── CartSummary
  └── PaymentModal (dynamic)

app/(buyer)/buyer/profile/page.tsx
  ├── TopHeader, BottomNav
  └── ProfileForm
        ├── AlgorithmPreferences
        │     └── StoragePreference
        ├── LocationSettings (dynamic)
        │     ├── AddressAutocomplete
        │     └── GeolocationButton
        └── PasswordChangeForm

app/seller/layout.tsx
  ├── TopHeader, BottomNav
  └── ProtectedRoute

app/seller/dashboard/page.tsx
  └── SellerAnalytics (dynamic)

app/seller/products/page.tsx
  └── ProductTable

app/seller/products/add/page.tsx
  └── ProductForm
        └── ProductTypeCombobox

app/seller/products/[id]/edit/page.tsx
  └── ProductForm
        └── ProductTypeCombobox

app/seller/orders/page.tsx
  ├── OrderCard
  └── OrderDetail (dynamic)

app/seller/profile/page.tsx
  └── ProfileForm
```
