import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    // Ensure MSW resolves to the correct Node.js export conditions
    customExportConditions: [""],
  },
  roots: ["<rootDir>/src"],
  testMatch: [
    "**/__tests__/**/*.test.{ts,tsx}",
    "**/*.{spec,test}.{ts,tsx}",
  ],
  transform: {
    // Transform TS/TSX source files
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        // Skip type checking for speed; we already run tsc separately
        diagnostics: false,
      },
    ],
    // Transform ESM JS files from node_modules (e.g. until-async, msw internals)
    "node_modules/.+\\.m?js$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: {
    // Handle CSS / style imports
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    // Handle image imports
    "\\.(jpg|jpeg|png|gif|webp|avif|svg)$":
      "<rootDir>/src/__tests__/__mocks__/fileMock.ts",
    // Handle @/ path alias (must come after static asset rules)
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Polyfill fetch globals BEFORE jest-environment-jsdom runs
  setupFiles: ["<rootDir>/jest.polyfills.js"],
  // Setup jest-dom matchers + MSW server AFTER the environment
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  // Ignore node_modules except for packages that ship ESM
  transformIgnorePatterns: [
    "/node_modules/(?!(lucide-react|sonner|until-async|strict-event-emitter)/)",
  ],
  // Collect coverage from source, exclude test infra
  collectCoverageFrom: [
    "src/components/**/*.{ts,tsx}",
    "src/lib/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/**/index.ts",
  ],
};

export default config;
