"use client";

import { PaperclipIcon, ReceiptIcon } from "lucide-react";
import Link from "next/link";

import { ExpenseActions } from "@/components/expenses/expense-actions";
import { StatusBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { ItemList, ItemListSkeleton, ItemRow, RowIcon } from "@/components/shared/item-list";
import { Money } from "@/components/shared/money";
import { useAuth } from "@/hooks/use-auth";
import { formatDateTime, formatShortDate } from "@/lib/dates";
import { safeExternalUrl } from "@/lib/url";
import type { Expense } from "@/types/api";

/** Expenses as a mobile-first list. The title opens the detail page. */
export function ExpensesTable({
  roomId,
  expenses,
  currencyCode,
  loading,
  filtered,
  emptyAction,
}: {
  roomId: string;
  expenses: Expense[] | undefined;
  currencyCode: string;
  loading?: boolean;
  filtered?: boolean;
  emptyAction?: React.ReactNode;
}) {
  const { user } = useAuth();

  if (loading) return <ItemListSkeleton />;

  if (!expenses?.length) {
    return (
      <EmptyState
        icon={ReceiptIcon}
        title={filtered ? "No matching expenses" : "No expenses yet"}
        description={
          filtered
            ? "Try a different status, category, member or date range."
            : "Paid for something shared? Log it here and get reimbursed from the pool."
        }
        action={filtered ? undefined : emptyAction}
      />
    );
  }

  return (
    <ItemList>
      {expenses.map((e) => {
        const who = e.submittedBy === user?.id ? "You" : (e.submitter?.fullName ?? "Former member");
        return (
          <ItemRow
            key={e.id}
            leading={
              <RowIcon>
                <ReceiptIcon />
              </RowIcon>
            }
            title={
              // Stretched link: the whole title area is a big tap target on phones.
              <Link href={`/rooms/${roomId}/expenses/${e.id}`} className="hover:underline">
                {e.title}
              </Link>
            }
            amount={<Money value={e.amount} currency={currencyCode} />}
            subtitle={
              <>
                <StatusBadge status={e.status} />
                <span className="min-w-0 truncate">
                  {[e.category?.name, who].filter(Boolean).join(" · ")}
                </span>
                {safeExternalUrl(e.receiptUrl) && (
                  <PaperclipIcon className="size-3.5 shrink-0" aria-label="Has receipt" />
                )}
              </>
            }
            aside={
              <time
                dateTime={e.createdAt}
                title={formatDateTime(e.createdAt)}
                className="text-muted-foreground text-xs"
              >
                {formatShortDate(e.createdAt)}
              </time>
            }
            footer={<ExpenseActions expense={e} size="default" className="contents" />}
          >
            {e.status === "REJECTED" && e.rejectionReason && (
              <p className="text-destructive text-sm break-words">Rejected: {e.rejectionReason}</p>
            )}
          </ItemRow>
        );
      })}
    </ItemList>
  );
}
