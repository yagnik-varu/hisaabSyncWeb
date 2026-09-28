"use client";

import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { currencySymbol, sanitizeAmountInput } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Big, phone-friendly amount input (payment-app style):
 * - decimal keypad (`inputMode="decimal"`), currency symbol prefix, large tabular digits
 * - sanitizes as you type (digits, one ".", max 2 decimals; "," → ".")
 * - optional quick-amount chips (e.g. 500 / 1000 / 2000)
 */
export function AmountField<T extends FieldValues>({
  control,
  name,
  label = "Amount",
  currencyCode,
  quickAmounts,
  autoFocus,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  currencyCode: string;
  quickAmounts?: number[];
  autoFocus?: boolean;
}) {
  const id = `field-${name}`;
  const symbol = currencySymbol(currencyCode);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <div className="relative">
            <span
              aria-hidden
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xl font-medium md:text-lg"
            >
              {symbol}
            </span>
            <Input
              {...field}
              id={id}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(sanitizeAmountInput(e.target.value))}
              inputMode="decimal"
              autoComplete="off"
              enterKeyHint="next"
              placeholder="0.00"
              autoFocus={autoFocus}
              aria-invalid={fieldState.invalid}
              style={{ paddingLeft: `${Math.max(2.25, symbol.length * 0.75 + 1.25)}rem` }}
              className="h-14 text-2xl font-semibold tabular-nums md:h-12 md:text-xl"
            />
          </div>
          {quickAmounts && quickAmounts.length > 0 && (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {quickAmounts.map((amount) => {
                const value = String(amount);
                const active = field.value === value;
                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => field.onChange(value)}
                    className={cn(
                      "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium tabular-nums transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    {symbol}
                    {amount.toLocaleString(currencyCode === "INR" ? "en-IN" : undefined)}
                  </button>
                );
              })}
            </div>
          )}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
