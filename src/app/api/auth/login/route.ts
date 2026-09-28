import type { NextRequest } from "next/server";

import { exchangeCredentials } from "@/lib/auth/server";

/** POST /api/auth/login → NestJS POST /auth/login, refresh token stored in httpOnly cookie. */
export function POST(request: NextRequest) {
  return exchangeCredentials(request, "/auth/login", ["email", "password"]);
}
