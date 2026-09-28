/**
 * Auth constants shared by the BFF route handlers (src/app/api/auth/*), src/proxy.ts and the client.
 * No secrets in here — safe to import anywhere.
 */

/** httpOnly cookie holding the NestJS refresh token. Scoped to /api/auth so it is only sent to the BFF. */
export const REFRESH_COOKIE = "hs_rt";

/**
 * httpOnly marker cookie (value "1", path "/") so src/proxy.ts can cheaply tell "probably signed in"
 * on page requests without ever seeing the refresh token itself.
 */
export const SESSION_COOKIE = "hs_session";

/** Path the refresh-token cookie is scoped to. */
export const REFRESH_COOKIE_PATH = "/api/auth";

/** Fallback lifetime when the refresh token's `exp` can't be read (backend default is 7d). */
export const DEFAULT_REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/** Where users land after signing in when no (safe) `next` param is present. */
export const DEFAULT_AUTHENTICATED_PATH = "/rooms";

export const LOGIN_PATH = "/login";

/** Pages reachable without a session. */
export const PUBLIC_PATHS = ["/login", "/register", "/status"] as const;

/** Pages a signed-in user should be bounced away from. */
export const GUEST_ONLY_PATHS = ["/login", "/register"] as const;

/**
 * Only allow same-site relative redirects ("/rooms/123"), never "//evil.com" or "https://…".
 * Prevents open-redirect attacks through `?next=`.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return DEFAULT_AUTHENTICATED_PATH;
  }
  if (GUEST_ONLY_PATHS.some((p) => next === p || next.startsWith(`${p}?`))) {
    return DEFAULT_AUTHENTICATED_PATH;
  }
  return next;
}
