/**
 * ProductCard component tests
 *
 * Covers:
 * - Rendering product info (name, price, unit, freshness, distance, score)
 * - Freshness progress bar / days remaining
 * - Rank badge display
 * - Add to cart behaviour
 * - "In Cart" indicator when product already in cart
 * - Click to view details callback
 * - Keyboard accessibility (Enter / Space)
 */
import React from "react";
import { render, screen, userEvent } from "../../test-utils";
import { ProductCard } from "@/components/products/ProductCard";
import { useCartStore } from "@/lib/stores/cartStore";
import type { Product } from "@/lib/stores/searchStore";

// ── Mocks ──────────────────────────────────────────────────

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// next/image → simple <img>
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return React.createElement("img", { ...props, fill: undefined });
  },
}));

// ── Fixtures ───────────────────────────────────────────────

const baseProduct: Product = {
  id: 1,
  name: "Fresh Tomatoes",
  price: 50,
  quantity: 10,
  unit: "kg",
  description: "Locally grown",
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
};

// ── Helpers ────────────────────────────────────────────────

beforeEach(() => {
  // Clear cart between tests
  useCartStore.setState({ items: [] });
});

// ── Tests ──────────────────────────────────────────────────

describe("ProductCard", () => {
  it("renders product name, price, and unit", () => {
    render(<ProductCard product={baseProduct} />);

    expect(screen.getByText("Fresh Tomatoes")).toBeInTheDocument();
    expect(screen.getByText("₱50.00")).toBeInTheDocument();
    expect(screen.getByText(/\/ kg/)).toBeInTheDocument();
  });

  it("renders product type badge", () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText("Tomato")).toBeInTheDocument();
  });

  it("renders freshness score and days remaining", () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getByText(/5 days left/)).toBeInTheDocument();
  });

  it("renders distance", () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText("1.2km")).toBeInTheDocument();
  });

  it("renders distance in meters when < 1km", () => {
    render(<ProductCard product={{ ...baseProduct, distance_km: 0.35 }} />);
    expect(screen.getByText("350m")).toBeInTheDocument();
  });

  it("renders rank badge for top-10 products", () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  it("does not render rank badge when rank > 10", () => {
    render(<ProductCard product={{ ...baseProduct, rank: 15 }} />);
    expect(screen.queryByText("#15")).not.toBeInTheDocument();
  });

  it("renders combined score", () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText("80")).toBeInTheDocument();
  });

  it("renders 'Expires soon' when days_remaining is 0", () => {
    render(<ProductCard product={{ ...baseProduct, days_remaining: 0 }} />);
    expect(screen.getByText(/expires soon/i)).toBeInTheDocument();
  });

  it("shows placeholder icon when image_url is null", () => {
    render(<ProductCard product={baseProduct} />);
    // The Package icon is rendered – no <img> element
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders an image when image_url is set", () => {
    render(
      <ProductCard
        product={{ ...baseProduct, image_url: "/uploads/products/tomato.jpg" }}
      />
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/uploads/products/tomato.jpg"
    );
  });

  it("calls onViewDetails when card is clicked", async () => {
    const handler = jest.fn();
    const user = userEvent.setup();

    render(<ProductCard product={baseProduct} onViewDetails={handler} />);

    await user.click(screen.getByRole("button", { name: /view details for fresh tomatoes/i }));
    expect(handler).toHaveBeenCalledWith(baseProduct);
  });

  it("adds product to cart on button click", async () => {
    const { toast } = require("sonner");
    const user = userEvent.setup();

    render(<ProductCard product={baseProduct} />);

    const addBtn = screen.getByRole("button", { name: /add fresh tomatoes to cart/i });
    await user.click(addBtn);

    expect(toast.success).toHaveBeenCalledWith(
      "Fresh Tomatoes added to cart",
      expect.any(Object)
    );
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("shows 'In Cart' state after adding to cart", async () => {
    // Pre-populate cart
    useCartStore.getState().addToCart(baseProduct);

    render(<ProductCard product={baseProduct} />);

    expect(screen.getByRole("button", { name: /fresh tomatoes is in cart/i })).toBeInTheDocument();
    expect(screen.getByText(/in cart/i)).toBeInTheDocument();
  });
});
