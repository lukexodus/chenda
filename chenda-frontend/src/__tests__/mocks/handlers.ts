/**
 * MSW v2 request handlers for the Chenda API.
 *
 * Every handler returns a happy-path response by default.
 * Individual tests can override via `server.use(...)`.
 */
import { http, HttpResponse, delay } from "msw";

const API = "http://localhost:3001/api";

// ────────────────────────────────────────────
// Shared test fixtures
// ────────────────────────────────────────────

export const mockBuyerUser = {
  id: 1,
  name: "Test Buyer",
  email: "buyer@test.com",
  type: "buyer" as const,
  address: "Phnom Penh, Cambodia",
  location: { lat: 11.5564, lng: 104.9282 },
  preferences: {
    proximity_weight: 50,
    freshness_weight: 50,
    max_radius: 25,
    min_freshness_score: 0,
  },
  created_at: "2026-01-01T00:00:00.000Z",
};

export const mockSellerUser = {
  id: 2,
  name: "Test Seller",
  email: "seller@test.com",
  type: "seller" as const,
  address: "Siem Reap, Cambodia",
  location: { lat: 13.3633, lng: 103.8564 },
  created_at: "2026-01-01T00:00:00.000Z",
};

export const mockProducts = [
  {
    id: 1,
    name: "Fresh Tomatoes",
    price: 50,
    quantity: 10,
    unit: "kg",
    description: "Locally grown tomatoes",
    image_url: null,
    seller_id: 2,
    seller_name: "Test Seller",
    product_type_id: 1,
    product_type_name: "Tomato",
    storage_condition: "room_temp",
    location: { lat: 11.56, lng: 104.93 },
    created_at: "2026-02-20T00:00:00.000Z",
    distance_km: 1.2,
    freshness_score: 85,
    combined_score: 80,
    rank: 1,
    days_remaining: 5,
  },
  {
    id: 2,
    name: "Organic Mangoes",
    price: 120,
    quantity: 5,
    unit: "kg",
    description: "Sweet organic mangoes",
    image_url: null,
    seller_id: 2,
    seller_name: "Test Seller",
    product_type_id: 2,
    product_type_name: "Mango",
    storage_condition: "room_temp",
    location: { lat: 11.57, lng: 104.94 },
    created_at: "2026-02-18T00:00:00.000Z",
    distance_km: 3.5,
    freshness_score: 60,
    combined_score: 55,
    rank: 2,
    days_remaining: 2,
  },
];

export const mockProductTypes = [
  {
    id: 1,
    name: "Tomato",
    category_id: 1,
    default_shelf_life_days: 14,
    default_storage_condition: "room_temp",
  },
  {
    id: 2,
    name: "Mango",
    category_id: 1,
    default_shelf_life_days: 7,
    default_storage_condition: "room_temp",
  },
];

// ────────────────────────────────────────────
// Handlers
// ────────────────────────────────────────────

export const handlers = [
  // ── Auth ─────────────────────────────────

  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (body.email === "buyer@test.com" && body.password === "password123") {
      return HttpResponse.json({
        success: true,
        message: "Login successful",
        user: mockBuyerUser,
      });
    }

    if (body.email === "seller@test.com" && body.password === "password123") {
      return HttpResponse.json({
        success: true,
        message: "Login successful",
        user: mockSellerUser,
      });
    }

    return HttpResponse.json(
      { success: false, message: "Invalid email or password" },
      { status: 401 }
    );
  }),

  http.post(`${API}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      email: string;
      password: string;
      type: string;
    };

    if (body.email === "existing@test.com") {
      return HttpResponse.json(
        { success: false, message: "Email already registered" },
        { status: 409 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: "Registration successful",
      user: {
        id: 99,
        name: body.name,
        email: body.email,
        type: body.type,
        created_at: new Date().toISOString(),
      },
    });
  }),

  http.post(`${API}/auth/logout`, () => {
    return HttpResponse.json({ success: true, message: "Logged out" });
  }),

  http.get(`${API}/auth/me`, () => {
    return HttpResponse.json({
      success: true,
      user: mockBuyerUser,
    });
  }),

  // ── Users / Profile ──────────────────────

  http.get(`${API}/users/profile`, () => {
    return HttpResponse.json({
      ...mockBuyerUser,
      success: true,
    });
  }),

  http.put(`${API}/users/profile`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      message: "Profile updated",
      user: { ...mockBuyerUser, ...body },
    });
  }),

  http.put(`${API}/users/preferences`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      message: "Preferences updated",
      data: body,
    });
  }),

  http.put(`${API}/users/location`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      message: "Location updated",
      data: body,
    });
  }),

  http.post(`${API}/users/reverse-geocode`, () => {
    return HttpResponse.json({
      success: true,
      data: { address: "Phnom Penh, Cambodia" },
    });
  }),

  // ── Search ───────────────────────────────

  http.post(`${API}/products/search`, async () => {
    await delay(50); // simulate latency
    return HttpResponse.json({
      success: true,
      data: { products: mockProducts },
    });
  }),

  // ── Products ─────────────────────────────

  http.get(`${API}/products`, () => {
    return HttpResponse.json({
      success: true,
      data: mockProducts,
    });
  }),

  http.get(`${API}/products/:id`, ({ params }) => {
    const product = mockProducts.find((p) => p.id === Number(params.id));
    if (!product) {
      return HttpResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }
    return HttpResponse.json({ success: true, data: product });
  }),

  http.post(`${API}/products`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      message: "Product created",
      data: { id: 100, ...body },
    });
  }),

  http.put(`${API}/products/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      message: "Product updated",
      data: { id: Number(params.id), ...body },
    });
  }),

  http.post(`${API}/products/upload-image`, () => {
    return HttpResponse.json({
      success: true,
      data: { image_url: "/uploads/products/test-image.jpg" },
    });
  }),

  // ── Product Types ────────────────────────

  http.get(`${API}/product-types`, () => {
    return HttpResponse.json({
      success: true,
      data: mockProductTypes,
    });
  }),

  // ── Analytics ────────────────────────────

  http.get(`${API}/analytics/seller-dashboard`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        total_products: 10,
        active_products: 8,
        average_freshness: 75,
        expiring_soon: 2,
        total_revenue: 15000,
        total_orders: 25,
      },
    });
  }),
];
