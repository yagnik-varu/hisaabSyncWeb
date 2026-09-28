/**
 * Thin fetch wrapper for the HisaabSync NestJS API (browser side).
 *
 * Responsibilities:
 * - Build URLs from PUBLIC_API_URL + path + query params.
 * - Attach `Authorization: Bearer <accessToken>` (token comes from the auth layer via configureApiAuth).
 * - Unwrap the `{ success, message, data }` envelope and normalize pagination meta.
 * - On 401: refresh the access token ONCE (single-flight) and retry the request once.
 * - Turn every failure into an ApiError (see ./errors.ts).
 *
 * Components never call this directly — use the functions in lib/api/endpoints/*.
 */

import { PUBLIC_API_URL } from "@/lib/env";
import { ApiError, errorFromResponse, normalizeError } from "@/lib/api/errors";
import type { PageMeta, Paginated } from "@/types/api";

// ─── Auth hooks (wired up by the auth layer in Phase 1) ─────────────────────

export interface ApiAuthHooks {
  /** Current in-memory access token, or null when signed out. */
  getAccessToken: () => string | null;
  /**
   * Obtain a fresh access token via the BFF cookie.
   * - Resolves null when the session is definitively gone (401).
   * - Rejects on network/5xx errors (backend asleep) — that must NOT log the user out.
   * MUST be single-flight (see lib/auth/session.ts#refreshSession): the backend rotates refresh
   * tokens, so two parallel refreshes would invalidate each other.
   */
  refreshAccessToken: () => Promise<string | null>;
  /** Called when a request is still unauthorized after a refresh attempt. */
  onSessionExpired: () => void;
}

let authHooks: ApiAuthHooks = {
  getAccessToken: () => null,
  refreshAccessToken: async () => null,
  onSessionExpired: () => {},
};

export function configureApiAuth(hooks: Partial<ApiAuthHooks>) {
  authHooks = { ...authHooks, ...hooks };
}

// ─── Request core ───────────────────────────────────────────────────────────

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
  /** Send the Bearer token and retry on 401 (default true). */
  auth?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(`${PUBLIC_API_URL}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      // Skip empty filters so the backend's validators never see "" for enums/UUIDs.
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function send(path: string, options: RequestOptions, token: string | null) {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    cache: "no-store",
  });
}

/** Perform a request and return the parsed JSON body (envelope NOT unwrapped). */
export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const useAuth = options.auth ?? true;

  try {
    let response = await send(path, options, useAuth ? authHooks.getAccessToken() : null);

    if (response.status === 401 && useAuth) {
      // Throws on network errors → surfaces as NETWORK_ERROR without ending the session.
      const newToken = await authHooks.refreshAccessToken();
      if (newToken) {
        response = await send(path, options, newToken);
      }
      if (response.status === 401) {
        authHooks.onSessionExpired();
      }
    }

    const body = await parseJson(response);
    if (!response.ok) {
      throw errorFromResponse(response.status, body);
    }
    return body as T;
  } catch (error) {
    // Let callers' AbortController cancellations pass through untouched (TanStack Query relies on it).
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw normalizeError(error);
  }
}

// ─── Envelope helpers ───────────────────────────────────────────────────────

interface Envelope<T> {
  data: T;
  meta?: Partial<PageMeta> & { total?: number };
}

/**
 * Normalize both backend meta shapes into PageMeta:
 *  - standard: { page, limit, totalItems, totalPages, hasNextPage, hasPreviousPage }
 *  - activity/audit: { total, page, limit, totalPages }
 */
function normalizeMeta(meta: Envelope<unknown>["meta"], itemCount: number): PageMeta {
  const page = meta?.page ?? 1;
  const limit = meta?.limit ?? (itemCount || 20);
  const totalItems = meta?.totalItems ?? meta?.total ?? itemCount;
  const totalPages = meta?.totalPages ?? Math.max(1, Math.ceil(totalItems / limit));
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: meta?.hasNextPage ?? page < totalPages,
    hasPreviousPage: meta?.hasPreviousPage ?? page > 1,
  };
}

async function unwrap<T>(path: string, options: RequestOptions): Promise<T> {
  const body = await apiRequest<Envelope<T>>(path, options);
  return (body?.data ?? null) as T;
}

export const api = {
  /** GET → returns `data` from the envelope. */
  get: <T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    unwrap<T>(path, { ...options, method: "GET" }),

  /** GET a paginated list → `{ data, meta }` with normalized meta. */
  getPage: async <T>(
    path: string,
    options: Omit<RequestOptions, "method" | "body"> = {},
  ): Promise<Paginated<T>> => {
    const body = await apiRequest<Envelope<T[]>>(path, { ...options, method: "GET" });
    const data = Array.isArray(body?.data) ? body.data : [];
    return { data, meta: normalizeMeta(body?.meta, data.length) };
  },

  post: <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    unwrap<T>(path, { ...options, method: "POST", body }),

  patch: <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    unwrap<T>(path, { ...options, method: "PATCH", body }),

  delete: <T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    unwrap<T>(path, { ...options, method: "DELETE" }),

  /** For endpoints that are not wrapped in the envelope (e.g. GET /health). */
  raw: <T>(path: string, options: RequestOptions = {}) => apiRequest<T>(path, options),
};

export { ApiError };
