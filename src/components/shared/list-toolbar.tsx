"use client";

import { SlidersHorizontalIcon, UserIcon } from "lucide-react";
import { useState } from "react";

import { ChoiceChips } from "@/components/shared/choice-chips";
import { ClearFiltersButton } from "@/components/shared/list-filters";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

const ALL = "__all__";

interface StatusFilter {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: { value: string; label: string }[];
  allLabel?: string;
  label: string;
}

/**
 * Mobile-first list filters.
 * - Primary filter (status) as one scrollable row of chips: always visible, one tap.
 * - Optional quick toggle chip (e.g. "Mine").
 * - Secondary filters (member, category, dates…): a bottom sheet behind a "Filters" button on
 *   phones (with an active-count badge), inline grid on desktop.
 */
export function ListToolbar({
  status,
  toggle,
  filters,
  activeFilterCount = 0,
  onClearFilters,
}: {
  status?: StatusFilter;
  toggle?: { label: string; active: boolean; onToggle: () => void };
  /** Secondary filter controls (FilterSelect, DateRangeFilter…). */
  filters?: React.ReactNode;
  /** How many secondary filters are set (badge + "Clear"). */
  activeFilterCount?: number;
  onClearFilters?: () => void;
}) {
  const [open, setOpen] = useState(false);
  // Render the secondary filters exactly once (duplicate ids would break label/for on phones).
  const isMobile = useIsMobile();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex [scrollbar-width:none] items-center gap-2 overflow-x-auto">
            {toggle && (
              <button
                type="button"
                aria-pressed={toggle.active}
                onClick={toggle.onToggle}
                className={cn(
                  "focus-visible:ring-ring/50 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium outline-none focus-visible:ring-3 md:h-8 md:px-3",
                  toggle.active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted border-dashed",
                )}
              >
                <UserIcon className="size-3.5" />
                {toggle.label}
              </button>
            )}
            {status && (
              <ChoiceChips
                labelledBy={undefined}
                value={status.value ?? ALL}
                onChange={(v) => status.onChange(v === ALL ? undefined : v)}
                options={[{ value: ALL, label: status.allLabel ?? "All" }, ...status.options]}
                className="flex-nowrap"
              />
            )}
          </div>
        </div>
        {filters && isMobile && (
          <Button
            variant="outline"
            className="relative shrink-0"
            onClick={() => setOpen(true)}
            aria-label={`Filters${activeFilterCount ? `, ${activeFilterCount} active` : ""}`}
          >
            <SlidersHorizontalIcon />
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 min-w-5 rounded-full px-1 text-center text-xs leading-5 tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Desktop: secondary filters inline */}
      {filters && !isMobile && (
        <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_auto] items-end gap-3">
          {filters}
          {activeFilterCount > 0 && onClearFilters && (
            <ClearFiltersButton onClick={onClearFilters} />
          )}
        </div>
      )}

      {/* Phones: secondary filters in a bottom sheet (they apply immediately; "Done" closes). */}
      {filters && isMobile && (
        <ResponsiveDialog open={open} onOpenChange={setOpen} title="Filters">
          <ResponsiveDialogBody>
            <div className="grid gap-4">{filters}</div>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            {activeFilterCount > 0 && onClearFilters ? (
              <Button variant="outline" onClick={onClearFilters}>
                Clear filters
              </Button>
            ) : null}
            <Button onClick={() => setOpen(false)}>Done</Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialog>
      )}
    </div>
  );
}
