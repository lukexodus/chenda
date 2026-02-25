/**
 * Jest global setup
 * – Extends expect with DOM matchers (@testing-library/jest-dom)
 * – Starts the MSW mock server before each suite
 */
import "@testing-library/jest-dom";
import { server } from "./mocks/server";

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Reset handlers between tests so one test doesn't bleed into another
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());

// Silence console.error in tests (optional – comment out for debugging)
// const originalError = console.error;
// beforeAll(() => { console.error = jest.fn(); });
// afterAll(() => { console.error = originalError; });
