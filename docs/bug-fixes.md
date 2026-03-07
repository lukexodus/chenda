## Bug Fix 1: Product Images Not Displaying

**Date:** 2026-03-07  
**Affected:** `ProductTable`, `ProductForm`, `ProductCard`, `ProductDetail`

---

### Root Causes

#### 1. Next.js `<Image>` blocks private IP addresses
Next.js's `<Image>` component proxies external images through `/_next/image`. In Next.js 16, this proxy **refuses to fetch from private IPs** (`127.0.0.1`, `::1`), even if `remotePatterns` in `next.config.ts` explicitly allows the hostname. Adding `unoptimized` is supposed to bypass this but was unreliable.

**Lesson:** Never use `next/image` `<Image>` for cross-origin images served from `localhost` in development. Use a plain `<img>` tag or a proxy rewrite instead.

---

#### 2. `NEXT_PUBLIC_` env vars are not reliably inlined by Turbopack in dev mode
The fix used `process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"` to build full image URLs. Turbopack did not inline the env var consistently, causing `API_URL` to be `undefined`. The resulting URL `"undefined/uploads/..."` is a truthy non-empty string — so the `<img src>` rendered with a broken URL that produced no network request and no error.

**Lesson:** Do not rely on `NEXT_PUBLIC_*` env vars being available inside helper functions that run at module-init time in Turbopack dev. Prefer same-origin relative paths via rewrites.

---

#### 3. Constants/functions placed between `import` statements confuse Turbopack
`ProductTable.tsx` had this structure:
```js
import { useState } from "react";
// ...

const API_URL = ...;      // ← non-import code mid-imports
function getImageSrc() {}

import { Button } from "@/components/ui/button"; // ← imports resume