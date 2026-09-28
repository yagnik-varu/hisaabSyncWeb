"use client";

import { ScaleIcon } from "lucide-react";
import { useMemo } from "react";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { FormError } from "@/components/shared/form-error";
import { DateRangeFilter, FilterSelect } from "@/components/shared/list-filters";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SectionHeader } from "@/components/shared/section-header";
import { ListToolbar } from "@/components/shared/list-toolbar";
import { AdjustmentDialog } from "@/components/treasury/adjustment-dialog";
import { LedgerTable } from "@/components/treasury/ledger-table";
import { BalanceHero } from "@/components/treasury/balance-hero";
import { Button } from "@/components/ui/button";
import { useRoomMembers, useTransactions } from "@/hooks/use-treasury";
import { oneOf, useResetEmptyPage, useUrlFilters } from "@/hooks/use-url-filters";
import { normalizeError } from "@/lib/api/errors";
import { dateInputToEndIso, dateInputToStartIso, sanitizeDateParam } from "@/lib/dates";
import { buildMemberNames, REFERENCE_LABELS } from "@/lib/ledger";
import type { ReferenceType, TransactionType } from "@/types/api";

const PAGE_SIZE = 20;
const TX_TYPES: TransactionType[] = ["CREDIT", "DEBIT"];
const REF_TYPES: ReferenceType[] = ["CONTRIBUTION", "REIMBURSEMENT", "ADJUSTMENT"];

/** Treasury page: summary, filterable ledger (filters in the URL) and admin adjustments. */
export function TreasuryView() {
  const { roomId, currencyCode, can, isArchived } = useCurrentRoom();
  const { searchParams, update, setPage, page } = useUrlFilters();

  const filters = {
    transactionType: oneOf(searchParams.get("type"), TX_TYPES),
    referenceType: oneOf(searchParams.get("ref"), REF_TYPES),
    from: sanitizeDateParam(searchParams.get("from")),
    to: sanitizeDateParam(searchParams.get("to")),
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
    page,
    limit: PAGE_SIZE,
  });
  const members = useRoomMembers(roomId);
  const names = useMemo(() => buildMemberNames(members.data), [members.data]);

  useResetEmptyPage(
    !!transactions.data && transactions.data.data.length === 0 && !transactions.isFetching,
    page,
    setPage,
  );

  return (
    <div className="space-y-6">
      <BalanceHero className="md:max-w-xl" />

      <section className="space-y-4">
        <SectionHeader
          title="Ledger"
          description="Every change to the balance, newest first. Entries can never be edited or deleted."
          action={
            can("treasury.adjust") && !isArchived ? (
              <AdjustmentDialog
                trigger={
                  <Button variant="outline">
                    <ScaleIcon />
                    <span className="md:hidden">Adjust</span>
                    <span className="hidden md:inline">Manual adjustment</span>
                  </Button>
                }
              />
            ) : undefined
          }
        />

        <ListToolbar
          status={{
            label: "Direction",
            value: filters.transactionType,
            onChange: (v) => update({ type: v }),
            options: [
              { value: "CREDIT", label: "Money in" },
              { value: "DEBIT", label: "Money out" },
            ],
          }}
          filters={
            <>
              <FilterSelect
                id="ledger-ref"
                label="Source"
                allLabel="All sources"
                value={filters.referenceType}
                onChange={(v) => update({ ref: v })}
                options={REF_TYPES.map((ref) => ({ value: ref, label: REFERENCE_LABELS[ref] }))}
              />
              <DateRangeFilter
                idPrefix="ledger"
                from={filters.from}
                to={filters.to}
                onChange={update}
              />
            </>
          }
          activeFilterCount={
            [filters.referenceType, filters.from, filters.to].filter(Boolean).length
          }
          onClearFilters={() => update({ ref: undefined, from: undefined, to: undefined })}
        />

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
                onPageChange={setPage}
                disabled={transactions.isFetching}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
