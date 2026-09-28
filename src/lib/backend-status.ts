/**
 * Tiny global store: is the backend reachable?
 *
 * Flipped to "down" by the QueryCache/MutationCache error hooks (providers.tsx) whenever a request
 * fails with a network error or 502/503/504 — typical when the Render free tier is cold-starting.
 * The BackendStatusBanner then pings /health until it answers and flips it back to "up".
 */
import { ApiError } from "@/lib/api/errors";

export type BackendStatus = "up" | "down";

let status: BackendStatus = "up";
const listeners = new Set<() => void>();

function set(next: BackendStatus) {
  if (status === next) return;
  status = next;
  listeners.forEach((l) => l());
}

export const backendStatus = {
  get: () => status,
  getServer: (): BackendStatus => "up",
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  markDown: () => set("down"),
  markUp: () => set("up"),
};

/** Errors that mean "server unreachable" rather than "your request was wrong". */
export function isUnreachableError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return (
    error.code === "NETWORK_ERROR" ||
    error.code === "BACKEND_UNREACHABLE" ||
    [502, 503, 504].includes(error.status)
  );
}
