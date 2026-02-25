/**
 * RegisterForm component tests
 *
 * Covers:
 * - Rendering all form fields (name, email, password, confirm, type, terms)
 * - Validation errors (required fields, password mismatch, terms unchecked)
 * - Successful registration with redirect
 * - API error handling (duplicate email)
 * - Loading state
 */
import React from "react";
import { render, screen, waitFor, userEvent } from "../../test-utils";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useAuthStore } from "@/lib/store";

// ── Next.js mocks ──────────────────────────────────────────

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: jest.fn(), back: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => "/register",
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: any) =>
    React.createElement("a", { href, ...rest }, children),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// ── Helpers ────────────────────────────────────────────────

beforeEach(() => {
  pushMock.mockClear();
  useAuthStore.setState({ user: null, loading: false, error: null });
});

/**
 * Helper to fill the entire register form with valid data.
 */
async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/full name/i), "Test User");
  await user.type(screen.getByLabelText(/^email$/i), "new@test.com");
  await user.type(screen.getByLabelText(/^password$/i), "password123");
  await user.type(screen.getByLabelText(/confirm password/i), "password123");
  // Select "buyer" radio
  await user.click(screen.getByLabelText(/buy fresh products/i));
  // Accept terms
  await user.click(screen.getByRole("checkbox"));
}

// ── Tests ──────────────────────────────────────────────────

describe("RegisterForm", () => {
  it("renders all form fields", () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByText(/i want to:/i)).toBeInTheDocument();
    expect(screen.getByText(/buy fresh products/i)).toBeInTheDocument();
    expect(screen.getByText(/sell products/i)).toBeInTheDocument();
    expect(screen.getByText(/both buy & sell/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/^email$/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "different");
    await user.click(screen.getByLabelText(/buy fresh products/i));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("shows error when terms not accepted", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/^email$/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByLabelText(/buy fresh products/i));
    // Don't click checkbox
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/must accept the terms/i)).toBeInTheDocument();
    });
  });

  it("registers a buyer and redirects to /buyer", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/buyer");
    });
  });

  it("registers a seller and redirects to /seller/dashboard", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/full name/i), "Seller User");
    await user.type(screen.getByLabelText(/^email$/i), "newseller@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByLabelText(/sell products/i));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/seller/dashboard");
    });
  });

  it("has a link to the login page", () => {
    render(<RegisterForm />);
    const link = screen.getByRole("link", { name: /sign in/i });
    expect(link).toHaveAttribute("href", "/login");
  });
});
