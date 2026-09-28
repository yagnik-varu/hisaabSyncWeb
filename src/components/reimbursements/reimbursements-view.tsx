"use client";

import { ReimbursementSheet } from "@/components/reimbursements/reimbursement-sheet";
import { ReimbursementsTable } from "@/components/reimbursements/reimbursements-table";
import { useCurrentRoom } from "@/components/rooms/room-context";
import { FormError } from "@/components/shared/form-error";
import { FilterSelect } from "@/components/shared/list-filters";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SectionHeader } from "@/components/shared/section-header";
import { ListToolbar } from "@/components/shared/list-toolbar";
import { useAuth } from "@/hooks/use-auth";
import { useReimbursements } from "@/hooks/use-reimbursements";
import { useRoomMembers } from "@/hooks/use-treasury";
import { oneOf, useResetEmptyPage, useUrlFilters, uuidParam } from "@/hooks/use-url-filters";
import { normalizeError } from "@/lib/api/errors";

const PAGE_SIZE = 20;
const STATUSES = [
  { value: "PENDING_PAYMENT" as const, label: "Awaiting payment" },
  { value: "PAID" as const, label: "Paid" },
];

/** Reimbursements page. `?open=<id>` opens the details sheet (shareable, back-button friendly). */
export function ReimbursementsView() {
  const { roomId, currencyCode } = useCurrentRoom();
  const { user } = useAuth();
  const { searchParams, update, setPage, page } = useUrlFilters();
  const members = useRoomMembers(roomId);

  const filters = {
    status: oneOf(
      searchParams.get("status"),
      STATUSES.map((s) => s.value),
    ),
    beneficiaryId: uuidParam(searchParams.get("member")),
  };
  const isFiltered = !!(filters.status || filters.beneficiaryId);
  const openId = uuidParam(searchParams.get("open")) ?? null;

  const reimbursements = useReimbursements(roomId, { ...filters, page, limit: PAGE_SIZE });

  const memberOptions = [...(members.data ?? [])]
    .sort((a, b) => Number(b.userId === user?.id) - Number(a.userId === user?.id))
    .map((m) => ({
      value: m.userId,
      label: m.userId === user?.id ? `${m.fullName} (you)` : m.fullName,
    }));

  useResetEmptyPage(
    !!reimbursements.data && reimbursements.data.data.length === 0 && !reimbursements.isFetching,
    page,
    setPage,
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Reimbursements"
        description="What the treasury owes members for approved expenses, and what it has paid back."
      />

      <ListToolbar
        status={{
          label: "Status",
          value: filters.status,
          onChange: (v) => update({ status: v }),
          options: STATUSES,
        }}
        toggle={
          user
            ? {
                label: "Owed to me",
                active: filters.beneficiaryId === user.id,
                onToggle: () =>
                  update({ member: filters.beneficiaryId === user.id ? undefined : user.id }),
              }
            : undefined
        }
        filters={
          <FilterSelect
            id="reimb-member"
            label="Owed to"
            allLabel="Everyone"
            value={filters.beneficiaryId}
            onChange={(v) => update({ member: v })}
            options={memberOptions}
          />
        }
        activeFilterCount={filters.beneficiaryId ? 1 : 0}
        onClearFilters={() => update({ member: undefined })}
      />

      {reimbursements.isError ? (
        <FormError message={normalizeError(reimbursements.error).message} />
      ) : (
        <div
          className="space-y-3 transition-opacity data-[stale=true]:opacity-60"
          data-stale={reimbursements.isPlaceholderData}
        >
          <ReimbursementsTable
            reimbursements={reimbursements.data?.data}
            currencyCode={currencyCode}
            loading={reimbursements.isPending}
            filtered={isFiltered}
            onOpen={(id) => update({ open: id }, { keepPage: true })}
          />
          {reimbursements.data && (
            <PaginationBar
              meta={reimbursements.data.meta}
              onPageChange={setPage}
              disabled={reimbursements.isFetching}
            />
          )}
        </div>
      )}

      <ReimbursementSheet
        reimbursementId={openId}
        onOpenChange={(open) => {
          if (!open) update({ open: undefined }, { keepPage: true });
        }}
      />
    </div>
  );
}
