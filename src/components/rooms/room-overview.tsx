"use client";

import {
  ArrowLeftRightIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  HandCoinsIcon,
  InboxIcon,
  ReceiptIcon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { ActivityList } from "@/components/activity/activity-list";
import { SubmitContributionDialog } from "@/components/contributions/submit-contribution-dialog";
import { SubmitExpenseDialog } from "@/components/expenses/submit-expense-dialog";
import { InviteButton } from "@/components/rooms/invite-button";
import { useCurrentRoom } from "@/components/rooms/room-context";
import { RoleBadge } from "@/components/shared/badges";
import { CopyButton } from "@/components/shared/copy-button";
import { FormError } from "@/components/shared/form-error";
import { Money } from "@/components/shared/money";
import { BalanceHero } from "@/components/treasury/balance-hero";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApprovalCounts } from "@/hooks/use-approval-counts";
import { useAuth } from "@/hooks/use-auth";
import { useContributions } from "@/hooks/use-contributions";
import { useExpenses } from "@/hooks/use-expenses";
import { useReimbursements } from "@/hooks/use-reimbursements";
import { useRoomActivity } from "@/hooks/use-treasury";
import { normalizeError } from "@/lib/api/errors";
import { addMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Room home. Mobile-first order (single column on phones):
 *   hero → pool balance → quick actions → needs attention (approvers) → your position → activity
 * From `lg` up: balance + activity on the left, actions / attention / position on the right.
 */
export function RoomOverview() {
  const { roomId, room, currencyCode, isArchived } = useCurrentRoom();
  const counts = useApprovalCounts();
  const activity = useRoomActivity(roomId, { page: 1, limit: 5 });
  const base = `/rooms/${roomId}`;

  return (
    <div className="space-y-5">
      {/* Phone hero (desktop shows the room header in RoomShell instead). */}
      <div className="flex items-start justify-between gap-3 md:hidden">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{room.name}</h1>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <RoleBadge role={room.myRole} />
            <span className="flex items-center">
              Code
              <span className="text-foreground ml-1 font-mono font-medium tracking-wider">
                {room.roomCode}
              </span>
              <CopyButton value={room.roomCode} label="Copy room code" className="size-8" />
            </span>
          </div>
        </div>
        <InviteButton size="sm" />
      </div>

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <BalanceHero className="lg:col-start-1 lg:row-start-1" />

        {!isArchived && (
          <div className="grid grid-cols-2 gap-3 lg:col-start-2 lg:row-start-1">
            <SubmitContributionDialog
              trigger={<QuickAction icon={HandCoinsIcon} title="Add money" hint="to the pool" />}
            />
            <SubmitExpenseDialog
              trigger={<QuickAction icon={ReceiptIcon} title="Log expense" hint="you paid for" />}
            />
          </div>
        )}

        {counts.reviewer && (
          <Card className="lg:col-start-2 lg:row-start-2">
            <CardHeader>
              <CardTitle>Needs attention</CardTitle>
              <CardDescription>Waiting for an admin or accountant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <AttentionRow
                icon={HandCoinsIcon}
                label="Contributions to approve"
                count={counts.contributions}
                href={`${base}/approvals?tab=contributions`}
              />
              <AttentionRow
                icon={ReceiptIcon}
                label="Expenses to approve"
                count={counts.expenses}
                href={`${base}/approvals?tab=expenses`}
              />
              <AttentionRow
                icon={ArrowLeftRightIcon}
                label="Reimbursements to pay"
                count={counts.payouts}
                href={`${base}/approvals?tab=payouts`}
              />
              <AttentionRow
                icon={UserPlusIcon}
                label="Join requests"
                count={counts.joins}
                href={`${base}/approvals?tab=joins`}
              />
              {counts.total > 0 && (
                <Button asChild className="mt-3 w-full">
                  <Link href={`${base}/approvals`}>
                    <InboxIcon />
                    Review {counts.total} item{counts.total === 1 ? "" : "s"}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <YourPosition className="lg:col-start-2 lg:row-start-3" />

        <Card className="lg:col-start-1 lg:row-span-3 lg:row-start-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href={`${base}/activity`}>
                  View all
                  <ArrowRightIcon />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {activity.isError ? (
              <FormError message={normalizeError(activity.error).message} />
            ) : (
              <ActivityList
                items={activity.data?.data}
                roomId={roomId}
                currencyCode={currencyCode}
                loading={activity.isPending}
                skeletonCount={3}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** What this room means for *me*: money owed to me and my items still waiting for approval. */
function YourPosition({ className }: { className?: string }) {
  const { roomId, currencyCode } = useCurrentRoom();
  const { user } = useAuth();
  const me = user?.id;
  const base = `/rooms/${roomId}`;

  const owed = useReimbursements(roomId, {
    status: "PENDING_PAYMENT",
    beneficiaryId: me,
    page: 1,
    limit: 100,
  });
  const myContributions = useContributions(roomId, {
    status: "PENDING",
    contributorId: me,
    page: 1,
    limit: 1,
  });
  const myExpenses = useExpenses(roomId, { status: "PENDING", submittedBy: me, page: 1, limit: 1 });

  const owedTotal = addMoney(...(owed.data?.data.map((r) => r.amount) ?? []));
  const owedCount = owed.data?.meta.totalItems ?? 0;
  const loading = owed.isPending || myContributions.isPending || myExpenses.isPending;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Your position</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link
          href={`${base}/reimbursements?status=PENDING_PAYMENT&member=${me ?? ""}`}
          className="bg-muted/50 active:bg-muted flex items-center justify-between gap-3 rounded-xl p-3"
        >
          <span>
            <span className="text-muted-foreground block text-sm">The pool owes you</span>
            {loading ? (
              <Skeleton className="mt-1 h-7 w-28" />
            ) : (
              <Money
                value={owedTotal}
                currency={currencyCode}
                className={cn(
                  "text-2xl font-semibold",
                  owedCount > 0 && "text-emerald-600 dark:text-emerald-400",
                )}
              />
            )}
            {owedCount > 0 && (
              <span className="text-muted-foreground block text-xs">
                {owedCount} unpaid reimbursement{owedCount === 1 ? "" : "s"}
              </span>
            )}
          </span>
          <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
        </Link>
        <div className="space-y-1">
          <AttentionRow
            icon={HandCoinsIcon}
            label="Your pending contributions"
            count={myContributions.data?.meta.totalItems ?? 0}
            href={`${base}/contributions?status=PENDING&member=${me ?? ""}`}
          />
          <AttentionRow
            icon={ReceiptIcon}
            label="Your pending expenses"
            count={myExpenses.data?.meta.totalItems ?? 0}
            href={`${base}/expenses?status=PENDING&member=${me ?? ""}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/** Big two-line tile button (a trigger for the add-money / log-expense sheets). */
function QuickAction({
  icon: Icon,
  title,
  hint,
  ...props
}: { icon: LucideIcon; title: string; hint: string } & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className="bg-card hover:bg-muted/50 active:bg-muted focus-visible:ring-ring/50 flex flex-col items-start gap-2 rounded-2xl border p-4 text-left shadow-xs transition-colors outline-none focus-visible:ring-3"
    >
      <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-full">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="text-muted-foreground block text-xs">{hint}</span>
      </span>
    </button>
  );
}

function AttentionRow({
  icon: Icon,
  label,
  count,
  href,
}: {
  icon: LucideIcon;
  label: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="hover:bg-muted/60 active:bg-muted -mx-2 flex min-h-11 items-center justify-between gap-2 rounded-lg px-2 text-sm"
    >
      <span className="flex items-center gap-2">
        <Icon className="text-muted-foreground size-4" />
        {label}
      </span>
      <span className="flex items-center gap-1">
        <span
          className={
            count > 0
              ? "rounded-full bg-amber-500/15 px-2 font-medium text-amber-700 tabular-nums dark:text-amber-400"
              : "text-muted-foreground tabular-nums"
          }
        >
          {count}
        </span>
        <ChevronRightIcon className="text-muted-foreground size-4" />
      </span>
    </Link>
  );
}
