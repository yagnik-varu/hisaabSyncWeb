"use client";

import { CheckIcon, TriangleAlertIcon, Undo2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Money } from "@/components/shared/money";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useExpenseMutations } from "@/hooks/use-expenses";
import { formatMoney } from "@/lib/money";
import { canCancelOwn } from "@/lib/permissions";
import type { Expense } from "@/types/api";

/**
 * Actions for a PENDING expense: approve / reject (reason REQUIRED) for approvers,
 * cancel for the submitter. `size="default"` is used on the detail page.
 */
export function ExpenseActions({
  expense,
  size = "sm",
}: {
  expense: Expense;
  size?: "sm" | "default";
}) {
  const { roomId, currencyCode, can, isArchived } = useCurrentRoom();
  const { user } = useAuth();
  const { approve, reject, cancel } = useExpenseMutations(roomId);

  if (expense.status !== "PENDING" || isArchived) return null;

  const isOwn = user?.id === expense.submittedBy;
  const canReview = can("expenses.review");
  const canCancel = canCancelOwn(user?.id, expense.submittedBy, expense.status);
  const who = isOwn ? "you" : (expense.submitter?.fullName ?? "this member");
  const amount = formatMoney(expense.amount, currencyCode);

  const summary = (
    <div className="bg-muted/50 rounded-lg border p-3 text-sm">
      <div className="flex justify-between gap-2">
        <span className="font-medium">{expense.title}</span>
        <Money value={expense.amount} currency={currencyCode} className="font-medium" />
      </div>
      <p className="text-muted-foreground mt-1">
        {expense.category?.name ? `${expense.category.name} · ` : ""}paid by {who}
      </p>
    </div>
  );

  return (
    <div className="flex flex-wrap justify-end gap-1">
      {canReview && (
        <>
          <ConfirmDialog
            trigger={
              <Button size={size} variant="outline" aria-label={`Approve ${expense.title}`}>
                <CheckIcon />
                Approve
              </Button>
            }
            title="Approve expense?"
            description={`A reimbursement of ${amount} to ${who} will be created. It's paid out separately from Reimbursements.`}
            confirmLabel="Approve"
            onConfirm={() =>
              approve.mutateAsync(expense.id).then(() => {
                toast.success(`Approved "${expense.title}"`, {
                  description: `Reimbursement of ${amount} is being created.`,
                });
              })
            }
          >
            {summary}
            {isOwn && (
              <Alert>
                <TriangleAlertIcon />
                <AlertDescription>
                  This is your own expense. Consider asking another admin or accountant to review
                  it.
                </AlertDescription>
              </Alert>
            )}
          </ConfirmDialog>
          <ConfirmDialog
            trigger={
              <Button size={size} variant="ghost" aria-label={`Reject ${expense.title}`}>
                <XIcon />
                Reject
              </Button>
            }
            title="Reject expense?"
            description="The member won't be reimbursed for it."
            confirmLabel="Reject"
            destructive
            reason={{
              label: "Reason",
              required: true,
              maxLength: 500,
              placeholder: "Receipt missing or unreadable",
            }}
            onConfirm={(reason) =>
              reject.mutateAsync({ id: expense.id, reason: reason ?? "" }).then(() => {
                toast.success("Expense rejected");
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
            <Button size={size} variant="ghost">
              <Undo2Icon />
              Cancel
            </Button>
          }
          title="Cancel your expense?"
          description="It will be withdrawn and no longer wait for approval."
          confirmLabel="Cancel expense"
          destructive
          onConfirm={() =>
            cancel.mutateAsync(expense.id).then(() => {
              toast.success("Expense cancelled");
            })
          }
        >
          {summary}
        </ConfirmDialog>
      )}
    </div>
  );
}
