import type { NextRequest } from "next/server";

import { exchangeCredentials } from "@/lib/auth/server";

/** POST /api/auth/google → NestJS POST /auth/google with a Google Identity Services ID token. */
export function POST(request: NextRequest) {
  return exchangeCredentials(request, "/auth/google", ["idToken"]);
}
