"use client";

import { PaperclipIcon, ReceiptIcon } from "lucide-react";
import Link from "next/link";

import { ExpenseActions } from "@/components/expenses/expense-actions";
import { StatusBadge } from "@/components/shared/badges";
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
import { useAuth } from "@/hooks/use-auth";
import { formatDate, formatDateTime } from "@/lib/dates";
import { safeExternalUrl } from "@/lib/url";
import type { Expense } from "@/types/api";

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

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

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
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Expense</TableHead>
            <TableHead className="hidden sm:table-cell">Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((e) => {
            const who =
              e.submittedBy === user?.id ? "You" : (e.submitter?.fullName ?? "Former member");
            return (
              <TableRow key={e.id}>
                <TableCell className="align-top whitespace-normal">
                  <div className="min-w-0 space-y-1">
                    <Link
                      href={`/rooms/${roomId}/expenses/${e.id}`}
                      className="font-medium break-words hover:underline"
                    >
                      {e.title}
                    </Link>
                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      {e.category && (
                        <Badge variant="outline" className="font-normal">
                          {e.category.name}
                        </Badge>
                      )}
                      <span>{who}</span>
                      {safeExternalUrl(e.receiptUrl) && (
                        <PaperclipIcon className="size-3.5" aria-label="Has receipt" />
                      )}
                    </div>
                    {e.status === "REJECTED" && e.rejectionReason && (
                      <p className="text-destructive text-sm break-words">
                        Rejected: {e.rejectionReason}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 md:hidden">
                      <StatusBadge status={e.status} />
                      <span className="text-muted-foreground text-xs sm:hidden">
                        {formatDate(e.createdAt)}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell
                  className="text-muted-foreground hidden align-top sm:table-cell"
                  title={formatDateTime(e.createdAt)}
                >
                  {formatDate(e.createdAt)}
                </TableCell>
                <TableCell className="text-right align-top font-medium">
                  <Money value={e.amount} currency={currencyCode} />
                </TableCell>
                <TableCell className="hidden align-top md:table-cell">
                  <StatusBadge status={e.status} />
                </TableCell>
                <TableCell className="align-top">
                  <ExpenseActions expense={e} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
