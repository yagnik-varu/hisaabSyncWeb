"use client";

import { ArrowDownLeftIcon, ArrowUpRightIcon, BookOpenIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/dates";
import { describeTransaction, REFERENCE_LABELS, type MemberNames } from "@/lib/ledger";
import { cn } from "@/lib/utils";
import type { TreasuryTransaction } from "@/types/api";

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
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

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
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead>Entry</TableHead>
            <TableHead className="hidden md:table-cell">Recorded by</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const credit = tx.transactionType === "CREDIT";
            return (
              <TableRow key={tx.id}>
                <TableCell
                  className="text-muted-foreground align-top"
                  title={formatDateTime(tx.createdAt)}
                >
                  {formatDate(tx.createdAt)}
                </TableCell>
                <TableCell className="align-top whitespace-normal">
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                        credit
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-red-500/10 text-red-600",
                      )}
                      aria-label={credit ? "Credit" : "Debit"}
                    >
                      {credit ? (
                        <ArrowDownLeftIcon className="size-3" />
                      ) : (
                        <ArrowUpRightIcon className="size-3" />
                      )}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <p className="break-words">{describeTransaction(tx, names)}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-normal">
                          {REFERENCE_LABELS[tx.referenceType]}
                        </Badge>
                        {tx.actor && (
                          <span className="text-muted-foreground text-xs md:hidden">
                            by {tx.actor.fullName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground hidden align-top md:table-cell">
                  {tx.actor?.fullName ?? "—"}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right align-top font-medium",
                    credit ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
                  )}
                >
                  <Money
                    value={credit ? tx.amount : `-${tx.amount}`}
                    currency={currencyCode}
                    signed
                    className={credit ? undefined : "text-foreground"}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
