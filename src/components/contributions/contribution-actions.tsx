"use client";

import { CheckIcon, TriangleAlertIcon, Undo2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Money } from "@/components/shared/money";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useContributionMutations } from "@/hooks/use-contributions";
import { formatMoney } from "@/lib/money";
import { canCancelOwn } from "@/lib/permissions";
import type { Contribution } from "@/types/api";

/**
 * Row actions for a contribution. Only PENDING items have actions:
 * - approvers: Approve / Reject (reason optional)
 * - the submitter: Cancel
 */
export function ContributionActions({
  contribution,
  size = "sm",
  className = "flex flex-wrap justify-end gap-1",
}: {
  contribution: Contribution;
  size?: "sm" | "default";
  /** Wrapper classes. Lists pass "contents" so the buttons join the row's action grid. */
  className?: string;
}) {
  const { roomId, currencyCode, can, isArchived } = useCurrentRoom();
  const { user } = useAuth();
  const { approve, reject, cancel } = useContributionMutations(roomId);

  if (contribution.status !== "PENDING" || isArchived) return null;

  const isOwn = user?.id === contribution.contributorId;
  const canReview = can("contributions.review");
  const canCancel = canCancelOwn(user?.id, contribution.contributorId, contribution.status);
  if (!canReview && !canCancel) return null;
  const who = contribution.contributor?.fullName ?? "this member";
  const amount = formatMoney(contribution.amount, currencyCode);

  const summary = (
    <div className="bg-muted/50 rounded-lg border p-3 text-sm">
      <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">{isOwn ? "You" : who}</span>
        <Money value={contribution.amount} currency={currencyCode} className="font-medium" />
      </div>
      {contribution.note && <p className="text-muted-foreground mt-1">{contribution.note}</p>}
    </div>
  );

  return (
    <div className={className}>
      {canReview && (
        <>
          <ConfirmDialog
            trigger={
              <Button
                size={size}
                className="order-last"
                aria-label={`Approve ${amount} from ${who}`}
              >
                <CheckIcon />
                Approve
              </Button>
            }
            title="Approve contribution?"
            description={`${amount} will be added to the treasury and recorded in the ledger. This can't be undone.`}
            confirmLabel="Approve"
            onConfirm={() =>
              approve.mutateAsync(contribution.id).then(() => {
                toast.success(`Approved ${amount}`);
              })
            }
          >
            {summary}
            {isOwn && (
              <Alert>
                <TriangleAlertIcon />
                <AlertDescription>
                  This is your own contribution. Make sure the money actually reached the pool.
                </AlertDescription>
              </Alert>
            )}
          </ConfirmDialog>
          <ConfirmDialog
            trigger={
              <Button size={size} variant="outline" aria-label={`Reject ${amount} from ${who}`}>
                <XIcon />
                Reject
              </Button>
            }
            title="Reject contribution?"
            description="The contribution won't count towards the treasury."
            confirmLabel="Reject"
            destructive
            reason={{
              label: "Reason",
              placeholder: "Payment not received in the account",
            }}
            onConfirm={(reason) =>
              reject.mutateAsync({ id: contribution.id, reason }).then(() => {
                toast.success("Contribution rejected");
              })
            }
          >
            {summary}
          </ConfirmDialog>
        </>
      )}
      {canCancel && (
        <ConfirmDialog
          trigger={
            <Button size={size} variant="outline">
              <Undo2Icon />
              Cancel
            </Button>
          }
          title="Cancel your contribution?"
          description="It will be withdrawn and no longer wait for approval."
          confirmLabel="Cancel contribution"
          destructive
          onConfirm={() =>
            cancel.mutateAsync(contribution.id).then(() => {
              toast.success("Contribution cancelled");
            })
          }
        >
          {summary}
        </ConfirmDialog>
      )}
    </div>
  );
}
