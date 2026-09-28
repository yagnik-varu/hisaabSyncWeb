"use client";

import { HandCoinsIcon, LandmarkIcon, ReceiptIcon, UsersIcon, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { Money } from "@/components/shared/money";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Room overview — Phase 2 version: the numbers GET /rooms/:roomId already gives us.
 * Phase 3 adds treasury totals, recent activity and quick actions.
 */
export default function RoomOverviewPage() {
  const { roomId, room, currencyCode, can } = useCurrentRoom();
  const base = `/rooms/${roomId}`;
  const reviewer = can("contributions.review");

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={LandmarkIcon}
        label="Treasury balance"
        href={`${base}/treasury`}
        value={<Money value={room.treasuryBalance} currency={currencyCode} />}
        hint={room.settings.allowNegativeTreasury ? "Negative balance allowed" : "Strict mode"}
      />
      <StatCard
        icon={UsersIcon}
        label="Members"
        href={`${base}/members`}
        value={room.memberCount}
      />
      <StatCard
        icon={HandCoinsIcon}
        label="Pending contributions"
        href={reviewer ? `${base}/approvals` : `${base}/contributions`}
        value={room.pendingContributionsCount}
        hint={reviewer && room.pendingContributionsCount > 0 ? "Needs your review" : undefined}
      />
      <StatCard
        icon={ReceiptIcon}
        label="Pending expenses"
        href={reviewer ? `${base}/approvals` : `${base}/expenses`}
        value={room.pendingExpensesCount}
        hint={reviewer && room.pendingExpensesCount > 0 ? "Needs your review" : undefined}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="focus-visible:ring-ring/50 rounded-xl outline-none focus-visible:ring-3"
    >
      <Card className="hover:border-foreground/20 h-full transition-colors">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Icon className="size-4" />
            {label}
          </CardDescription>
          <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
          {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
        </CardHeader>
      </Card>
    </Link>
  );
}
