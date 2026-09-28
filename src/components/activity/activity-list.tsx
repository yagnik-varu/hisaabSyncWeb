"use client";

import { formatDistanceToNow } from "date-fns";
import { HistoryIcon } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { describeActivity } from "@/lib/activity";
import { formatDateTime } from "@/lib/dates";
import type { ActivityItem } from "@/types/api";

/** Timeline of room events. Reused by the overview (recent) and the Activity page (Phase 8). */
export function ActivityList({
  items,
  roomId,
  currencyCode,
  loading,
  skeletonCount = 4,
}: {
  items: ActivityItem[] | undefined;
  roomId: string;
  currencyCode: string;
  loading?: boolean;
  skeletonCount?: number;
}) {
  if (loading) {
    return (
      <ul className="space-y-4">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <li key={i} className="flex gap-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (!items?.length) {
    return (
      <EmptyState
        icon={HistoryIcon}
        title="No activity yet"
        description="Approvals, payouts and treasury adjustments will show up here."
        className="py-8"
      />
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const { icon: Icon, verb, href } = describeActivity(item);
        const sentence = (
          <>
            <span className="font-medium">{item.actor.fullName}</span> {verb}
            {item.details.amount && (
              <>
                {" of "}
                <Money
                  value={item.details.amount}
                  currency={currencyCode}
                  className="font-medium"
                />
              </>
            )}
          </>
        );
        return (
          <li key={item.id} className="flex gap-3">
            <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
              <Icon className="text-muted-foreground size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                {href ? (
                  <Link href={`/rooms/${roomId}/${href}`} className="hover:underline">
                    {sentence}
                  </Link>
                ) : (
                  sentence
                )}
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <time dateTime={item.createdAt} className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </time>
                </TooltipTrigger>
                <TooltipContent>{formatDateTime(item.createdAt)}</TooltipContent>
              </Tooltip>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
