import axios, { AxiosError, type AxiosInstance } from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || "/api";

/**
 * Axios instance configured for the Chenda API.
 * - Sends cookies (session auth) with every request.
 * - Base URL points at the Express backend.
 */
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}${API_PREFIX}`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// --------------- interceptors ---------------

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Redirect to login on 401 (session expired)
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (!path.startsWith("/login") && !path.startsWith("/register")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// --------------- types ---------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T> {
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    has_more?: boolean;
  };
}

// --------------- auth ---------------

export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    type: "buyer" | "seller" | "both";
    address?: string;
    location?: { lat: number; lng: number };
  }) => api.post("/auth/register", data),

  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  logout: () => api.post("/auth/logout"),

  me: () => api.get("/auth/me"),

  updatePassword: (currentPassword: string, newPassword: string) =>
    api.put("/auth/password", { currentPassword, newPassword }),
};

// --------------- search (algorithm) ---------------

export const searchApi = {
  search: (data: {
    buyer: { lat: number; lng: number };
    config?: {
      max_radius?: number;
      weights?: { proximity_weight: number; freshness_weight: number };
      min_freshness_score?: number;
      mode?: string;
      sort_order?: string;
    };
  }) => api.post("/products/search", data),

  personalized: (buyer: { lat: number; lng: number }) =>
    api.post("/products/search/personalized", { buyer }),

  nearby: (lat: number, lng: number, radius?: number) =>
    api.get("/products/nearby", { params: { lat, lng, radius } }),

  publicSearch: (params: {
    lat: number;
    lng: number;
    proximity_weight?: number;
    freshness_weight?: number;
    max_radius?: number;
    min_freshness_score?: number;
  }) => api.get("/search/public", { params }),
};

// --------------- products ---------------

export const productsApi = {
  create: (data: Record<string, unknown>) => api.post("/products", data),

  getAll: (params?: { limit?: number; offset?: number; status?: string }) =>
    api.get("/products", { params }),

  getById: (id: number | string) => api.get(`/products/${id}`),

  update: (id: number | string, data: Record<string, unknown>) =>
    api.put(`/products/${id}`, data),

  delete: (id: number | string) => api.delete(`/products/${id}`),

  uploadImage: (formData: FormData) =>
    api.post("/products/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// --------------- product types---------------

export const productTypesApi = {
  getAll: (search?: string) =>
    api.get("/product-types", { params: search ? { search } : undefined }),

  getById: (id: number | string) => api.get(`/product-types/${id}`),
};

// --------------- users ---------------

export const usersApi = {
  getProfile: () => api.get("/users/profile"),

  updateProfile: (data: Record<string, unknown>) =>
    api.put("/users/profile", data),

  updatePreferences: (data: {
    proximity_weight?: number;
    freshness_weight?: number;
    max_radius?: number;
    min_freshness_score?: number;
    storage_condition?: string;
  }) => api.put("/users/preferences", data),

  updateLocation: (data: {
    lat: number;
    lng: number;
    address?: string;
  }) => api.put("/users/location", data),

  geocode: (address: string) => api.post("/users/geocode", { address }),

  reverseGeocode: (lat: number, lng: number) =>
    api.post("/users/reverse-geocode", { lat, lng }),
};

// --------------- orders ---------------

export const ordersApi = {
  create: (data: {
    product_id: number;
    quantity: number;
    payment_method: string;
    delivery_address?: string;
    delivery_notes?: string;
  }) => api.post("/orders", data),

  getAll: (params?: {
    status?: string;
    role?: string;
    limit?: number;
    offset?: number;
  }) => api.get("/orders", { params }),

  getById: (id: number | string) => api.get(`/orders/${id}`),

  processPayment: (
    orderId: number | string,
    data: {
      payment_method: string;
      payment_details?: Record<string, unknown>;
    }
  ) => api.post(`/orders/${orderId}/payment`, data),

  updateStatus: (
    orderId: number | string,
    data: { status: string; notes?: string }
  ) => api.put(`/orders/${orderId}/status`, data),

  getPaymentMethods: () => api.get("/orders/payment-methods"),
};

// --------------- analytics ---------------

export const analyticsApi = {
  algorithm: (period?: string) =>
    api.get("/analytics/algorithm", { params: { period } }),

  business: (period?: string) =>
    api.get("/analytics/business", { params: { period } }),

  performance: (period?: string) =>
    api.get("/analytics/performance", { params: { period } }),

  sellerDashboard: () => api.get("/analytics/seller-dashboard"),

  myActivity: () => api.get("/analytics/my-activity"),

  realtime: () => api.get("/analytics/realtime"),

  overview: () => api.get("/analytics/overview"),
};

export { api };
export default api;
