"use client";

import { ShieldIcon } from "lucide-react";

import { JoinRequestsList } from "@/components/approvals/join-requests-list";
import { ContributionsTable } from "@/components/contributions/contributions-table";
import { ExpensesTable } from "@/components/expenses/expenses-table";
import { ReimbursementSheet } from "@/components/reimbursements/reimbursement-sheet";
import { ReimbursementsTable } from "@/components/reimbursements/reimbursements-table";
import { useCurrentRoom } from "@/components/rooms/room-context";
import { EmptyState } from "@/components/shared/empty-state";
import { FormError } from "@/components/shared/form-error";
import { Money } from "@/components/shared/money";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContributions } from "@/hooks/use-contributions";
import { useExpenses } from "@/hooks/use-expenses";
import { useJoinRequests } from "@/hooks/use-join-requests";
import { useReimbursements } from "@/hooks/use-reimbursements";
import { useTreasurySummary } from "@/hooks/use-treasury";
import { oneOf, useUrlFilters, uuidParam } from "@/hooks/use-url-filters";
import { normalizeError } from "@/lib/api/errors";
import { addMoney } from "@/lib/money";
import type { PageMeta } from "@/types/api";

const TABS = ["contributions", "expenses", "payouts", "joins"] as const;
type Tab = (typeof TABS)[number];

/** Big enough to show everything pending in a normal room on one screen. */
const INBOX_LIMIT = 50;

/**
 * One place for approvers to clear everything waiting on them:
 * pending contributions, pending expenses, reimbursements to pay, join requests.
 */
export function ApprovalsView() {
  const { roomId, currencyCode, can } = useCurrentRoom();
  const { searchParams, update } = useUrlFilters();
  const isApprover = can("contributions.review");

  const contributions = useContributions(roomId, {
    status: "PENDING",
    page: 1,
    limit: INBOX_LIMIT,
  });
  const expenses = useExpenses(roomId, { status: "PENDING", page: 1, limit: INBOX_LIMIT });
  const payouts = useReimbursements(
    roomId,
    { status: "PENDING_PAYMENT", page: 1, limit: INBOX_LIMIT },
    { enabled: isApprover },
  );
  const joins = useJoinRequests(roomId, can("joinRequests.view"));
  const treasury = useTreasurySummary(roomId);

  if (!isApprover) {
    return (
      <EmptyState
        icon={ShieldIcon}
        title="Approvals are for admins and accountants"
        description="Your own pending items are listed under Contributions and Expenses."
      />
    );
  }

  const counts: Record<Tab, number | undefined> = {
    contributions: contributions.data?.meta.totalItems,
    expenses: expenses.data?.meta.totalItems,
    payouts: payouts.data?.meta.totalItems,
    joins: joins.data?.filter((r) => r.status === "PENDING").length,
  };
  // Default to the first tab that has something waiting.
  const tab: Tab =
    oneOf(searchParams.get("tab"), TABS) ??
    TABS.find((t) => (counts[t] ?? 0) > 0) ??
    "contributions";
  const openReimbursement = uuidParam(searchParams.get("open")) ?? null;
  const owedTotal = addMoney(...(payouts.data?.data.map((r) => r.amount) ?? []));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Approvals</h2>
        <p className="text-muted-foreground text-sm">
          Everything waiting for an admin or accountant.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => update({ tab: v, open: undefined })}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList>
            <TabTrigger value="contributions" label="Contributions" count={counts.contributions} />
            <TabTrigger value="expenses" label="Expenses" count={counts.expenses} />
            <TabTrigger value="payouts" label="To pay" count={counts.payouts} />
            {can("joinRequests.view") && (
              <TabTrigger value="joins" label="Join requests" count={counts.joins} />
            )}
          </TabsList>
        </div>

        <TabsContent value="contributions" className="space-y-3 pt-2">
          {contributions.isError ? (
            <FormError message={normalizeError(contributions.error).message} />
          ) : (
            <>
              <ContributionsTable
                contributions={contributions.data?.data}
                currencyCode={currencyCode}
                loading={contributions.isPending}
              />
              <MoreNotice meta={contributions.data?.meta} />
            </>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-3 pt-2">
          {expenses.isError ? (
            <FormError message={normalizeError(expenses.error).message} />
          ) : (
            <>
              <ExpensesTable
                roomId={roomId}
                expenses={expenses.data?.data}
                currencyCode={currencyCode}
                loading={expenses.isPending}
              />
              <MoreNotice meta={expenses.data?.meta} />
            </>
          )}
        </TabsContent>

        <TabsContent value="payouts" className="space-y-3 pt-2">
          {payouts.isError ? (
            <FormError message={normalizeError(payouts.error).message} />
          ) : (
            <>
              {!!payouts.data?.data.length && (
                <div className="bg-muted/40 flex flex-wrap justify-between gap-2 rounded-lg border p-3 text-sm">
                  <span>
                    Owed to members:{" "}
                    <Money value={owedTotal} currency={currencyCode} className="font-semibold" />
                  </span>
                  <span className="text-muted-foreground">
                    Treasury balance:{" "}
                    <Money
                      value={treasury.data?.currentBalance}
                      currency={currencyCode}
                      className="text-foreground font-semibold"
                    />
                  </span>
                </div>
              )}
              <ReimbursementsTable
                reimbursements={payouts.data?.data}
                currencyCode={currencyCode}
                loading={payouts.isPending}
                onOpen={(id) => update({ open: id }, { keepPage: true })}
                emptyTitle="Nothing to pay"
                emptyDescription="Approved expenses waiting to be paid back will show up here."
              />
              <MoreNotice meta={payouts.data?.meta} />
            </>
          )}
        </TabsContent>

        <TabsContent value="joins" className="pt-2">
          <JoinRequestsList requests={joins.data} loading={joins.isPending} error={joins.error} />
        </TabsContent>
      </Tabs>

      <ReimbursementSheet
        reimbursementId={openReimbursement}
        onOpenChange={(open) => {
          if (!open) update({ open: undefined }, { keepPage: true });
        }}
      />
    </div>
  );
}

function TabTrigger({ value, label, count }: { value: Tab; label: string; count?: number }) {
  return (
    <TabsTrigger value={value} className="gap-1.5">
      {label}
      {!!count && (
        <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-xs tabular-nums">
          {count}
        </span>
      )}
    </TabsTrigger>
  );
}

/** The inbox shows the first INBOX_LIMIT items; say so when there are more. */
function MoreNotice({ meta }: { meta?: PageMeta }) {
  if (!meta || meta.totalItems <= meta.limit) return null;
  return (
    <p className="text-muted-foreground text-sm">
      Showing the newest {meta.limit} of {meta.totalItems}. Clear these to see the rest.
    </p>
  );
}
