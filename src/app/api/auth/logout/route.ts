import { NextResponse, type NextRequest } from "next/server";

import { REFRESH_COOKIE } from "@/lib/auth/constants";
import { callBackend, clearSessionCookies, forbiddenOrigin, isSameOrigin } from "@/lib/auth/server";
import type { TokenPair } from "@/types/api";

/**
 * POST /api/auth/logout
 * Revokes the refresh token in NestJS, then clears our cookies. Always succeeds for the browser —
 * even if the backend is unreachable, the local session is ended.
 *
 * NestJS /auth/logout needs a valid access token. If the one the browser sent is expired, we
 * refresh first (rotating the token) and revoke the NEW refresh token, so nothing valid is left behind.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (refreshToken) {
    let result = await callBackend("/auth/logout", {
      body: { refreshToken },
      accessToken,
      request,
    });

    if (result.status === 401) {
      const refreshed = await callBackend<{ data?: TokenPair }>("/auth/refresh", {
        body: { refreshToken },
        request,
      });
      const tokens = refreshed.body?.data;
      if (refreshed.ok && tokens?.accessToken && tokens.refreshToken) {
        result = await callBackend("/auth/logout", {
          body: { refreshToken: tokens.refreshToken },
          accessToken: tokens.accessToken,
          request,
        });
      }
    }
    // Any remaining failure is ignored on purpose: the user asked to sign out, so we sign them out.
  }

  const response = NextResponse.json({ success: true, message: "Logged out", data: {} });
  clearSessionCookies(response);
  return response;
}
