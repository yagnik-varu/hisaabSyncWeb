/**
 * Only ever render user-provided links that are real http(s) URLs.
 *
 * The backend stores `receiptUrl` with just @IsString() (docs/05 #22), so another client could save
 * `javascript:…` or `data:…`. Putting that in an <a href> would be a stored XSS. Returns null for
 * anything that isn't http/https.
 */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** "https://cdn.example.com/receipts/rec-01.jpg" → "cdn.example.com" (for link labels). */
export function urlHost(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return value;
  }
}
