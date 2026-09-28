"use client";

import { ArrowLeftRightIcon } from "lucide-react";

import { PayReimbursementButton } from "@/components/reimbursements/pay-reimbursement-button";
import { StatusBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { UserAvatar } from "@/components/shared/user-avatar";
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
import { formatDate } from "@/lib/dates";
import type { ReimbursementListItem } from "@/types/api";

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

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

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
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Owed to</TableHead>
            <TableHead className="hidden sm:table-cell">Expense</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reimbursements.map((r) => {
            const isOwn = r.beneficiaryId === user?.id;
            return (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => onOpen(r.id)}>
                <TableCell className="align-top whitespace-normal">
                  <div className="flex items-start gap-2">
                    <UserAvatar
                      name={r.beneficiary.fullName}
                      imageUrl={r.beneficiary.profileImageUrl}
                      className="mt-0.5 size-7"
                    />
                    <div className="min-w-0 space-y-1">
                      {/* A real button so keyboard users can open the details too. */}
                      <button
                        type="button"
                        className="text-left font-medium hover:underline"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpen(r.id);
                        }}
                      >
                        {r.beneficiary.fullName}
                        {isOwn && <span className="text-muted-foreground font-normal"> (you)</span>}
                      </button>
                      <p className="text-muted-foreground text-sm break-words sm:hidden">
                        {r.expense.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 md:hidden">
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden align-top whitespace-normal sm:table-cell">
                  <p className="break-words">{r.expense.title}</p>
                  <p className="text-muted-foreground text-sm">
                    {r.expense.category.name} · {formatDate(r.createdAt)}
                  </p>
                </TableCell>
                <TableCell className="text-right align-top font-medium">
                  <Money value={r.amount} currency={currencyCode} />
                </TableCell>
                <TableCell className="hidden align-top md:table-cell">
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell className="align-top" onClick={(event) => event.stopPropagation()}>
                  <div className="flex justify-end">
                    <PayReimbursementButton reimbursement={r} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
