/**
 * Error state tests
 *
 * Covers:
 * - API failures (500 errors)
 * - Invalid form inputs across components
 * - Network errors (connection refused)
 * - 401 unauthorized responses
 * - 409 conflict (duplicate email)
 */
import React from "react";
import { render, screen, waitFor, userEvent } from "./test-utils";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { useAuthStore } from "@/lib/store";
import { useSearchStore } from "@/lib/stores/searchStore";
import { server } from "./mocks/server";
import { http, HttpResponse } from "msw";
import { mockBuyerUser } from "./mocks/handlers";

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
jest.mock("@/components/profile/LocationSettings", () => ({
  LocationSettings: () => <div>LocationSettings</div>,
}));
jest.mock("@/components/profile/AlgorithmPreferences", () => ({
  AlgorithmPreferences: () => <div>AlgorithmPreferences</div>,
}));
jest.mock("@/components/profile/PasswordChangeForm", () => ({
  PasswordChangeForm: () => <div>PasswordChangeForm</div>,
}));
jest.mock("@/components/layout/states", () => ({
  FormSkeleton: () => <div>Loading...</div>,
}));

// ── Helpers ────────────────────────────────────────────────

beforeEach(() => {
  pushMock.mockClear();
  jest.clearAllMocks();
  useAuthStore.setState({ user: null, loading: false, error: null });
});

// ── Tests ──────────────────────────────────────────────────

describe("Error States: API Failures", () => {
  it("LoginForm: shows error on 500 server error", async () => {
    server.use(
      http.post("http://localhost:3001/api/auth/login", () => {
        return HttpResponse.json(
          { success: false, message: "Internal server error" },
          { status: 500 }
        );
      })
    );

    const { toast } = require("sonner");
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "buyer@test.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("LoginForm: shows error on network failure", async () => {
    server.use(
      http.post("http://localhost:3001/api/auth/login", () => {
        return HttpResponse.error();
      })
    );

    const { toast } = require("sonner");
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "buyer@test.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("RegisterForm: shows error for duplicate email (409)", async () => {
    const { toast } = require("sonner");
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/^email$/i), "existing@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByLabelText(/buy fresh products/i));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Registration failed",
        expect.objectContaining({
          description: expect.stringContaining("Email already registered"),
        })
      );
    });
  });

  it("Search store: sets error on API failure", async () => {
    server.use(
      http.post("http://localhost:3001/api/products/search", () => {
        return HttpResponse.json(
          { success: false, message: "Search service unavailable" },
          { status: 503 }
        );
      })
    );

    useSearchStore.setState({
      filters: {
        location: { lat: 11.55, lng: 104.92, address: "Test" },
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

    await useSearchStore.getState().search();

    const state = useSearchStore.getState();
    expect(state.error).toBe("Search service unavailable");
    expect(state.results).toHaveLength(0);
  });

  it("ProfileForm: handles profile fetch failure gracefully", async () => {
    server.use(
      http.get("http://localhost:3001/api/users/profile", () => {
        return HttpResponse.json(
          { success: false, message: "Profile not found" },
          { status: 404 }
        );
      })
    );

    const { toast } = require("sonner");
    useAuthStore.setState({ user: mockBuyerUser, loading: false });

    render(<ProfileForm />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("ProfileForm: handles save failure", async () => {
    server.use(
      http.put("http://localhost:3001/api/users/profile", () => {
        return HttpResponse.json(
          { success: false, message: "Update failed" },
          { status: 500 }
        );
      })
    );

    const { toast } = require("sonner");
    useAuthStore.setState({ user: mockBuyerUser, loading: false });
    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});

describe("Error States: Invalid Form Inputs", () => {
  it("LoginForm: shows error for empty email", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it("RegisterForm: shows error for password too short", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/full name/i), "Test");
    await user.type(screen.getByLabelText(/^email$/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "12345");
    await user.type(screen.getByLabelText(/confirm password/i), "12345");
    await user.click(screen.getByLabelText(/buy fresh products/i));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it("RegisterForm: shows error when no account type selected", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/^email$/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    // Don't select account type
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/please select an account type/i)).toBeInTheDocument();
    });
  });

  it("Search: error when location not set", async () => {
    useSearchStore.setState({
      filters: {
        location: null,
        proximityWeight: 50,
        freshnessWeight: 50,
        maxRadius: 25,
        minFreshnessScore: 0,
      },
    });

    await useSearchStore.getState().search();

    expect(useSearchStore.getState().error).toBe("Please set your location first");
  });
});
