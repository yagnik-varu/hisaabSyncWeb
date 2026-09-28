"use client";

import { ArrowDownLeftIcon, ArrowUpRightIcon, LandmarkIcon } from "lucide-react";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { FormError } from "@/components/shared/form-error";
import { Money } from "@/components/shared/money";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTreasurySummary } from "@/hooks/use-treasury";
import { normalizeError } from "@/lib/api/errors";

/**
 * Balance + lifetime totals. Note: "total contributions / reimbursements" only count ledger rows of
 * those types — manual adjustments move the balance but aren't part of either total.
 */
export function TreasurySummaryCards() {
  const { roomId, room } = useCurrentRoom();
  const summary = useTreasurySummary(roomId);

  if (summary.isError) return <FormError message={normalizeError(summary.error).message} />;

  const currency = summary.data?.currencyCode ?? room.settings.currencyCode;
  const strict = !room.settings.allowNegativeTreasury;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <SummaryCard
        icon={LandmarkIcon}
        label="Current balance"
        loading={summary.isPending}
        value={<Money value={summary.data?.currentBalance} currency={currency} />}
        hint={strict ? "Strict mode: can't go below zero" : "Negative balance allowed"}
        emphasis
      />
      <SummaryCard
        icon={ArrowDownLeftIcon}
        label="Total contributed"
        loading={summary.isPending}
        value={<Money value={summary.data?.totalContributions} currency={currency} />}
        hint="Approved contributions, all time"
      />
      <SummaryCard
        icon={ArrowUpRightIcon}
        label="Total reimbursed"
        loading={summary.isPending}
        value={<Money value={summary.data?.totalReimbursements} currency={currency} />}
        hint="Paid reimbursements, all time"
      />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  loading,
  emphasis,
}: {
  icon: typeof LandmarkIcon;
  label: string;
  value: React.ReactNode;
  hint: string;
  loading: boolean;
  emphasis?: boolean;
}) {
  return (
    <Card className={emphasis ? "border-primary/30 bg-primary/[0.03]" : undefined}>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Icon className="size-4" />
          {label}
        </CardDescription>
        <CardTitle className="text-2xl">
          {loading ? <Skeleton className="h-8 w-32" /> : value}
        </CardTitle>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </CardHeader>
    </Card>
  );
}
