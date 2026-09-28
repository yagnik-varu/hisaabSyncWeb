"use client";

import { ArrowLeftRightIcon } from "lucide-react";

import { PayReimbursementButton } from "@/components/reimbursements/pay-reimbursement-button";
import { StatusBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { ItemList, ItemListSkeleton, ItemRow } from "@/components/shared/item-list";
import { Money } from "@/components/shared/money";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useAuth } from "@/hooks/use-auth";
import { formatDateTime, formatShortDate } from "@/lib/dates";
import type { ReimbursementListItem } from "@/types/api";

/** Reimbursements as a mobile-first list. Tapping a row opens the details sheet. */
export function ReimbursementsTable({
  reimbursements,
  currencyCode,
  loading,
  filtered,
  onOpen,
  emptyTitle,
  emptyDescription,
}: {
  reimbursements: ReimbursementListItem[] | undefined;
  currencyCode: string;
  loading?: boolean;
  filtered?: boolean;
  onOpen: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const { user } = useAuth();

  if (loading) return <ItemListSkeleton rows={4} />;

  if (!reimbursements?.length) {
    return (
      <EmptyState
        icon={ArrowLeftRightIcon}
        title={emptyTitle ?? (filtered ? "No matching reimbursements" : "No reimbursements yet")}
        description={
          emptyDescription ??
          (filtered
            ? "Try a different status or member."
            : "When an expense is approved, the treasury owes the member who paid. Those debts show up here.")
        }
      />
    );
  }

  return (
    <ItemList>
      {reimbursements.map((r) => {
        const isOwn = r.beneficiaryId === user?.id;
        return (
          <ItemRow
            key={r.id}
            onClick={() => onOpen(r.id)}
            leading={
              <UserAvatar
                name={r.beneficiary.fullName}
                imageUrl={r.beneficiary.profileImageUrl}
                className="size-9"
              />
            }
            title={
              // A real button so keyboard/screen-reader users can open the details too.
              <button
                type="button"
                className="text-left hover:underline"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen(r.id);
                }}
              >
                {r.beneficiary.fullName}
                {isOwn && <span className="text-muted-foreground font-normal"> (you)</span>}
              </button>
            }
            amount={<Money value={r.amount} currency={currencyCode} />}
            subtitle={
              <>
                <StatusBadge status={r.status} />
                <span className="min-w-0 truncate">{r.expense.title}</span>
              </>
            }
            aside={
              <time
                dateTime={r.createdAt}
                title={formatDateTime(r.createdAt)}
                className="text-muted-foreground text-xs"
              >
                {formatShortDate(r.createdAt)}
              </time>
            }
            footer={<PayReimbursementButton reimbursement={r} size="default" />}
          />
        );
      })}
    </ItemList>
  );
}
