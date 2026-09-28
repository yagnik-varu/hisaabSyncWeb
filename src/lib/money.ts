/**
 * Money helpers.
 *
 * Rule (CLAUDE.md §3): the API sends amounts as strings ("1450.00", sometimes "1450").
 * Never do arithmetic with JS numbers — 0.1 + 0.2 !== 0.3. Use Decimal for math and
 * only convert to Number at the very last step for Intl display formatting (safe: DB max is
 * DECIMAL(12,2), well within float precision for display).
 */

import Decimal from "decimal.js-light";

import type { Money } from "@/types/api";

/** Same rule the backend DTOs enforce: positive, up to 2 decimal places, no sign/exponent. */
export const AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/;

export function toDecimal(value: Money | number | null | undefined): Decimal {
  if (value === null || value === undefined || value === "") return new Decimal(0);
  try {
    return new Decimal(value);
  } catch {
    return new Decimal(0);
  }
}

/** Is this user input a valid, strictly positive amount the backend will accept? */
export function isValidAmount(input: string): boolean {
  const trimmed = input.trim();
  return AMOUNT_REGEX.test(trimmed) && toDecimal(trimmed).gt(0);
}

/** Normalize user input to the canonical string sent to the API ("12.5" → "12.50"). */
export function toApiAmount(input: string): Money {
  return toDecimal(input.trim()).toFixed(2);
}

export function addMoney(...values: Money[]): Money {
  return values.reduce((sum, v) => sum.plus(toDecimal(v)), new Decimal(0)).toFixed(2);
}

export function subtractMoney(a: Money, b: Money): Money {
  return toDecimal(a).minus(toDecimal(b)).toFixed(2);
}

/** -1 if a < b, 0 if equal, 1 if a > b. */
export function compareMoney(a: Money, b: Money): -1 | 0 | 1 {
  return toDecimal(a).comparedTo(toDecimal(b)) as -1 | 0 | 1;
}

export function isNegative(value: Money): boolean {
  return toDecimal(value).lt(0);
}

// ─── Formatting ─────────────────────────────────────────────────────────────

const formatterCache = new Map<string, Intl.NumberFormat>();

/** INR reads best with Indian digit grouping (1,00,000); others use the browser locale. */
function localeFor(currencyCode: string): string | undefined {
  return currencyCode.toUpperCase() === "INR" ? "en-IN" : undefined;
}

function getFormatter(currencyCode: string, signDisplay: Intl.NumberFormatOptions["signDisplay"]) {
  const key = `${currencyCode}|${signDisplay}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(localeFor(currencyCode), {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay,
      });
    } catch {
      // Unknown/invalid currency code stored on the room → plain number with the code as suffix.
      const plain = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay,
      });
      formatter = {
        format: (n: number) => `${plain.format(n)} ${currencyCode}`,
      } as Intl.NumberFormat;
    }
    formatterCache.set(key, formatter);
  }
  return formatter;
}

/**
 * Format an API amount for display: formatMoney("7500", "INR") → "₹7,500.00".
 * `signed: true` always shows +/− (useful for ledger CREDIT/DEBIT columns).
 */
export function formatMoney(
  value: Money | number | null | undefined,
  currencyCode = "INR",
  options: { signed?: boolean } = {},
): string {
  const amount = Number(toDecimal(value).toFixed(2));
  return getFormatter(currencyCode, options.signed ? "exceptZero" : "auto").format(amount);
}
