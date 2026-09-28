import { formatMoney, isNegative } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Money as MoneyValue } from "@/types/api";

/** Formatted amount with tabular digits; negative values are highlighted. */
export function Money({
  value,
  currency = "INR",
  signed,
  className,
}: {
  value: MoneyValue | null | undefined;
  currency?: string;
  signed?: boolean;
  className?: string;
}) {
  const negative = value != null && isNegative(value);
  return (
    <span className={cn("tabular-nums", negative && "text-destructive", className)}>
      {formatMoney(value, currency, { signed })}
    </span>
  );
}
