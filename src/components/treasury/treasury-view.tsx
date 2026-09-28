"use client";

import { FilterXIcon, ScaleIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { FormError } from "@/components/shared/form-error";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { AdjustmentDialog } from "@/components/treasury/adjustment-dialog";
import { LedgerTable } from "@/components/treasury/ledger-table";
import { TreasurySummaryCards } from "@/components/treasury/treasury-summary-cards";
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
import { useRoomMembers, useTransactions } from "@/hooks/use-treasury";
import { normalizeError } from "@/lib/api/errors";
import { dateInputToEndIso, dateInputToStartIso, sanitizeDateParam } from "@/lib/dates";
import { buildMemberNames, REFERENCE_LABELS } from "@/lib/ledger";
import type { ReferenceType, TransactionType } from "@/types/api";

const PAGE_SIZE = 20;
const ALL = "ALL";
const TX_TYPES: TransactionType[] = ["CREDIT", "DEBIT"];
const REF_TYPES: ReferenceType[] = ["CONTRIBUTION", "REIMBURSEMENT", "ADJUSTMENT"];

function oneOf<T extends string>(value: string | null, options: readonly T[]): T | undefined {
  return options.includes(value as T) ? (value as T) : undefined;
}

/** Treasury page: summary, filterable ledger (filters in the URL) and admin adjustments. */
export function TreasuryView() {
  const { roomId, currencyCode, can, isArchived } = useCurrentRoom();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = {
    transactionType: oneOf(searchParams.get("type"), TX_TYPES),
    referenceType: oneOf(searchParams.get("ref"), REF_TYPES),
    from: sanitizeDateParam(searchParams.get("from")),
    to: sanitizeDateParam(searchParams.get("to")),
    page: Math.max(1, Number(searchParams.get("page")) || 1),
  };
  const isFiltered = !!(
    filters.transactionType ||
    filters.referenceType ||
    filters.from ||
    filters.to
  );

  const transactions = useTransactions(roomId, {
    transactionType: filters.transactionType,
    referenceType: filters.referenceType,
    dateFrom: dateInputToStartIso(filters.from),
    dateTo: dateInputToEndIso(filters.to),
    page: filters.page,
    limit: PAGE_SIZE,
  });
  const members = useRoomMembers(roomId);
  const names = useMemo(() => buildMemberNames(members.data), [members.data]);

  /** Update one or more URL params; any filter change resets to page 1. */
  function update(changes: Record<string, string | undefined>, resetPage = true) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (resetPage) params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <TreasurySummaryCards />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Ledger</h2>
            <p className="text-muted-foreground text-sm">
              Every change to the balance, newest first. Entries can never be edited or deleted.
            </p>
          </div>
          {can("treasury.adjust") && !isArchived && (
            <AdjustmentDialog
              trigger={
                <Button variant="outline">
                  <ScaleIcon />
                  Manual adjustment
                </Button>
              }
            />
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="ledger-type">Direction</Label>
            <Select
              value={filters.transactionType ?? ALL}
              onValueChange={(v) => update({ type: v === ALL ? undefined : v })}
            >
              <SelectTrigger id="ledger-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                <SelectItem value="CREDIT">Money in (credit)</SelectItem>
                <SelectItem value="DEBIT">Money out (debit)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ledger-ref">Source</Label>
            <Select
              value={filters.referenceType ?? ALL}
              onValueChange={(v) => update({ ref: v === ALL ? undefined : v })}
            >
              <SelectTrigger id="ledger-ref" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All sources</SelectItem>
                {REF_TYPES.map((ref) => (
                  <SelectItem key={ref} value={ref}>
                    {REFERENCE_LABELS[ref]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ledger-from">From</Label>
            <Input
              id="ledger-from"
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(e) => update({ from: e.target.value || undefined })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ledger-to">To</Label>
            <Input
              id="ledger-to"
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => update({ to: e.target.value || undefined })}
            />
          </div>
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() =>
                update({ type: undefined, ref: undefined, from: undefined, to: undefined })
              }
            >
              <FilterXIcon />
              Clear
            </Button>
          )}
        </div>

        {transactions.isError ? (
          <FormError message={normalizeError(transactions.error).message} />
        ) : (
          <div
            className="space-y-3 transition-opacity data-[stale=true]:opacity-60"
            data-stale={transactions.isPlaceholderData}
          >
            <LedgerTable
              transactions={transactions.data?.data}
              names={names}
              currencyCode={currencyCode}
              loading={transactions.isPending}
              filtered={isFiltered}
            />
            {transactions.data && (
              <PaginationBar
                meta={transactions.data.meta}
                onPageChange={(p) => update({ page: p > 1 ? String(p) : undefined }, false)}
                disabled={transactions.isFetching}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
