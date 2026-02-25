/**
 * Integration tests — Register → Complete Profile flow
 *
 * Tests the flow: register new account → profile form loads → update profile.
 */
import React from "react";
import { render, screen, waitFor, userEvent } from "../test-utils";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { useAuthStore } from "@/lib/store";

// ── Mocks ──────────────────────────────────────────────────

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
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));
jest.mock("@/components/profile/LocationSettings", () => ({
  LocationSettings: () => <div data-testid="location-settings">LocationSettings</div>,
}));
jest.mock("@/components/profile/AlgorithmPreferences", () => ({
  AlgorithmPreferences: () => <div data-testid="algorithm-preferences">AlgorithmPreferences</div>,
}));
jest.mock("@/components/profile/PasswordChangeForm", () => ({
  PasswordChangeForm: () => <div data-testid="password-change-form">PasswordChangeForm</div>,
}));
jest.mock("@/components/layout/states", () => ({
  FormSkeleton: () => <div data-testid="form-skeleton">Loading...</div>,
}));

// ── Helpers ────────────────────────────────────────────────

beforeEach(() => {
  pushMock.mockClear();
  useAuthStore.setState({ user: null, loading: false, error: null });
});

// ── Tests ──────────────────────────────────────────────────

describe("Integration: Register → Complete Profile", () => {
  it("registers a new buyer and populates auth store", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/full name/i), "New User");
    await user.type(screen.getByLabelText(/^email$/i), "newuser@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByLabelText(/buy fresh products/i));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      const authState = useAuthStore.getState();
      expect(authState.user).toBeTruthy();
      expect(authState.user!.email).toBe("newuser@test.com");
    });

    expect(pushMock).toHaveBeenCalledWith("/buyer");
  });

  it("after registration, ProfileForm loads user data", async () => {
    // Simulate user just registered
    useAuthStore.setState({
      user: {
        id: 99,
        name: "New User",
        email: "newuser@test.com",
        type: "buyer",
      },
      loading: false,
      error: null,
    });

    render(<ProfileForm />);

    // Profile tab should show the user's data from the API
    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });
  });

  it("user can update their name after registration", async () => {
    const { toast } = require("sonner");
    useAuthStore.setState({
      user: {
        id: 99,
        name: "New User",
        email: "newuser@test.com",
        type: "buyer",
      },
      loading: false,
      error: null,
    });

    render(<ProfileForm />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/full name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Updated User");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
