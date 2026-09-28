"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Single-choice pill buttons (accessible radiogroup). Better than a dropdown on phones when there
 * are only a handful of options: everything is visible and one tap away.
 * Arrow keys move between options, as with native radio buttons.
 */
export function ChoiceChips({
  options,
  value,
  onChange,
  labelledBy,
  scroll,
  className,
}: {
  options: { value: string; label: React.ReactNode; count?: number }[];
  value: string | undefined;
  onChange: (value: string) => void;
  labelledBy?: string;
  /** One scrollable row (filters) instead of wrapping lines (forms). */
  scroll?: boolean;
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className={cn(
        "flex gap-2",
        scroll
          ? "-mx-4 [scrollbar-width:none] overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
          : "flex-wrap",
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === selectedIndex ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              "focus-visible:ring-ring/50 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 md:h-8 md:px-3",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted",
            )}
          >
            {option.label}
            {option.count !== undefined && option.count > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  selected ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
