"use client";

import { ArrowDownLeftIcon, ArrowUpRightIcon, BookOpenIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ItemList, ItemListSkeleton, ItemRow, RowIcon } from "@/components/shared/item-list";
import { Money } from "@/components/shared/money";
import { formatDateTime, formatShortDate } from "@/lib/dates";
import { describeTransaction, REFERENCE_LABELS, type MemberNames } from "@/lib/ledger";
import type { TreasuryTransaction } from "@/types/api";

/** Ledger as a bank-statement style list: money in is green with "+", money out plain with "−". */
export function LedgerTable({
  transactions,
  names,
  currencyCode,
  loading,
  filtered,
}: {
  transactions: TreasuryTransaction[] | undefined;
  names: MemberNames;
  currencyCode: string;
  loading?: boolean;
  filtered?: boolean;
}) {
  if (loading) return <ItemListSkeleton />;

  if (!transactions?.length) {
    return (
      <EmptyState
        icon={BookOpenIcon}
        title={filtered ? "No matching entries" : "The ledger is empty"}
        description={
          filtered
            ? "Try a different type or date range."
            : "Approved contributions, paid reimbursements and manual adjustments are recorded here."
        }
      />
    );
  }

  return (
    <ItemList>
      {transactions.map((tx) => {
        const credit = tx.transactionType === "CREDIT";
        return (
          <ItemRow
            key={tx.id}
            leading={
              <RowIcon tone={credit ? "credit" : "debit"}>
                {credit ? (
                  <ArrowDownLeftIcon aria-label="Money in" />
                ) : (
                  <ArrowUpRightIcon aria-label="Money out" />
                )}
              </RowIcon>
            }
            title={<span className="line-clamp-2">{describeTransaction(tx, names)}</span>}
            amount={
              <Money
                value={credit ? tx.amount : `-${tx.amount}`}
                currency={currencyCode}
                signed
                className={credit ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}
              />
            }
            subtitle={
              <span className="min-w-0 truncate">
                {[REFERENCE_LABELS[tx.referenceType], tx.actor?.fullName]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            }
            aside={
              <time
                dateTime={tx.createdAt}
                title={formatDateTime(tx.createdAt)}
                className="text-muted-foreground text-xs"
              >
                {formatShortDate(tx.createdAt)}
              </time>
            }
          />
        );
      })}
    </ItemList>
  );
}
