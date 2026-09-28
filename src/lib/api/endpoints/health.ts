import { api } from "@/lib/api/client";
import type { HealthCheckResult } from "@/types/api";

/**
 * GET /health — public, NOT wrapped in the success envelope (raw @nestjs/terminus output).
 * When the DB is down the backend answers 503, which the client throws as ApiError(status 503).
 */
export function getHealth(signal?: AbortSignal) {
  return api.raw<HealthCheckResult>("/health", { auth: false, signal });
}
