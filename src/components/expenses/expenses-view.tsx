"use client";

import { PlusIcon } from "lucide-react";

import { ExpensesTable } from "@/components/expenses/expenses-table";
import { SubmitExpenseDialog } from "@/components/expenses/submit-expense-dialog";
import { useCurrentRoom } from "@/components/rooms/room-context";
import { FormError } from "@/components/shared/form-error";
import {
  ClearFiltersButton,
  DateRangeFilter,
  FilterSelect,
} from "@/components/shared/list-filters";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCategories, useExpenses } from "@/hooks/use-expenses";
import { useRoomMembers } from "@/hooks/use-treasury";
import { oneOf, useUrlFilters, uuidParam } from "@/hooks/use-url-filters";
import { normalizeError } from "@/lib/api/errors";
import { dateInputToEndIso, dateInputToStartIso, sanitizeDateParam } from "@/lib/dates";
import type { ExpenseStatus } from "@/types/api";

const PAGE_SIZE = 20;
const STATUSES: { value: ExpenseStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function ExpensesView() {
  const { roomId, currencyCode, can, isArchived } = useCurrentRoom();
  const { user } = useAuth();
  const { searchParams, update, setPage, page } = useUrlFilters();
  const members = useRoomMembers(roomId);
  const categories = useCategories(roomId);

  const filters = {
    status: oneOf(
      searchParams.get("status"),
      STATUSES.map((s) => s.value),
    ),
    categoryId: uuidParam(searchParams.get("category")),
    submittedBy: uuidParam(searchParams.get("member")),
    from: sanitizeDateParam(searchParams.get("from")),
    to: sanitizeDateParam(searchParams.get("to")),
  };
  const isFiltered = Object.values(filters).some(Boolean);

  const expenses = useExpenses(roomId, {
    status: filters.status,
    categoryId: filters.categoryId,
    submittedBy: filters.submittedBy,
    dateFrom: dateInputToStartIso(filters.from),
    dateTo: dateInputToEndIso(filters.to),
    page,
    limit: PAGE_SIZE,
  });

  const memberOptions = [...(members.data ?? [])]
    .sort((a, b) => Number(b.userId === user?.id) - Number(a.userId === user?.id))
    .map((m) => ({
      value: m.userId,
      label:
        m.userId === user?.id
          ? `${m.fullName} (you)`
          : m.status === "LEFT"
            ? `${m.fullName} (left)`
            : m.fullName,
    }));

  const addButton =
    can("expenses.submit") && !isArchived ? (
      <SubmitExpenseDialog
        trigger={
          <Button>
            <PlusIcon />
            Log expense
          </Button>
        }
      />
    ) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Expenses</h2>
          <p className="text-muted-foreground text-sm">
            Shared costs members paid out of pocket. Approved expenses become reimbursements.
          </p>
        </div>
        {addButton}
      </div>

      {/* 5 filters here, so a slightly different grid than FilterBar. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-end">
        <FilterSelect
          id="expense-status"
          label="Status"
          value={filters.status}
          onChange={(v) => update({ status: v })}
          options={STATUSES}
        />
        <FilterSelect
          id="expense-category"
          label="Category"
          allLabel="All categories"
          value={filters.categoryId}
          onChange={(v) => update({ category: v })}
          options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
        />
        <FilterSelect
          id="expense-member"
          label="Paid by"
          allLabel="Everyone"
          value={filters.submittedBy}
          onChange={(v) => update({ member: v })}
          options={memberOptions}
        />
        <DateRangeFilter idPrefix="expense" from={filters.from} to={filters.to} onChange={update} />
        {isFiltered && (
          <ClearFiltersButton
            onClick={() =>
              update({
                status: undefined,
                category: undefined,
                member: undefined,
                from: undefined,
                to: undefined,
              })
            }
          />
        )}
      </div>

      {expenses.isError ? (
        <FormError message={normalizeError(expenses.error).message} />
      ) : (
        <div
          className="space-y-3 transition-opacity data-[stale=true]:opacity-60"
          data-stale={expenses.isPlaceholderData}
        >
          <ExpensesTable
            roomId={roomId}
            expenses={expenses.data?.data}
            currencyCode={currencyCode}
            loading={expenses.isPending}
            filtered={isFiltered}
            emptyAction={addButton}
          />
          {expenses.data && (
            <PaginationBar
              meta={expenses.data.meta}
              onPageChange={setPage}
              disabled={expenses.isFetching}
            />
          )}
        </div>
      )}
    </div>
  );
}
