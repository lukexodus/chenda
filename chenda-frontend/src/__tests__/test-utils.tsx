/**
 * Custom render utility that wraps components with all necessary providers.
 *
 * Usage:
 *   import { render, screen } from "../test-utils";
 */
import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Re-export everything from RTL so tests import from one place
export * from "@testing-library/react";
export { userEvent };

/**
 * Minimal wrapper — the app mainly relies on zustand stores (no React context
 * providers needed) and MSW handles API mocking at the network level.
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * Custom render that wraps the component in providers.
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Override the default render
export { customRender as render };
