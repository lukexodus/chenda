/**
 * Jest polyfills for MSW v2 compatibility.
 *
 * jest-environment-jsdom strips fetch-related globals (Request, Response, etc.)
 * MSW v2 needs them, so we polyfill from Node builtins before anything else runs.
 *
 * @see https://mswjs.io/docs/faq/#requestresponsetextencoder-is-not-defined-jest
 */

// 1. TextEncoder / TextDecoder
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TextDecoder, TextEncoder } = require("node:util");

Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder, writable: true },
  TextEncoder: { value: TextEncoder, writable: true },
});

// 2. Web Streams – must be defined BEFORE importing undici
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ReadableStream, WritableStream, TransformStream } = require("node:stream/web");

Object.defineProperties(globalThis, {
  ReadableStream: { value: ReadableStream, writable: true },
  WritableStream: { value: WritableStream, writable: true },
  TransformStream: { value: TransformStream, writable: true },
});

// 3. BroadcastChannel, MessageChannel, MessagePort (needed by undici / MSW)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { BroadcastChannel, MessageChannel, MessagePort } = require("node:worker_threads");

for (const [name, value] of Object.entries({ BroadcastChannel, MessageChannel, MessagePort })) {
  if (typeof globalThis[name] === "undefined") {
    Object.defineProperty(globalThis, name, { value, writable: true });
  }
}

// 4. ResizeObserver – required by Radix UI components in jsdom
class ResizeObserverPolyfill {
  constructor(cb) { this._cb = cb; }
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = ResizeObserverPolyfill;
}

// 5. Fetch API globals from undici
// eslint-disable-next-line @typescript-eslint/no-require-imports
const undici = require("undici");

Object.defineProperties(globalThis, {
  fetch: { value: undici.fetch, writable: true, configurable: true },
  Headers: { value: undici.Headers, writable: true, configurable: true },
  FormData: { value: undici.FormData, writable: true, configurable: true },
  Request: { value: undici.Request, writable: true, configurable: true },
  Response: { value: undici.Response, writable: true, configurable: true },
});
