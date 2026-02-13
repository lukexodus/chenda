import { create } from "zustand";
import { authApi, usersApi } from "@/lib/api";

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  type: "buyer" | "seller" | "both";
  address?: string;
  location?: { lat: number; lng: number };
  preferences?: {
    proximity_weight: number;
    freshness_weight: number;
    max_radius: number;
    min_freshness_score?: number;
    storage_condition?: string;
  };
  created_at?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;

  // actions
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    type: "buyer" | "seller" | "both";
    address?: string;
    location?: { lat: number; lng: number };
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Record<string, unknown>) => Promise<void>;
  updatePreferences: (data: Record<string, unknown>) => Promise<void>;
  updateLocation: (lat: number, lng: number, address?: string) => Promise<void>;
  clearError: () => void;
}

// ────────────────────────────────────────────
// Store
// ────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  checkAuth: async () => {
    try {
      set({ loading: true, error: null });
      const res = await authApi.me();
      set({ user: res.data.user ?? res.data.data ?? null, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const res = await authApi.login(email, password);
      set({ user: res.data.user ?? res.data.data ?? null, loading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Login failed";
      set({ error: message, loading: false });
      throw err;
    }
  },

  register: async (data) => {
    try {
      set({ loading: true, error: null });
      const res = await authApi.register(data);
      set({ user: res.data.user ?? res.data.data ?? null, loading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Registration failed";
      set({ error: message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null, loading: false, error: null });
    }
  },

  updateProfile: async (data) => {
    try {
      set({ error: null });
      const res = await usersApi.updateProfile(data);
      const updated = res.data.user ?? res.data.data ?? null;
      if (updated) set({ user: { ...get().user!, ...updated } });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Profile update failed";
      set({ error: message });
      throw err;
    }
  },

  updatePreferences: async (data) => {
    try {
      set({ error: null });
      await usersApi.updatePreferences(data as Parameters<typeof usersApi.updatePreferences>[0]);
      // Re-fetch full profile to stay in sync
      const res = await usersApi.getProfile();
      const updated = res.data.user ?? res.data.data ?? null;
      if (updated) set({ user: { ...get().user!, ...updated } });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Preferences update failed";
      set({ error: message });
      throw err;
    }
  },

  updateLocation: async (lat, lng, address) => {
    try {
      set({ error: null });
      await usersApi.updateLocation({ lat, lng, address });
      set({
        user: {
          ...get().user!,
          location: { lat, lng },
          address: address ?? get().user?.address,
        } as User,
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Location update failed";
      set({ error: message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
