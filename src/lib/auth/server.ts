/**
 * Server-only helpers for the auth BFF route handlers (src/app/api/auth/*).
 *
 * The BFF exists so the refresh token lives in an httpOnly cookie that JavaScript can never read
 * (XSS can't steal it). The browser talks to these handlers; they talk to NestJS.
 */
import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import {
  DEFAULT_REFRESH_MAX_AGE_SECONDS,
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
  SESSION_COOKIE,
} from "@/lib/auth/constants";
import { getServerApiUrl } from "@/lib/env";

const isProduction = process.env.NODE_ENV === "production";

export interface BackendResult<T = unknown> {
  ok: boolean;
  status: number;
  body: T | null;
}

/**
 * POST to the NestJS API from the server. Never throws: network failures become a 502 result
 * with a standard error envelope so the browser-side normalizer handles them like any API error.
 */
export async function callBackend<T = unknown>(
  path: string,
  options: { body?: unknown; accessToken?: string | null; request?: NextRequest } = {},
): Promise<BackendResult<T>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

  // Pass the real client IP along. NestJS doesn't trust proxies yet (docs/05 #16), but this is
  // what it needs once `trust proxy` is enabled so rate limits apply per user, not per BFF server.
  const forwardedFor = options.request?.headers.get("x-forwarded-for");
  if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;

  try {
    const response = await fetch(`${getServerApiUrl()}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(options.body ?? {}),
      cache: "no-store",
    });
    const text = await response.text();
    let body: T | null = null;
    try {
      body = text ? (JSON.parse(text) as T) : null;
    } catch {
      body = null;
    }
    return { ok: response.ok, status: response.status, body };
  } catch {
    return {
      ok: false,
      status: 502,
      body: errorBody(
        "BACKEND_UNREACHABLE",
        "Can't reach the HisaabSync server. It may be starting up — try again in a moment.",
      ) as T,
    };
  }
}

/** Standard error envelope, identical in shape to what NestJS returns. */
export function errorBody(code: string, message: string) {
  return { success: false, error: { code, message, details: [] } };
}

export function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(errorBody(code, message), { status });
}

/** Relay a failed backend response to the browser unchanged (status + envelope). */
export function relayError(result: BackendResult) {
  return NextResponse.json(
    result.body ?? errorBody("UNKNOWN_ERROR", "Something went wrong. Please try again."),
    { status: result.status || 500 },
  );
}

/** Read `exp` from a JWT without verifying it (NestJS already verified/issued it). */
function secondsUntilExpiry(jwt: string): number {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8")) as {
      exp?: number;
    };
    if (typeof payload.exp === "number") {
      return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_REFRESH_MAX_AGE_SECONDS;
}

export function setSessionCookies(response: NextResponse, refreshToken: string) {
  const maxAge = secondsUntilExpiry(refreshToken);
  response.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge,
  });
  response.cookies.set(SESSION_COOKIE, "1", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(REFRESH_COOKIE, "", { path: REFRESH_COOKIE_PATH, maxAge: 0 });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

/** Parse a JSON request body safely; returns {} on invalid JSON. */
export async function readJson(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Keep only whitelisted keys (backend rejects unknown fields with 400). */
export function pick(source: Record<string, unknown>, keys: string[]) {
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== "") result[key] = source[key];
  }
  return result;
}

/**
 * CSRF defence in depth: SameSite=Lax already stops cross-site POSTs from carrying our cookies,
 * but we also reject requests whose Origin header is present and doesn't match this host.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin fetches from some browsers omit Origin on POST
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export function forbiddenOrigin() {
  return errorResponse(403, "CSRF_ORIGIN_MISMATCH", "Request origin not allowed.");
}

interface AuthPayload {
  data?: {
    user?: { id: string; fullName: string; email: string };
    accessToken?: string;
    refreshToken?: string;
  };
  message?: string;
}

/**
 * Shared flow for login / register / google:
 * forward whitelisted fields to NestJS → on success put the refresh token in the httpOnly cookie
 * and return ONLY { user, accessToken } to the browser.
 */
export async function exchangeCredentials(
  request: NextRequest,
  backendPath: string,
  allowedKeys: string[],
  successStatus = 200,
) {
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const body = pick(await readJson(request), allowedKeys);
  const result = await callBackend<AuthPayload>(backendPath, { body, request });
  if (!result.ok) return relayError(result);

  const data = result.body?.data;
  if (!data?.accessToken || !data.refreshToken || !data.user) {
    return errorResponse(502, "UNKNOWN_ERROR", "Unexpected response from the server.");
  }

  const response = NextResponse.json(
    {
      success: true,
      message: result.body?.message ?? "Signed in",
      data: { user: data.user, accessToken: data.accessToken },
    },
    { status: successStatus },
  );
  setSessionCookies(response, data.refreshToken);
  return response;
}
