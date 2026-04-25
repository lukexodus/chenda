
# Bug Fix 1: Product Images Not Displaying

**Date:** 2026-03-07  
**Affected:** `ProductTable`, `ProductForm`, `ProductCard`, `ProductDetail`

---

## Root Causes

### 1. Next.js `<Image>` blocks private IP addresses
Next.js's `<Image>` component proxies external images through `/_next/image`. In Next.js 16, this proxy **refuses to fetch from private IPs** (`127.0.0.1`, `::1`), even if `remotePatterns` in `next.config.ts` explicitly allows the hostname. Adding `unoptimized` is supposed to bypass this but was unreliable.

**Lesson:** Never use `next/image` `<Image>` for cross-origin images served from `localhost` in development. Use a plain `<img>` tag or a proxy rewrite instead.

---

### 2. `NEXT_PUBLIC_` env vars are not reliably inlined by Turbopack in dev mode
The fix used `process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"` to build full image URLs. Turbopack did not inline the env var consistently, causing `API_URL` to be `undefined`. The resulting URL `"undefined/uploads/..."` is a truthy non-empty string — so the `<img src>` rendered with a broken URL that produced no network request and no error.

**Lesson:** Do not rely on `NEXT_PUBLIC_*` env vars being available inside helper functions that run at module-init time in Turbopack dev. Prefer same-origin relative paths via rewrites.

---

### 3. Constants/functions placed between `import` statements confuse Turbopack
`ProductTable.tsx` had this structure:

```js
import { useState } from "react";
// ...

const API_URL = ...;      // ← non-import code mid-imports
function getImageSrc() {}

import { Button } from "@/components/ui/button"; // ← imports resume
```
While standard JS hoists `import` declarations, Turbopack's module graph builder processed this non-standard ordering incorrectly. `API_URL` evaluated at the wrong time.

**Lesson:** Always keep all `import` statements at the very top of the file before any `const`, `function`, or other declarations.

---

### 4. Turbopack cache persists stale compiled code
After fixing source files, the `.next/dev/cache/turbopack/` directory retained compiled chunks from before the fix. The dev server used those cached chunks instead of recompiling, making it appear the fix had no effect.

**Lesson:** When a source-level fix appears to have no effect after a dev server restart, delete `.next/` entirely and restart. This forces a full recompile from source.

```bash
rm -rf chenda-frontend/.next
```

---

## The Fix

Added a **Next.js rewrite** in next.config.ts that proxies `/uploads/*` requests to the backend:

```ts
async rewrites() {
  return [
    {
      source: "/uploads/:path*",
      destination: "http://localhost:3001/uploads/:path*",
    },
  ];
},
```

This makes image URLs same-origin (`http://localhost:3000/uploads/...`), eliminating all private IP blocking, CORP concerns, and env var dependency. The `<img src="/uploads/products/image.jpg">` relative path just works.
