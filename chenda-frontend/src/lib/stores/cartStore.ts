import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./searchStore";

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: number;
}

interface CartState {
  items: CartItem[];
  
  // Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  
  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isInCart: (productId: number) => boolean;
  getCartItem: (productId: number) => CartItem | undefined;
}

// ────────────────────────────────────────────
// Store
// ────────────────────────────────────────────

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (product, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.product.id === product.id
          );

          if (existingIndex >= 0) {
            // Update quantity if already in cart
            const newItems = [...state.items];
            newItems[existingIndex].quantity += quantity;
            return { items: newItems };
          } else {
            // Add new item
            return {
              items: [
                ...state.items,
                { product, quantity, addedAt: Date.now() },
              ],
            };
          }
        });
      },

      removeFromCart: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },

      isInCart: (productId) => {
        return get().items.some((item) => item.product.id === productId);
      },

      getCartItem: (productId) => {
        return get().items.find((item) => item.product.id === productId);
      },
    }),
    {
      name: "chenda-cart-storage",
    }
  )
);
