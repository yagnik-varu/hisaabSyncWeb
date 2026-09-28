/**
 * Route protection (Next.js 16 "proxy", formerly middleware).
 *
 * This is a CHEAP check only: "is the hs_session marker cookie present?". It doesn't validate
 * anything — real validation happens when the client bootstraps the session via /api/auth/refresh.
 * If the cookie is stale, the refresh fails, the BFF clears the cookies, and the client redirects
 * to /login, so there's no redirect loop.
 */
import { NextResponse, type NextRequest } from "next/server";

import {
  DEFAULT_AUTHENTICATED_PATH,
  GUEST_ONLY_PATHS,
  LOGIN_PATH,
  PUBLIC_PATHS,
  SESSION_COOKIE,
} from "@/lib/auth/constants";

function matches(pathname: string, paths: readonly string[]) {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  // Signed-in users don't need the login/register pages.
  if (hasSession && matches(pathname, GUEST_ONLY_PATHS)) {
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_PATH, request.url));
  }

  // Everything that isn't public requires a session.
  if (!hasSession && !matches(pathname, PUBLIC_PATHS)) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Skip BFF/API routes, Next internals and any file with an extension (favicon, images…).
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
