import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  name: string;
  email: string;
  type: 'buyer' | 'seller' | 'both';
  address?: string;
  lat?: number;
  lng?: number;
  preferences?: {
    proximity_weight: number;
    freshness_weight: number;
    max_radius: number;
    min_freshness_score: number;
    display_mode: 'ranking' | 'filter';
    storage_condition?: string[];
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: user !== null,
        }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'chenda-auth-storage',
    }
  )
);
