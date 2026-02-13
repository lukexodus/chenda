import { useEffect, useState } from "react";

/**
 * Hook to safely use browser APIs (avoids SSR hydration mismatches).
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
