/**
 * Central place to read environment variables.
 *
 * NEXT_PUBLIC_* values are inlined into the browser bundle at build time, so they must be
 * referenced literally (`process.env.NEXT_PUBLIC_API_URL`), never via a dynamic key.
 */

const DEFAULT_API_URL = "http://localhost:3000/api/v1";

function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

/** Base URL the browser uses to call the NestJS API directly. */
export const PUBLIC_API_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL,
);

/** Google Identity Services client ID. Empty string = Google sign-in disabled. */
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

/**
 * Base URL used by Next.js route handlers (server only). Falls back to the public URL
 * so a single variable is enough for local development.
 */
export function getServerApiUrl() {
  return stripTrailingSlash(process.env.API_URL || PUBLIC_API_URL);
}
