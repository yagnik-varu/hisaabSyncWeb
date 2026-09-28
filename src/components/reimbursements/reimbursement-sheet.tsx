"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { PayReimbursementButton } from "@/components/reimbursements/pay-reimbursement-button";
import { useCurrentRoom } from "@/components/rooms/room-context";
import { StatusBadge } from "@/components/shared/badges";
import { FormError } from "@/components/shared/form-error";
import { Money } from "@/components/shared/money";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-media-query";
import { useReimbursement } from "@/hooks/use-reimbursements";
import { normalizeError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/dates";

/**
 * Side panel with full reimbursement details. Loads GET /reimbursements/:id, which is the only
 * place the backend exposes who paid it (`payer`).
 */
export function ReimbursementSheet({
  reimbursementId,
  onOpenChange,
}: {
  reimbursementId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { roomId, currencyCode } = useCurrentRoom();
  const isMobile = useIsMobile();
  const details = useReimbursement(roomId, reimbursementId);
  const r = details.data;

  return (
    <Sheet open={!!reimbursementId} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "max-h-[88dvh] overflow-y-auto rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
            : "w-full sm:max-w-md"
        }
      >
        <SheetHeader>
          <SheetTitle>Reimbursement</SheetTitle>
          <SheetDescription>
            Money the treasury owes a member for an approved expense.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-4">
          {details.isError ? (
            <FormError message={normalizeError(details.error).message} />
          ) : !r ? (
            <div className="space-y-3">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Money
                  value={r.amount}
                  currency={currencyCode}
                  className="text-3xl font-semibold"
                />
                <div>
                  <StatusBadge status={r.status} />
                </div>
              </div>

              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-muted-foreground mb-1">Owed to</dt>
                  <dd className="flex items-center gap-2">
                    <UserAvatar
                      name={r.beneficiary.fullName}
                      imageUrl={r.beneficiary.profileImageUrl}
                      className="size-7"
                    />
                    {r.beneficiary.fullName}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">For expense</dt>
                  <dd className="space-y-1">
                    <p className="font-medium">{r.expense.title}</p>
                    <p className="text-muted-foreground">
                      {r.expense.category.name} ·{" "}
                      <Money value={r.expense.amount} currency={currencyCode} />
                    </p>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">Created</dt>
                  <dd>{formatDateTime(r.createdAt)}</dd>
                </div>
                {r.status === "PAID" && (
                  <div>
                    <dt className="text-muted-foreground mb-1">Paid</dt>
                    <dd>
                      {r.paidAt ? formatDateTime(r.paidAt) : "—"}
                      {r.payer ? ` by ${r.payer.fullName}` : ""}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap [&>*:only-child]:col-span-2">
                <PayReimbursementButton reimbursement={r} size="default" />
                <Button asChild variant="outline">
                  <Link href={`/rooms/${roomId}/expenses/${r.expense.id}`}>
                    View expense
                    <ArrowRightIcon />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
