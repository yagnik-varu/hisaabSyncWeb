"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { ActivityList } from "@/components/activity/activity-list";
import { AuditLogList } from "@/components/activity/audit-log-list";
import { useCurrentRoom } from "@/components/rooms/room-context";
import { FormError } from "@/components/shared/form-error";
import {
  ClearFiltersButton,
  DateRangeFilter,
  FilterBar,
  FilterSelect,
} from "@/components/shared/list-filters";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoomActivity, useRoomMembers } from "@/hooks/use-treasury";
import { oneOf, useUrlFilters } from "@/hooks/use-url-filters";
import { getAuditLogs } from "@/lib/api/endpoints/activity";
import { normalizeError } from "@/lib/api/errors";
import { dateInputToEndIso, dateInputToStartIso, sanitizeDateParam } from "@/lib/dates";
import { buildMemberNames } from "@/lib/ledger";
import { queryKeys } from "@/lib/query-keys";

const PAGE_SIZE = 25;
const ENTITY_TYPES = [
  { value: "CONTRIBUTION", label: "Contributions" },
  { value: "EXPENSE", label: "Expenses" },
  { value: "REIMBURSEMENT", label: "Reimbursements" },
  { value: "TREASURY_TRANSACTION", label: "Treasury adjustments" },
  { value: "ROOM_MEMBER", label: "Members" },
];

/**
 * Activity page. Everyone: the room timeline. Admins: an extra "Audit log" tab with the raw
 * metadata. Note the backend only records a handful of actions (docs/05 #20).
 */
export function ActivityView() {
  const { roomId, currencyCode, can } = useCurrentRoom();
  const { searchParams, update, setPage, page } = useUrlFilters();
  const canAudit = can("audit.view");
  const tab = canAudit && searchParams.get("tab") === "audit" ? "audit" : "activity";

  const from = sanitizeDateParam(searchParams.get("from"));
  const to = sanitizeDateParam(searchParams.get("to"));
  const entityType = oneOf(
    searchParams.get("entity"),
    ENTITY_TYPES.map((e) => e.value),
  );
  const dateParams = {
    dateFrom: dateInputToStartIso(from),
    dateTo: dateInputToEndIso(to),
    page,
    limit: PAGE_SIZE,
  };

  const activity = useRoomActivity(roomId, dateParams);
  const auditParams = { ...dateParams, entityType };
  const audit = useQuery({
    queryKey: queryKeys.roomAuditLogs(roomId, auditParams),
    queryFn: ({ signal }) => getAuditLogs(roomId, auditParams, signal),
    enabled: tab === "audit",
    placeholderData: keepPreviousData,
  });
  const members = useRoomMembers(roomId);
  const names = useMemo(() => buildMemberNames(members.data), [members.data]);

  const current = tab === "audit" ? audit : activity;
  const isFiltered = !!(from || to || (tab === "audit" && entityType));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Activity</h2>
          <p className="text-muted-foreground text-sm">
            Approvals, payouts, treasury adjustments and role changes, newest first.
          </p>
        </div>
        {canAudit && (
          <Tabs
            value={tab}
            onValueChange={(v) =>
              update({ tab: v === "audit" ? "audit" : undefined, entity: undefined })
            }
          >
            <TabsList>
              <TabsTrigger value="activity">Timeline</TabsTrigger>
              <TabsTrigger value="audit">Audit log</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      <FilterBar>
        {tab === "audit" && (
          <FilterSelect
            id="audit-entity"
            label="Type"
            allLabel="All types"
            value={entityType}
            onChange={(v) => update({ entity: v })}
            options={ENTITY_TYPES}
          />
        )}
        <DateRangeFilter idPrefix="activity" from={from} to={to} onChange={update} />
        {isFiltered && (
          <ClearFiltersButton
            onClick={() => update({ from: undefined, to: undefined, entity: undefined })}
          />
        )}
      </FilterBar>

      {current.isError ? (
        <FormError message={normalizeError(current.error).message} />
      ) : (
        <div
          className="space-y-3 transition-opacity data-[stale=true]:opacity-60"
          data-stale={current.isPlaceholderData}
        >
          {tab === "audit" ? (
            <AuditLogList
              items={audit.data?.data}
              names={names}
              loading={audit.isPending}
              filtered={isFiltered}
            />
          ) : (
            <div className="rounded-xl border p-4">
              <ActivityList
                items={activity.data?.data}
                roomId={roomId}
                currencyCode={currencyCode}
                loading={activity.isPending}
                skeletonCount={6}
              />
            </div>
          )}
          {current.data && (
            <PaginationBar
              meta={current.data.meta}
              onPageChange={setPage}
              disabled={current.isFetching}
            />
          )}
        </div>
      )}
    </div>
  );
}
