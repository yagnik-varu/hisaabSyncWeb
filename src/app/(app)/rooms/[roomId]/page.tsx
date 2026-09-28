"use client";

import {
  ArrowRightIcon,
  HandCoinsIcon,
  InboxIcon,
  LandmarkIcon,
  ReceiptIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { ActivityList } from "@/components/activity/activity-list";
import { SubmitContributionDialog } from "@/components/contributions/submit-contribution-dialog";
import { useCurrentRoom } from "@/components/rooms/room-context";
import { FormError } from "@/components/shared/form-error";
import { TreasurySummaryCards } from "@/components/treasury/treasury-summary-cards";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRoomActivity } from "@/hooks/use-treasury";
import { normalizeError } from "@/lib/api/errors";

/** Room overview: money at a glance, what needs attention, what happened recently. */
export default function RoomOverviewPage() {
  const { roomId, room, currencyCode, can, isArchived } = useCurrentRoom();
  const base = `/rooms/${roomId}`;
  const reviewer = can("contributions.review");
  const activity = useRoomActivity(roomId, { page: 1, limit: 5 });
  const pendingTotal = room.pendingContributionsCount + room.pendingExpensesCount;

  return (
    <div className="space-y-6">
      <TreasurySummaryCards />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Approvals, payouts and adjustments in this room.</CardDescription>
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Needs attention</CardTitle>
              <CardDescription>
                {reviewer
                  ? "Items waiting for an admin or accountant."
                  : "Items waiting for approval."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <PendingRow
                icon={HandCoinsIcon}
                label="Pending contributions"
                count={room.pendingContributionsCount}
                href={reviewer ? `${base}/approvals` : `${base}/contributions`}
              />
              <PendingRow
                icon={ReceiptIcon}
                label="Pending expenses"
                count={room.pendingExpensesCount}
                href={reviewer ? `${base}/approvals` : `${base}/expenses`}
              />
              {reviewer && pendingTotal > 0 && (
                <Button asChild className="mt-3 w-full">
                  <Link href={`${base}/approvals`}>
                    <InboxIcon />
                    Review {pendingTotal} item{pendingTotal === 1 ? "" : "s"}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {!isArchived && (
                <>
                  <SubmitContributionDialog
                    trigger={
                      <Button variant="outline" className="justify-start">
                        <HandCoinsIcon />
                        Add money to the pool
                      </Button>
                    }
                  />
                  <QuickLink
                    href={`${base}/expenses`}
                    icon={ReceiptIcon}
                    label="Log a shared expense"
                  />
                </>
              )}
              <QuickLink href={`${base}/treasury`} icon={LandmarkIcon} label="View the ledger" />
              <QuickLink
                href={`${base}/members`}
                icon={UsersIcon}
                label={`Members (${room.memberCount})`}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PendingRow({
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
      className="hover:bg-muted/60 -mx-2 flex items-center justify-between rounded-md px-2 py-2 text-sm"
    >
      <span className="flex items-center gap-2">
        <Icon className="text-muted-foreground size-4" />
        {label}
      </span>
      <span
        className={
          count > 0
            ? "rounded-full bg-amber-500/15 px-2 font-medium text-amber-700 tabular-nums dark:text-amber-400"
            : "text-muted-foreground tabular-nums"
        }
      >
        {count}
      </span>
    </Link>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Button asChild variant="outline" className="justify-start">
      <Link href={href}>
        <Icon />
        {label}
      </Link>
    </Button>
  );
}
