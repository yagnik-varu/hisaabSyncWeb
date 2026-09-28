/**
 * Error normalization for the HisaabSync API.
 *
 * Why this exists: the backend returns errors in two different forms (docs/05 issue #5):
 *   1. { code: "TREASURY_INSUFFICIENT_BALANCE", message: "Treasury balance is…" }   ← proper
 *   2. { code: "HTTP_EXCEPTION" | "VALIDATION_FAILED", message: "AUTH_INVALID_CREDENTIALS" } ← code hidden in message
 * normalizeError() turns both (plus network failures and unknown throws) into one ApiError
 * so components only ever check `error.code`.
 */

import type { ApiErrorBody } from "@/types/api";

/** Codes produced by the client itself (never sent by the backend). */
export const CLIENT_ERROR_CODES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

const GENERIC_CODES = new Set(["HTTP_EXCEPTION", "VALIDATION_FAILED", "INTERNAL_SERVER_ERROR"]);
const CODE_LIKE = /^[A-Z][A-Z0-9_]+$/;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** Raw validation messages from class-validator (strings), if any. */
  readonly details: string[];

  constructor(params: { status: number; code: string; message: string; details?: string[] }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.code = params.code;
    this.details = params.details ?? [];
  }

  get isValidation() {
    return this.code === "VALIDATION_FAILED" && this.details.length > 0;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
}

function isErrorBody(body: unknown): body is ApiErrorBody {
  return (
    typeof body === "object" &&
    body !== null &&
    (body as ApiErrorBody).success === false &&
    typeof (body as ApiErrorBody).error === "object"
  );
}

/** Human-friendly fallback messages for codes whose backend message is just the code itself. */
const FRIENDLY_MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: "Invalid email or password.",
  AUTH_EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
  AUTH_INVALID_TOKEN: "Your session is invalid. Please sign in again.",
  AUTH_EXPIRED_TOKEN: "Your session has expired. Please sign in again.",
  AUTH_REFRESH_TOKEN_INVALID: "Your session has expired. Please sign in again.",
  AUTH_GOOGLE_TOKEN_INVALID: "Google sign-in failed. Please try again.",
  AUTH_GOOGLE_EMAIL_NOT_VERIFIED: "Your Google email address is not verified.",
  AUTH_NO_PASSWORD_SET: "This account signs in with Google and has no password to change.",
  CONTRIBUTION_NOT_FOUND: "This contribution no longer exists.",
  CONTRIBUTION_ACCESS_DENIED: "You can only cancel your own contributions.",
  CONTRIBUTION_CANNOT_CANCEL: "Only pending contributions can be cancelled.",
  CONTRIBUTION_ALREADY_PROCESSED: "This contribution has already been processed.",
  TREASURY_ACCOUNT_NOT_FOUND: "Treasury account not found for this room.",
  // Generic Prisma codes from the global filter (raw messages are too technical to show).
  RESOURCE_ALREADY_EXISTS: "That already exists or was already processed. Refresh and try again.",
  RESOURCE_NOT_FOUND: "That item no longer exists. Refresh and try again.",
  [CLIENT_ERROR_CODES.NETWORK_ERROR]:
    "Can't reach the server. Check your connection or try again shortly.",
  [CLIENT_ERROR_CODES.RATE_LIMITED]: "Too many requests. Please wait a minute and try again.",
  [CLIENT_ERROR_CODES.UNKNOWN_ERROR]: "Something went wrong. Please try again.",
};

/** Convert an HTTP status + parsed JSON body into an ApiError. */
export function errorFromResponse(status: number, body: unknown): ApiError {
  if (status === 429) {
    return new ApiError({
      status,
      code: CLIENT_ERROR_CODES.RATE_LIMITED,
      message: FRIENDLY_MESSAGES.RATE_LIMITED,
    });
  }

  if (!isErrorBody(body)) {
    return new ApiError({
      status,
      code: CLIENT_ERROR_CODES.UNKNOWN_ERROR,
      message: FRIENDLY_MESSAGES.UNKNOWN_ERROR,
    });
  }

  const { code: rawCode, message: rawMessage } = body.error;
  const details = Array.isArray(body.error.details)
    ? body.error.details.filter((d): d is string => typeof d === "string")
    : [];
  const message = typeof rawMessage === "string" ? rawMessage : String(rawMessage ?? "");

  // Quirk: real code hidden in `message` when `code` is generic and there are no validation details.
  let code = rawCode || CLIENT_ERROR_CODES.UNKNOWN_ERROR;
  if (GENERIC_CODES.has(code) && details.length === 0 && CODE_LIKE.test(message)) {
    code = message;
  }

  // Prefer our friendly text; else the backend's sentence; never show a bare CODE to users.
  const friendly =
    FRIENDLY_MESSAGES[code] ||
    (CODE_LIKE.test(message) ? "" : message) ||
    FRIENDLY_MESSAGES.UNKNOWN_ERROR;

  return new ApiError({ status, code, message: friendly, details });
}

/** Normalize anything thrown (ApiError, fetch TypeError, random values) into an ApiError. */
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  // fetch() rejects with a TypeError on network failure / CORS / DNS problems.
  if (error instanceof TypeError) {
    return new ApiError({
      status: 0,
      code: CLIENT_ERROR_CODES.NETWORK_ERROR,
      message: FRIENDLY_MESSAGES.NETWORK_ERROR,
    });
  }

  return new ApiError({
    status: 0,
    code: CLIENT_ERROR_CODES.UNKNOWN_ERROR,
    message:
      error instanceof Error && error.message ? error.message : FRIENDLY_MESSAGES.UNKNOWN_ERROR,
  });
}

/**
 * Map class-validator messages ("amount must be a positive number…") to form fields.
 * The field name is the first word of each message.
 */
export function validationDetailsToFieldErrors(details: string[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const detail of details) {
    // forbidNonWhitelisted produces "property <name> should not exist".
    const unknownProperty = /^property (\S+) should not exist$/.exec(detail);
    const field = unknownProperty ? unknownProperty[1] : detail.split(" ")[0];
    if (field && !fieldErrors[field]) fieldErrors[field] = detail;
  }
  return fieldErrors;
}
