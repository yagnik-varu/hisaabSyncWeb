import { NextResponse, type NextRequest } from "next/server";

import { REFRESH_COOKIE } from "@/lib/auth/constants";
import {
  callBackend,
  clearSessionCookies,
  forbiddenOrigin,
  isSameOrigin,
  relayError,
  setSessionCookies,
} from "@/lib/auth/server";
import type { TokenPair } from "@/types/api";

/**
 * POST /api/auth/refresh
 * Reads the refresh token from the httpOnly cookie, exchanges it with NestJS (which ROTATES it),
 * stores the new refresh token back in the cookie and returns only the new access token.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    const response = NextResponse.json(
      {
        success: false,
        error: { code: "AUTH_REFRESH_TOKEN_INVALID", message: "Not signed in.", details: [] },
      },
      { status: 401 },
    );
    clearSessionCookies(response); // drop a stale hs_session marker, if any
    return response;
  }

  const result = await callBackend<{ data?: TokenPair }>("/auth/refresh", {
    body: { refreshToken },
    request,
  });

  if (!result.ok) {
    const response = relayError(result);
    // Only a definitive auth failure ends the session. A 502/503 (backend asleep) must NOT log the user out.
    if (result.status === 401) clearSessionCookies(response);
    return response;
  }

  const tokens = result.body?.data;
  if (!tokens?.accessToken || !tokens.refreshToken) {
    const response = NextResponse.json(
      {
        success: false,
        error: {
          code: "UNKNOWN_ERROR",
          message: "Unexpected response from the server.",
          details: [],
        },
      },
      { status: 502 },
    );
    return response;
  }

  const response = NextResponse.json({
    success: true,
    message: "Token refreshed",
    data: { accessToken: tokens.accessToken },
  });
  setSessionCookies(response, tokens.refreshToken);
  return response;
}
