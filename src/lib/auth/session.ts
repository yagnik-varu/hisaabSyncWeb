/**
 * Client-side session store (browser only).
 *
 * - The access token lives ONLY in this module's memory. Never localStorage (XSS-safe).
 * - The refresh token never reaches JS; the BFF keeps it in an httpOnly cookie.
 * - On page load we "bootstrap": ask the BFF for a fresh access token, then load /auth/me.
 *
 * React reads this store through useSyncExternalStore (see hooks/use-auth.ts).
 */

import { configureApiAuth } from "@/lib/api/client";
import { getMe } from "@/lib/api/endpoints/auth";
import { ApiError, errorFromResponse, normalizeError } from "@/lib/api/errors";
import type { AuthUser, UserProfile } from "@/types/api";

export type AuthStatus =
  | "loading" // bootstrapping — we don't know yet
  | "authenticated"
  | "unauthenticated"
  | "error"; // couldn't reach the server while bootstrapping (e.g. Render cold start)

export interface AuthState {
  status: AuthStatus;
  user: UserProfile | null;
  accessToken: string | null;
  /** Set when status === "error". */
  error: ApiError | null;
  /** true when the user clicked "Log out" (vs. session expiry) — decides whether to keep ?next=. */
  signedOutByUser: boolean;
}

const INITIAL_STATE: AuthState = {
  status: "loading",
  user: null,
  accessToken: null,
  error: null,
  signedOutByUser: false,
};

let state: AuthState = INITIAL_STATE;
const listeners = new Set<() => void>();

function setState(patch: Partial<AuthState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export const authStore = {
  getState: () => state,
  /** Snapshot used during SSR/hydration — always "loading". */
  getServerState: () => INITIAL_STATE,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

// ─── Cross-tab sync ─────────────────────────────────────────────────────────

type AuthMessage = { type: "logout" } | { type: "login" };

let channel: BroadcastChannel | null = null;

function getChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  if (!channel) {
    channel = new BroadcastChannel("hisaabsync-auth");
    channel.onmessage = (event: MessageEvent<AuthMessage>) => {
      if (event.data?.type === "logout") {
        clearSession(true);
      } else if (event.data?.type === "login" && state.status !== "authenticated") {
        bootstrapPromise = null;
        void bootstrapSession();
      }
    };
  }
  return channel;
}

function broadcast(message: AuthMessage) {
  getChannel()?.postMessage(message);
}

/**
 * Serialize refreshes ACROSS TABS with the Web Locks API. Two tabs refreshing with the same
 * cookie at the same moment would make the backend reject the second (token already rotated).
 * Inside the lock the second tab sends the already-rotated cookie, so it succeeds.
 */
function withCrossTabLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request("hisaabsync-auth-refresh", fn) as Promise<T>;
  }
  return fn();
}

// ─── BFF calls ──────────────────────────────────────────────────────────────

async function bffPost<T>(path: string, body?: unknown, accessToken?: string | null): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  try {
    const response = await fetch(path, {
      method: "POST",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
    const text = await response.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    if (!response.ok) throw errorFromResponse(response.status, json);
    return (json as { data: T }).data;
  } catch (error) {
    throw normalizeError(error);
  }
}

// ─── Session operations ─────────────────────────────────────────────────────

let refreshPromise: Promise<string | null> | null = null;

/**
 * Get a new access token from the BFF. Single-flight within the tab, locked across tabs.
 * Resolves null if the session is gone (401); rejects on network/server errors.
 */
export function refreshSession(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = withCrossTabLock(async () => {
      try {
        const { accessToken } = await bffPost<{ accessToken: string }>("/api/auth/refresh");
        setState({ accessToken });
        return accessToken;
      } catch (error) {
        const apiError = normalizeError(error);
        if (apiError.status === 401) return null;
        throw apiError;
      }
    }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function clearSession(signedOutByUser = false) {
  setState({
    status: "unauthenticated",
    user: null,
    accessToken: null,
    error: null,
    signedOutByUser,
  });
}

let bootstrapPromise: Promise<void> | null = null;

/** Restore the session on page load. Runs once per page load (safe under React StrictMode). */
export function bootstrapSession(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      try {
        const token = await refreshSession();
        if (!token) {
          clearSession();
          return;
        }
        const user = await getMe();
        setState({ status: "authenticated", user, error: null });
      } catch (error) {
        const apiError = normalizeError(error);
        if (apiError.status === 401) {
          clearSession();
        } else {
          // Server unreachable / 5xx: keep the cookie, let the user retry.
          setState({ status: "error", error: apiError });
        }
      }
    })();
  }
  return bootstrapPromise;
}

/** Retry after a bootstrap "error" (e.g. the backend was cold-starting). */
export function retryBootstrap() {
  bootstrapPromise = null;
  setState({ status: "loading", error: null });
  return bootstrapSession();
}

/** Shared tail of login/register/google: store the token, load the full profile. */
async function completeSignIn(result: { user: AuthUser; accessToken: string }) {
  setState({ accessToken: result.accessToken });
  const user = await getMe();
  setState({ status: "authenticated", user, error: null, signedOutByUser: false });
  bootstrapPromise = Promise.resolve(); // a later bootstrap call is a no-op
  broadcast({ type: "login" });
  return user;
}

export async function login(input: { email: string; password: string }) {
  const result = await bffPost<{ user: AuthUser; accessToken: string }>("/api/auth/login", input);
  return completeSignIn(result);
}

export async function register(input: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const result = await bffPost<{ user: AuthUser; accessToken: string }>(
    "/api/auth/register",
    input,
  );
  return completeSignIn(result);
}

export async function loginWithGoogle(idToken: string) {
  const result = await bffPost<{ user: AuthUser; accessToken: string }>("/api/auth/google", {
    idToken,
  });
  return completeSignIn(result);
}

export async function logout() {
  try {
    await bffPost("/api/auth/logout", undefined, state.accessToken);
  } finally {
    clearSession(true);
    bootstrapPromise = Promise.resolve();
    broadcast({ type: "logout" });
  }
}

/** Keep the in-memory profile in sync after PATCH /auth/profile. */
export function updateSessionUser(patch: Partial<UserProfile>) {
  if (state.user) setState({ user: { ...state.user, ...patch } });
}

// ─── Wire the API client to this store ──────────────────────────────────────

configureApiAuth({
  getAccessToken: () => state.accessToken,
  refreshAccessToken: refreshSession,
  onSessionExpired: () => {
    if (state.status === "authenticated") clearSession();
  },
});

// Start listening for other tabs as soon as this module loads in the browser.
getChannel();
