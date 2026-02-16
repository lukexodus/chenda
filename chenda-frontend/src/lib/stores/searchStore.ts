import { create } from "zustand";
import { persist } from "zustand/middleware";
import { searchApi } from "@/lib/api";

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface SearchFilters {
  location: { lat: number; lng: number; address?: string } | null;
  proximityWeight: number;
  freshnessWeight: number;
  maxRadius: number;
  minFreshnessScore: number;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  description?: string;
  image_url?: string;
  seller_id: number;
  seller_name?: string;
  seller_phone?: string;
  seller_email?: string;
  product_type_id: number;
  product_type_name?: string;
  storage_condition?: string;
  location: { lat: number; lng: number };
  latitude?: number;
  longitude?: number;
  created_at: string;
  
  // Algorithm metrics
  distance_km?: number;
  freshness_score?: number;
  combined_score?: number;
  rank?: number;
  days_remaining?: number;
  expiration_date?: string;
}

interface SearchHistory {
  filters: SearchFilters;
  timestamp: number;
  resultCount: number;
}

interface SearchState {
  filters: SearchFilters;
  results: Product[];
  loading: boolean;
  error: string | null;
  history: SearchHistory[];

  // Actions
  setFilters: (filters: Partial<SearchFilters>) => void;
  setLocation: (lat: number, lng: number, address?: string) => void;
  setProximityWeight: (weight: number) => void;
  setFreshnessWeight: (weight: number) => void;
  search: () => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
  addToHistory: (filters: SearchFilters, resultCount: number) => void;
  clearHistory: () => void;
}

// ────────────────────────────────────────────
// Default Filters
// ────────────────────────────────────────────

const defaultFilters: SearchFilters = {
  location: null,
  proximityWeight: 50,
  freshnessWeight: 50,
  maxRadius: 25,
  minFreshnessScore: 0,
};

// ────────────────────────────────────────────
// Store
// ────────────────────────────────────────────

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      filters: defaultFilters,
      results: [],
      loading: false,
      error: null,
      history: [],

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      setLocation: (lat, lng, address) => {
        set((state) => ({
          filters: {
            ...state.filters,
            location: { lat, lng, address },
          },
        }));
      },

      setProximityWeight: (weight) => {
        const clamped = Math.max(0, Math.min(100, weight));
        set((state) => ({
          filters: {
            ...state.filters,
            proximityWeight: clamped,
            freshnessWeight: 100 - clamped,
          },
        }));
      },

      setFreshnessWeight: (weight) => {
        const clamped = Math.max(0, Math.min(100, weight));
        set((state) => ({
          filters: {
            ...state.filters,
            freshnessWeight: clamped,
            proximityWeight: 100 - clamped,
          },
        }));
      },

      search: async () => {
        const { filters } = get();

        if (!filters.location) {
          set({ error: "Please set your location first" });
          return;
        }

        set({ loading: true, error: null });

        try {
          const response = await searchApi.search({
            buyer: {
              lat: filters.location.lat,
              lng: filters.location.lng,
            },
            config: {
              max_radius: filters.maxRadius,
              weights: {
                proximity_weight: filters.proximityWeight,
                freshness_weight: filters.freshnessWeight,
              },
              min_freshness_score: filters.minFreshnessScore,
            },
          });

          const products = response.data.data?.products || response.data.products || [];

          // Add rank to products
          const rankedProducts = products.map((p: Product, index: number) => ({
            ...p,
            rank: index + 1,
          }));

          set({ results: rankedProducts, loading: false });

          // Add to history
          get().addToHistory(filters, rankedProducts.length);
        } catch (err) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message || "Search failed. Please try again.";
          set({ error: message, loading: false, results: [] });
        }
      },

      clearResults: () => {
        set({ results: [], error: null });
      },

      clearError: () => {
        set({ error: null });
      },

      addToHistory: (filters, resultCount) => {
        set((state) => {
          const newHistory = [
            { filters, timestamp: Date.now(), resultCount },
            ...state.history.slice(0, 9), // Keep last 10
          ];
          return { history: newHistory };
        });
      },

      clearHistory: () => {
        set({ history: [] });
      },
    }),
    {
      name: "chenda-search-storage",
      partialize: (state) => ({
        // Only persist filters and history, not results/loading/error
        filters: state.filters,
        history: state.history,
      }),
    }
  )
);
