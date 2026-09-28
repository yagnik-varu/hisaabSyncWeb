"use client";

import { ArrowDownLeftIcon, ArrowUpRightIcon, ShieldCheckIcon, WavesIcon } from "lucide-react";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { FormError } from "@/components/shared/form-error";
import { Money } from "@/components/shared/money";
import { Skeleton } from "@/components/ui/skeleton";
import { useTreasurySummary } from "@/hooks/use-treasury";
import { normalizeError } from "@/lib/api/errors";
import { isNegative } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * The pool at a glance — one card instead of three, so it fits above the fold on a phone.
 * Big balance, strict/flexible mode, and lifetime money in / money out.
 */
export function BalanceHero({ className }: { className?: string }) {
  const { roomId, room } = useCurrentRoom();
  const summary = useTreasurySummary(roomId);

  if (summary.isError) return <FormError message={normalizeError(summary.error).message} />;

  const currency = summary.data?.currencyCode ?? room.settings.currencyCode;
  const balance = summary.data?.currentBalance ?? room.treasuryBalance;
  const strict = !room.settings.allowNegativeTreasury;
  const negative = isNegative(balance);

  return (
    <section
      aria-label="Treasury balance"
      className={cn(
        "bg-primary text-primary-foreground relative overflow-hidden rounded-2xl p-5 shadow-sm",
        className,
      )}
    >
      {/* soft decorative glow */}
      <div className="bg-primary-foreground/10 pointer-events-none absolute -top-16 -right-16 size-48 rounded-full blur-2xl" />
      <div className="relative flex items-center justify-between gap-2">
        <p className="text-primary-foreground/70 text-sm font-medium">Pool balance</p>
        <span className="bg-primary-foreground/10 text-primary-foreground/80 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs">
          {strict ? <ShieldCheckIcon className="size-3.5" /> : <WavesIcon className="size-3.5" />}
          {strict ? "Strict" : "Can go negative"}
        </span>
      </div>
      <div className="relative mt-1">
        {summary.isPending ? (
          <Skeleton className="bg-primary-foreground/20 h-10 w-44" />
        ) : (
          <Money
            value={balance}
            currency={currency}
            className={cn(
              "text-4xl font-semibold tracking-tight",
              negative ? "text-red-300" : "text-primary-foreground",
            )}
          />
        )}
      </div>
      <div className="border-primary-foreground/15 relative mt-4 grid grid-cols-2 gap-3 border-t pt-3">
        <MiniStat
          icon={ArrowDownLeftIcon}
          label="Money in"
          loading={summary.isPending}
          value={
            <Money
              value={summary.data?.totalContributions}
              currency={currency}
              className="text-primary-foreground"
            />
          }
        />
        <MiniStat
          icon={ArrowUpRightIcon}
          label="Paid out"
          loading={summary.isPending}
          value={
            <Money
              value={summary.data?.totalReimbursements}
              currency={currency}
              className="text-primary-foreground"
            />
          }
        />
      </div>
    </section>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof ArrowDownLeftIcon;
  label: string;
  value: React.ReactNode;
  loading: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-primary-foreground/70 flex items-center gap-1 text-xs">
        <Icon className="size-3.5" />
        {label}
      </p>
      <div className="truncate text-base font-semibold">
        {loading ? <Skeleton className="bg-primary-foreground/20 mt-1 h-5 w-20" /> : value}
      </div>
    </div>
  );
}
