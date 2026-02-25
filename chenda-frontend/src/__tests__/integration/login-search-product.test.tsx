/**
 * Integration tests — Login → Search → View Product flow
 *
 * These tests exercise multiple components together through a realistic
 * user workflow, with MSW intercepting API calls at the network level.
 */
import React from "react";
import { render, screen, waitFor, userEvent } from "../test-utils";
import { LoginForm } from "@/components/auth/LoginForm";
import { SearchForm } from "@/components/buyer/SearchForm";
import { ProductCard } from "@/components/products/ProductCard";
import { useAuthStore } from "@/lib/store";
import { useSearchStore } from "@/lib/stores/searchStore";
import { useCartStore } from "@/lib/stores/cartStore";
import { mockBuyerUser, mockProducts } from "../mocks/handlers";

// ── Mocks ──────────────────────────────────────────────────

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: jest.fn(), back: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => "/login",
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: any) =>
    React.createElement("a", { href, ...rest }, children),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => React.createElement("img", { ...props, fill: undefined }),
}));
jest.mock("@/components/maps/AddressAutocomplete", () => ({
  __esModule: true,
  default: ({ value, onChange, placeholder }: any) => (
    <input data-testid="address-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  ),
}));
jest.mock("@/components/maps/GeolocationButton", () => ({
  __esModule: true,
  default: ({ onLocationFound }: any) => (
    <button data-testid="geolocation-btn" onClick={() => onLocationFound(11.5564, 104.9282)}>GPS</button>
  ),
}));

// ── Helpers ────────────────────────────────────────────────

beforeEach(() => {
  pushMock.mockClear();
  useAuthStore.setState({ user: null, loading: false, error: null });
  useSearchStore.setState({
    filters: { location: null, proximityWeight: 50, freshnessWeight: 50, maxRadius: 25, minFreshnessScore: 0 },
    results: [],
    loading: false,
    error: null,
    history: [],
  });
  useCartStore.setState({ items: [] });
});

// ── Tests ──────────────────────────────────────────────────

describe("Integration: Login → Search → View Product", () => {
  it("buyer can log in, then the auth store is populated", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "buyer@test.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      const authState = useAuthStore.getState();
      expect(authState.user).toBeTruthy();
      expect(authState.user!.email).toBe("buyer@test.com");
      expect(authState.user!.type).toBe("buyer");
    });
  });

  it("after login, setting location enables search", async () => {
    // Simulate logged-in state
    useAuthStore.setState({ user: mockBuyerUser, loading: false });

    render(<SearchForm />);

    // Use GPS button to set location
    const user = userEvent.setup();
    await user.click(screen.getByTestId("geolocation-btn"));

    await waitFor(() => {
      const { filters } = useSearchStore.getState();
      expect(filters.location).toBeTruthy();
    });

    // Search button should now be enabled
    expect(screen.getByRole("button", { name: /search fresh products/i })).not.toBeDisabled();
  });

  it("search populates results that can be rendered as ProductCards", async () => {
    // Simulate logged-in + location set
    useAuthStore.setState({ user: mockBuyerUser, loading: false });
    useSearchStore.setState({
      filters: {
        location: { lat: 11.5564, lng: 104.9282, address: "Test" },
        proximityWeight: 50,
        freshnessWeight: 50,
        maxRadius: 25,
        minFreshnessScore: 0,
      },
      results: [],
      loading: false,
      error: null,
      history: [],
    });

    // Trigger search at the store level
    await useSearchStore.getState().search();

    // After search, results should be populated
    const { results } = useSearchStore.getState();
    expect(results.length).toBeGreaterThan(0);

    // Render a ProductCard with the first result
    const onViewDetails = jest.fn();
    render(<ProductCard product={results[0]} onViewDetails={onViewDetails} />);

    expect(screen.getByText("Fresh Tomatoes")).toBeInTheDocument();

    // Click to view details
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /view details/i }));
    expect(onViewDetails).toHaveBeenCalledWith(results[0]);
  });

  it("adding a product to cart persists across re-renders", async () => {
    // Pre-fill search results
    useSearchStore.setState({ results: mockProducts as any });

    const { rerender } = render(
      <ProductCard product={mockProducts[0] as any} />
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /add fresh tomatoes to cart/i }));

    // Cart store should have the item
    expect(useCartStore.getState().items).toHaveLength(1);

    // Re-render: "In Cart" should still show
    rerender(<ProductCard product={mockProducts[0] as any} />);
    expect(screen.getByText(/in cart/i)).toBeInTheDocument();
  });
});
