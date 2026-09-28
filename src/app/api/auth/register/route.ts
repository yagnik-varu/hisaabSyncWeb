import type { NextRequest } from "next/server";

import { exchangeCredentials } from "@/lib/auth/server";

/** POST /api/auth/register → NestJS POST /auth/register (201), then signed in like login. */
export function POST(request: NextRequest) {
  return exchangeCredentials(
    request,
    "/auth/register",
    ["fullName", "email", "password", "phone"],
    201,
  );
}
