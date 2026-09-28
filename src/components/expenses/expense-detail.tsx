"use client";

import {
  ArrowLeftIcon,
  CircleXIcon,
  ExternalLinkIcon,
  SearchXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import Link from "next/link";

import { ExpenseActions } from "@/components/expenses/expense-actions";
import { useCurrentRoom } from "@/components/rooms/room-context";
import { StatusBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { FormError } from "@/components/shared/form-error";
import { Money } from "@/components/shared/money";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { useExpense } from "@/hooks/use-expenses";
import { normalizeError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/dates";
import { safeExternalUrl, urlHost } from "@/lib/url";
import { isUuid } from "@/schemas/room";
import type { ExpenseDetails } from "@/types/api";

export function ExpenseDetail({ expenseId }: { expenseId: string }) {
  const { roomId, currencyCode } = useCurrentRoom();
  const { user } = useAuth();
  const validId = isUuid(expenseId);
  const expense = useExpense(roomId, expenseId, validId);
  const backHref = `/rooms/${roomId}/expenses`;

  const error = expense.error ? normalizeError(expense.error) : null;
  if (!validId || error?.status === 404 || error?.code === "EXPENSE_NOT_FOUND") {
    return (
      <EmptyState
        icon={SearchXIcon}
        title="Expense not found"
        description="It may belong to another room, or the link is wrong."
        action={
          <Button asChild variant="outline">
            <Link href={backHref}>
              <ArrowLeftIcon />
              Back to expenses
            </Link>
          </Button>
        }
      />
    );
  }
  if (error) return <FormError message={error.message} />;
  if (!expense.data) return <ExpenseDetailSkeleton />;

  const e = expense.data;
  const receipt = safeExternalUrl(e.receiptUrl);
  const paidBy = e.submittedBy === user?.id ? "You" : (e.submitter?.fullName ?? "Former member");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={backHref}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeftIcon className="size-3.5" />
        Expenses
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold break-words">{e.title}</h2>
            <StatusBadge status={e.status} />
          </div>
          <Money value={e.amount} currency={currencyCode} className="text-3xl font-semibold" />
        </div>
        <ExpenseActions expense={e} size="default" />
      </div>

      {e.status === "REJECTED" && (
        <Alert variant="destructive">
          <CircleXIcon />
          <AlertTitle>Rejected{e.reviewer ? ` by ${e.reviewer.fullName}` : ""}</AlertTitle>
          {e.rejectionReason && <AlertDescription>{e.rejectionReason}</AlertDescription>}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            <DetailItem label="Category">
              {e.category ? <Badge variant="outline">{e.category.name}</Badge> : "—"}
            </DetailItem>
            <DetailItem label="Paid by">{paidBy}</DetailItem>
            <DetailItem label="Submitted">{formatDateTime(e.createdAt)}</DetailItem>
            {e.reviewer && e.reviewedAt && (
              <DetailItem label={e.status === "REJECTED" ? "Rejected" : "Reviewed"}>
                {e.reviewer.fullName} · {formatDateTime(e.reviewedAt)}
              </DetailItem>
            )}
            {e.description && (
              <DetailItem label="Details" wide>
                <p className="break-words whitespace-pre-wrap">{e.description}</p>
              </DetailItem>
            )}
            <DetailItem label="Receipt" wide>
              {receipt ? (
                <a
                  href={receipt}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 underline underline-offset-4"
                >
                  View receipt on {urlHost(receipt)}
                  <ExternalLinkIcon className="size-3.5" />
                </a>
              ) : e.receiptUrl ? (
                <span className="text-muted-foreground inline-flex items-center gap-1">
                  <TriangleAlertIcon className="size-3.5" />
                  Receipt link isn&apos;t a valid web address, so it&apos;s hidden for safety.
                </span>
              ) : (
                <span className="text-muted-foreground">No receipt attached</span>
              )}
            </DetailItem>
          </dl>
        </CardContent>
      </Card>

      {e.status === "APPROVED" && (
        <ReimbursementCard expense={e} missing={expense.reimbursementMissing} />
      )}
    </div>
  );
}

function ReimbursementCard({
  expense,
  missing,
}: {
  expense: ExpenseDetails;
  /** Polling gave up without a reimbursement appearing. */
  missing: boolean;
}) {
  const { roomId, currencyCode } = useCurrentRoom();
  const r = expense.reimbursement;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reimbursement</CardTitle>
        <CardDescription>What the treasury owes for this expense.</CardDescription>
      </CardHeader>
      <CardContent>
        {!r && missing ? (
          <p className="text-muted-foreground flex items-start gap-2 text-sm">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
            No reimbursement was created for this expense. This is a server-side problem: ask an
            admin to check the backend logs. Reload the page to check again.
          </p>
        ) : !r ? (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Spinner />
            Creating the reimbursement… this usually takes a second.
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Money value={r.amount} currency={currencyCode} className="font-semibold" />
                <StatusBadge status={r.status} />
              </div>
              <p className="text-muted-foreground text-sm">
                {r.status === "PAID" && r.paidAt
                  ? `Paid from the treasury on ${formatDateTime(r.paidAt)}`
                  : "Waiting for an admin or accountant to pay it out."}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/rooms/${roomId}/reimbursements`}>View reimbursements</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailItem({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-muted-foreground mb-1">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function ExpenseDetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
