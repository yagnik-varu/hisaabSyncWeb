/**
 * Glue between API errors and React Hook Form.
 */
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { normalizeError, validationDetailsToFieldErrors, type ApiError } from "@/lib/api/errors";

/**
 * Put a failed request's error onto the form:
 * - class-validator details → the matching fields (if the form has them)
 * - known codes → a specific field via `codeToField` (e.g. AUTH_EMAIL_ALREADY_EXISTS → "email")
 * - everything else → the form-level "root.server" error
 * Returns the normalized ApiError for any extra handling.
 */
export function applyApiErrorToForm<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  options: { fields?: readonly Path<T>[]; codeToField?: Partial<Record<string, Path<T>>> } = {},
): ApiError {
  const apiError = normalizeError(error);
  const fields = new Set<string>(options.fields ?? []);

  const mappedField = options.codeToField?.[apiError.code];
  if (mappedField) {
    setError(mappedField, { type: "server", message: apiError.message }, { shouldFocus: true });
    return apiError;
  }

  if (apiError.isValidation) {
    const fieldErrors = validationDetailsToFieldErrors(apiError.details);
    const unmatched: string[] = [];
    for (const [field, message] of Object.entries(fieldErrors)) {
      if (fields.has(field)) {
        setError(field as Path<T>, { type: "server", message });
      } else {
        unmatched.push(message);
      }
    }
    if (unmatched.length) {
      setError("root.server" as Path<T>, { type: "server", message: unmatched.join(". ") });
    }
    return apiError;
  }

  setError("root.server" as Path<T>, { type: "server", message: apiError.message });
  return apiError;
}
