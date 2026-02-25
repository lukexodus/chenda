/**
 * ProfileForm component tests
 *
 * Covers:
 * - Rendering profile tab with name, email, account type, save button
 * - Fetching profile on mount
 * - Updating name and saving
 * - Email field is read-only
 * - Tab navigation (Profile, Location, Preferences, Security)
 */
import React from "react";
import { render, screen, waitFor, userEvent } from "../../test-utils";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { useAuthStore } from "@/lib/store";
import { mockBuyerUser } from "../../mocks/handlers";

// ── Mocks ──────────────────────────────────────────────────

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => "/profile",
}));

// Mock sub-tab components to keep tests focused on ProfileForm itself
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
  useAuthStore.setState({
    user: mockBuyerUser,
    loading: false,
    error: null,
  });
});

// ── Tests ──────────────────────────────────────────────────

describe("ProfileForm", () => {
  it("renders the profile tab with all fields after loading", async () => {
    render(<ProfileForm />);

    // Wait for profile to load (API call)
    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByText(/account type/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("renders all four navigation tabs", async () => {
    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /profile/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("tab", { name: /location/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /preferences/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /security/i })).toBeInTheDocument();
  });

  it("displays user's name and email from API response", async () => {
    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Buyer")).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("buyer@test.com")).toBeInTheDocument();
  });

  it("email field is disabled (read-only)", async () => {
    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeDisabled();
    });
  });

  it("can update name and save profile", async () => {
    const { toast } = require("sonner");
    const user = userEvent.setup();
    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Buyer")).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/full name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Name");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("shows validation error when saving empty name", async () => {
    const { toast } = require("sonner");
    const user = userEvent.setup();
    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Buyer")).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/full name/i);
    await user.clear(nameInput);

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Validation Error", expect.any(Object));
    });
  });

  it("shows avatar initials from user name", async () => {
    render(<ProfileForm />);

    await waitFor(() => {
      // "Test Buyer" → "TB"
      expect(screen.getByText("TB")).toBeInTheDocument();
    });
  });

  it("switches to Location tab", async () => {
    const user = userEvent.setup();
    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /location/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("tab", { name: /location/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location-settings")).toBeInTheDocument();
    });
  });

  it("switches to Security tab", async () => {
    const user = userEvent.setup();
    render(<ProfileForm />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /security/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("tab", { name: /security/i }));

    await waitFor(() => {
      expect(screen.getByTestId("password-change-form")).toBeInTheDocument();
    });
  });
});
