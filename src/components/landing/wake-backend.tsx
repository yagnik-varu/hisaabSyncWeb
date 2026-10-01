"use client";

import { useEffect } from "react";

import { getHealth } from "@/lib/api/endpoints/health";

/**
 * Renders nothing. Fires one GET /health when the landing page opens, so the Render free-tier
 * backend starts waking up while the visitor is still reading (a cold start takes ~30–60 s).
 * By the time they reach login/register the API is usually ready.
 *
 * Deliberately NOT a useQuery: a failed query would go through the global QueryCache onError and
 * show the "Can't reach the server" banner on a page that doesn't need the backend at all.
 * The result doesn't matter here, so errors are swallowed.
 */
export function WakeBackend() {
  useEffect(() => {
    const controller = new AbortController();
    getHealth(controller.signal).catch(() => {});
    return () => controller.abort();
  }, []);

  return null;
}
