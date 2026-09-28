/**
 * Date helpers for filters.
 *
 * <input type="date"> gives "YYYY-MM-DD" in the user's local calendar. The backend compares
 * `createdAt >= dateFrom` and `createdAt <= dateTo`, so a bare "2026-09-28" as dateTo would mean
 * midnight at the START of that day and silently drop the whole day. We send exact instants:
 * start of the local day for "from", end of the local day for "to".
 */
import { endOfDay, format, isValid, parse, startOfDay } from "date-fns";

const DATE_INPUT_FORMAT = "yyyy-MM-dd";

function parseDateInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = parse(value, DATE_INPUT_FORMAT, new Date());
  return isValid(date) ? date : null;
}

/** "2026-09-01" → ISO string at 00:00:00.000 local time (or undefined). */
export function dateInputToStartIso(value: string | null | undefined): string | undefined {
  const date = parseDateInput(value);
  return date ? startOfDay(date).toISOString() : undefined;
}

/** "2026-09-28" → ISO string at 23:59:59.999 local time (or undefined). */
export function dateInputToEndIso(value: string | null | undefined): string | undefined {
  const date = parseDateInput(value);
  return date ? endOfDay(date).toISOString() : undefined;
}

/** Keep only well-formed YYYY-MM-DD values from the URL. */
export function sanitizeDateParam(value: string | null): string {
  return parseDateInput(value) ? (value as string) : "";
}

export function formatDateTime(iso: string) {
  return format(new Date(iso), "d MMM yyyy, h:mm a");
}

export function formatDate(iso: string) {
  return format(new Date(iso), "d MMM yyyy");
}
