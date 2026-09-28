"use client";

import { FilterXIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

/** Labeled select for list filters. `value === undefined` means "all". */
export function FilterSelect({
  id,
  label,
  value,
  onChange,
  allLabel = "All",
  options,
}: {
  id: string;
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  allLabel?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** "From" + "To" <input type="date"> pair (values are YYYY-MM-DD or ""). */
export function DateRangeFilter({
  idPrefix,
  from,
  to,
  onChange,
}: {
  idPrefix: string;
  from: string;
  to: string;
  onChange: (changes: { from?: string; to?: string }) => void;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-from`}>From</Label>
        <Input
          id={`${idPrefix}-from`}
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => onChange({ from: e.target.value || undefined, to: to || undefined })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-to`}>To</Label>
        <Input
          id={`${idPrefix}-to`}
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => onChange({ from: from || undefined, to: e.target.value || undefined })}
        />
      </div>
    </>
  );
}

export function ClearFiltersButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" onClick={onClick}>
      <FilterXIcon />
      Clear
    </Button>
  );
}

/** Responsive grid: stacked on phones, up to 4 filters + a clear button on large screens. */
export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
      {children}
    </div>
  );
}
