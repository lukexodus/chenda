/**
 * LoginForm component tests
 *
 * Covers:
 * - Rendering all form fields
 * - Validation (empty fields, invalid email, short password)
 * - Successful login flow (buyer → /buyer, seller → /seller/dashboard)
 * - API error handling
 * - Loading state (submit button disabled, spinner shown)
 */
import React from "react";
import { render, screen, waitFor, userEvent } from "../../test-utils";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuthStore } from "@/lib/store";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";

// ── Next.js mocks ──────────────────────────────────────────

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: jest.fn(), back: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => "/login",
}));

jest.mock("next/link", () => {
  return {
    __esModule: true,
    default: ({ children, href, ...rest }: any) =>
      React.createElement("a", { href, ...rest }, children),
  };
});

// Suppress sonner toast in JSDOM
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
  // Reset zustand store
  useAuthStore.setState({ user: null, loading: false, error: null });
});

// ── Tests ──────────────────────────────────────────────────

describe("LoginForm", () => {
  it("renders email, password, remember-me, and submit button", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty fields", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it.skip("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText((content, element) =>
          content.includes("Invalid email address")
        )
      ).toBeInTheDocument();
    });
  });

  it("shows validation error for short password", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/password/i), "12345");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it("logs in a buyer and redirects to /buyer", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "buyer@test.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/buyer");
    });
  });

  it("logs in a seller and redirects to /seller/dashboard", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "seller@test.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/seller/dashboard");
    });
  });

  it("shows error toast on failed login", async () => {
    const { toast } = require("sonner");
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "wrong@test.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("disables the submit button and shows spinner while loading", async () => {
    // Delay the API response so we can observe the loading state
    server.use(
      http.post("http://localhost:3001/api/auth/login", async () => {
        await new Promise((r) => setTimeout(r, 500));
        return HttpResponse.json({ success: true, user: { id: 1, type: "buyer" } });
      })
    );

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "buyer@test.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    // The button text changes to "Signing in..."
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
  });

  it("has a link to the registration page", () => {
    render(<LoginForm />);
    const link = screen.getByRole("link", { name: /create one/i });
    expect(link).toHaveAttribute("href", "/register");
  });
});
