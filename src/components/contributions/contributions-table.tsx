"use client";

import { HandCoinsIcon } from "lucide-react";

import { ContributionActions } from "@/components/contributions/contribution-actions";
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
import { formatDate, formatDateTime } from "@/lib/dates";
import type { Contribution } from "@/types/api";

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

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

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
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead className="hidden sm:table-cell">Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contributions.map((c) => {
            const name = c.contributor?.fullName ?? "Former member";
            const isOwn = c.contributorId === user?.id;
            return (
              <TableRow key={c.id}>
                <TableCell className="align-top whitespace-normal">
                  <div className="flex items-start gap-2">
                    <UserAvatar name={name} className="mt-0.5 size-7" />
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">
                        {name}
                        {isOwn && <span className="text-muted-foreground font-normal"> (you)</span>}
                      </p>
                      {c.note && (
                        <p className="text-muted-foreground line-clamp-2 text-sm break-words">
                          {c.note}
                        </p>
                      )}
                      {c.status === "REJECTED" && c.rejectionReason && (
                        <p className="text-destructive text-sm break-words">
                          Rejected: {c.rejectionReason}
                        </p>
                      )}
                      {/* Compact meta for small screens (date/status columns are hidden). */}
                      <div className="flex flex-wrap items-center gap-2 md:hidden">
                        <StatusBadge status={c.status} />
                        <span className="text-muted-foreground text-xs sm:hidden">
                          {formatDate(c.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell
                  className="text-muted-foreground hidden align-top sm:table-cell"
                  title={formatDateTime(c.createdAt)}
                >
                  {formatDate(c.createdAt)}
                </TableCell>
                <TableCell className="text-right align-top font-medium">
                  <Money value={c.amount} currency={currencyCode} />
                </TableCell>
                <TableCell className="hidden align-top md:table-cell">
                  <StatusBadge status={c.status} />
                </TableCell>
                <TableCell className="align-top">
                  <ContributionActions contribution={c} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
