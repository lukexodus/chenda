/**
 * Integration tests — Seller: Add Product flow
 *
 * Tests the ProductForm component through a realistic seller workflow.
 */
import React from "react";
import { render, screen, waitFor, userEvent } from "../test-utils";
import { ProductForm } from "@/components/seller/ProductForm";
import { useAuthStore } from "@/lib/store";
import { mockSellerUser } from "../mocks/handlers";

// ── Mocks ──────────────────────────────────────────────────

const pushMock = jest.fn();
const backMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: jest.fn(), back: backMock, prefetch: jest.fn() }),
  usePathname: () => "/seller/products/new",
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

// Mock ProductTypeCombobox to simplify testing
jest.mock("@/components/seller/ProductTypeCombobox", () => ({
  ProductTypeCombobox: ({ onSelect, disabled }: any) => (
    <button
      data-testid="product-type-select"
      disabled={disabled}
      onClick={() =>
        onSelect({
          id: 1,
          name: "Tomato",
          category_id: 1,
          default_shelf_life_days: 14,
          default_storage_condition: "room_temp",
        })
      }
    >
      Select Product Type
    </button>
  ),
}));

// ── Helpers ────────────────────────────────────────────────

beforeEach(() => {
  pushMock.mockClear();
  backMock.mockClear();
  useAuthStore.setState({
    user: mockSellerUser,
    loading: false,
    error: null,
  });
});

// ── Tests ──────────────────────────────────────────────────

describe("Integration: Seller Add Product", () => {
  it("renders the product form with all required fields", () => {
    render(<ProductForm />);

    expect(screen.getAllByText(/product type/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/days already used/i)).toBeInTheDocument();
    expect(screen.getByText(/storage condition/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create product/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("shows validation error when submitting without required fields", async () => {
    const { toast } = require("sonner");
    const user = userEvent.setup();
    render(<ProductForm />);

    await user.click(screen.getByRole("button", { name: /create product/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Please fix form errors");
    });

    // Product type is required
    expect(screen.getByText(/product type is required/i)).toBeInTheDocument();
  });

  it("shows validation error for invalid price", async () => {
    const { toast } = require("sonner");
    const user = userEvent.setup();
    render(<ProductForm />);

    // Select type
    await user.click(screen.getByTestId("product-type-select"));

    // Set invalid price
    const priceInput = screen.getByLabelText(/price/i);
    await user.clear(priceInput);
    await user.type(priceInput, "0");

    // Set valid quantity
    const quantityInput = screen.getByLabelText(/quantity/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, "10");

    await user.click(screen.getByRole("button", { name: /create product/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid price is required/i)).toBeInTheDocument();
    });
  });

  it("creates a product with valid data and redirects", async () => {
    const { toast } = require("sonner");
    const user = userEvent.setup();
    render(<ProductForm />);

    // 1. Select product type
    await user.click(screen.getByTestId("product-type-select"));

    // 2. Set price
    const priceInput = screen.getByLabelText(/price/i);
    await user.clear(priceInput);
    await user.type(priceInput, "50");

    // 3. Set quantity
    const quantityInput = screen.getByLabelText(/quantity/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, "10");

    // 4. Days used is already "0" by default

    // 5. Submit
    await user.click(screen.getByRole("button", { name: /create product/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Product created successfully");
    });

    expect(pushMock).toHaveBeenCalledWith("/products");
  });

  it("cancel button navigates back", async () => {
    const user = userEvent.setup();
    render(<ProductForm />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(backMock).toHaveBeenCalled();
  });

  it("shows shelf life info after selecting product type", async () => {
    const user = userEvent.setup();
    render(<ProductForm />);

    await user.click(screen.getByTestId("product-type-select"));

    await waitFor(() => {
      expect(screen.getByText(/default shelf life: 14 days/i)).toBeInTheDocument();
    });
  });
});
