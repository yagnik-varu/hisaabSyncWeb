"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribe to a CSS media query. On the server (and during hydration) `serverValue` is used, so
 * only use this for things that render after interaction (dialogs, sheets) or tolerate a switch.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** Below Tailwind's `md` breakpoint (768px): phones and small tablets in portrait. */
export function useIsMobile() {
  return useMediaQuery("(max-width: 767.98px)");
}
