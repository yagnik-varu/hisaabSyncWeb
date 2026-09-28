"use client";

import { HandCoinsIcon } from "lucide-react";

import { ContributionActions } from "@/components/contributions/contribution-actions";
import { StatusBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { ItemList, ItemListSkeleton, ItemRow } from "@/components/shared/item-list";
import { Money } from "@/components/shared/money";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useAuth } from "@/hooks/use-auth";
import { formatDateTime, formatShortDate } from "@/lib/dates";
import type { Contribution } from "@/types/api";

/** Contributions as a mobile-first list (name · amount / status · date / note / actions). */
export function ContributionsTable({
  contributions,
  currencyCode,
  loading,
  filtered,
  emptyAction,
}: {
  contributions: Contribution[] | undefined;
  currencyCode: string;
  loading?: boolean;
  filtered?: boolean;
  emptyAction?: React.ReactNode;
}) {
  const { user } = useAuth();

  if (loading) return <ItemListSkeleton />;

  if (!contributions?.length) {
    return (
      <EmptyState
        icon={HandCoinsIcon}
        title={filtered ? "No matching contributions" : "No contributions yet"}
        description={
          filtered
            ? "Try a different status, member or date range."
            : "When members add money to the pool, it shows up here for approval."
        }
        action={filtered ? undefined : emptyAction}
      />
    );
  }

  return (
    <ItemList>
      {contributions.map((c) => {
        const name = c.contributor?.fullName ?? "Former member";
        const isOwn = c.contributorId === user?.id;
        return (
          <ItemRow
            key={c.id}
            leading={<UserAvatar name={name} className="size-9" />}
            title={
              <>
                {name}
                {isOwn && <span className="text-muted-foreground font-normal"> (you)</span>}
              </>
            }
            amount={<Money value={c.amount} currency={currencyCode} />}
            subtitle={<StatusBadge status={c.status} />}
            aside={
              <time
                dateTime={c.createdAt}
                title={formatDateTime(c.createdAt)}
                className="text-muted-foreground text-xs"
              >
                {formatShortDate(c.createdAt)}
              </time>
            }
            footer={<ContributionActions contribution={c} size="default" className="contents" />}
          >
            {c.note && (
              <p className="text-muted-foreground line-clamp-2 text-sm break-words">{c.note}</p>
            )}
            {c.status === "REJECTED" && c.rejectionReason && (
              <p className="text-destructive text-sm break-words">Rejected: {c.rejectionReason}</p>
            )}
          </ItemRow>
        );
      })}
    </ItemList>
  );
}
