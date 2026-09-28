"use client";

import { PlusIcon } from "lucide-react";

import { ContributionsTable } from "@/components/contributions/contributions-table";
import { SubmitContributionDialog } from "@/components/contributions/submit-contribution-dialog";
import { useCurrentRoom } from "@/components/rooms/room-context";
import { FormError } from "@/components/shared/form-error";
import {
  ClearFiltersButton,
  DateRangeFilter,
  FilterBar,
  FilterSelect,
} from "@/components/shared/list-filters";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useContributions } from "@/hooks/use-contributions";
import { useRoomMembers } from "@/hooks/use-treasury";
import { oneOf, useUrlFilters, uuidParam } from "@/hooks/use-url-filters";
import { normalizeError } from "@/lib/api/errors";
import { dateInputToEndIso, dateInputToStartIso, sanitizeDateParam } from "@/lib/dates";
import type { ContributionStatus } from "@/types/api";

const PAGE_SIZE = 20;
const STATUSES: { value: ContributionStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function ContributionsView() {
  const { roomId, currencyCode, can, isArchived } = useCurrentRoom();
  const { user } = useAuth();
  const { searchParams, update, setPage, page } = useUrlFilters();
  const members = useRoomMembers(roomId);

  const filters = {
    status: oneOf(
      searchParams.get("status"),
      STATUSES.map((s) => s.value),
    ),
    contributorId: uuidParam(searchParams.get("member")),
    from: sanitizeDateParam(searchParams.get("from")),
    to: sanitizeDateParam(searchParams.get("to")),
  };
  const isFiltered = !!(filters.status || filters.contributorId || filters.from || filters.to);

  const contributions = useContributions(roomId, {
    status: filters.status,
    contributorId: filters.contributorId,
    dateFrom: dateInputToStartIso(filters.from),
    dateTo: dateInputToEndIso(filters.to),
    page,
    limit: PAGE_SIZE,
  });

  // "You" first, then everyone else (including former members, whose history still matters).
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
    can("contributions.submit") && !isArchived ? (
      <SubmitContributionDialog
        trigger={
          <Button>
            <PlusIcon />
            Add money
          </Button>
        }
      />
    ) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Contributions</h2>
          <p className="text-muted-foreground text-sm">
            Money members put into the pool. It counts once an admin or accountant approves it.
          </p>
        </div>
        {addButton}
      </div>

      <FilterBar>
        <FilterSelect
          id="contrib-status"
          label="Status"
          value={filters.status}
          onChange={(v) => update({ status: v })}
          options={STATUSES}
        />
        <FilterSelect
          id="contrib-member"
          label="Member"
          allLabel="Everyone"
          value={filters.contributorId}
          onChange={(v) => update({ member: v })}
          options={memberOptions}
        />
        <DateRangeFilter idPrefix="contrib" from={filters.from} to={filters.to} onChange={update} />
        {isFiltered && (
          <ClearFiltersButton
            onClick={() =>
              update({ status: undefined, member: undefined, from: undefined, to: undefined })
            }
          />
        )}
      </FilterBar>

      {contributions.isError ? (
        <FormError message={normalizeError(contributions.error).message} />
      ) : (
        <div
          className="space-y-3 transition-opacity data-[stale=true]:opacity-60"
          data-stale={contributions.isPlaceholderData}
        >
          <ContributionsTable
            contributions={contributions.data?.data}
            currencyCode={currencyCode}
            loading={contributions.isPending}
            filtered={isFiltered}
            emptyAction={addButton}
          />
          {contributions.data && (
            <PaginationBar
              meta={contributions.data.meta}
              onPageChange={setPage}
              disabled={contributions.isFetching}
            />
          )}
        </div>
      )}
    </div>
  );
}
