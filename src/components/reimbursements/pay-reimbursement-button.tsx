"use client";

import { BanknoteIcon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Money } from "@/components/shared/money";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { usePayReimbursement } from "@/hooks/use-reimbursements";
import { useTreasurySummary } from "@/hooks/use-treasury";
import { formatMoney, isNegative, subtractMoney } from "@/lib/money";
import type { ReimbursementListItem } from "@/types/api";

/**
 * "Mark paid": records that the treasury paid the member back → ledger DEBIT.
 * Shows the balance before/after. In strict mode (allowNegativeTreasury = false) the backend
 * rejects payouts larger than the balance, so we block that up front and explain why.
 */
export function PayReimbursementButton({
  reimbursement,
  size = "sm",
}: {
  reimbursement: ReimbursementListItem;
  size?: "sm" | "default";
}) {
  const { roomId, room, currencyCode, can, isArchived } = useCurrentRoom();
  const { user } = useAuth();
  const pay = usePayReimbursement(roomId);
  const summary = useTreasurySummary(roomId);

  if (reimbursement.status !== "PENDING_PAYMENT" || !can("reimbursements.pay") || isArchived) {
    return null;
  }

  const balance = summary.data?.currentBalance ?? room.treasuryBalance;
  const after = subtractMoney(balance, reimbursement.amount);
  const strict = !room.settings.allowNegativeTreasury;
  const blocked = strict && isNegative(after);
  const isOwn = reimbursement.beneficiaryId === user?.id;
  const who = isOwn ? "you" : reimbursement.beneficiary.fullName;
  const amount = formatMoney(reimbursement.amount, currencyCode);

  return (
    <ConfirmDialog
      trigger={
        <Button size={size} aria-label={`Mark ${amount} to ${who} as paid`}>
          <BanknoteIcon />
          Mark paid
        </Button>
      }
      title="Mark reimbursement as paid?"
      description={`Confirm you've paid ${who} ${amount} from the room's money. The treasury will be debited and this can't be undone.`}
      confirmLabel="Mark paid"
      confirmDisabled={blocked}
      onConfirm={() =>
        pay.mutateAsync(reimbursement.id).then((result) => {
          toast.success(`Paid ${amount} to ${who}`, {
            description: `New treasury balance: ${formatMoney(result.treasuryNewBalance, currencyCode)}`,
          });
        })
      }
    >
      <div className="bg-muted/50 space-y-1 rounded-lg border p-3 text-sm">
        <div className="flex justify-between gap-2">
          <span className="font-medium">{reimbursement.expense.title}</span>
          <Money value={reimbursement.amount} currency={currencyCode} className="font-medium" />
        </div>
        <div className="text-muted-foreground flex justify-between gap-2">
          <span>Treasury balance</span>
          <Money value={balance} currency={currencyCode} />
        </div>
        <div className="text-muted-foreground flex justify-between gap-2">
          <span>After payout</span>
          <Money value={after} currency={currencyCode} className="font-medium" />
        </div>
      </div>
      {blocked && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>
            Not enough money in the treasury. This room is in strict mode, so the balance can&apos;t
            go below zero. Approve more contributions first, or an admin can allow negative balances
            in settings.
          </AlertDescription>
        </Alert>
      )}
      {!blocked && isNegative(after) && (
        <Alert>
          <TriangleAlertIcon />
          <AlertDescription>The treasury will go negative after this payout.</AlertDescription>
        </Alert>
      )}
      {isOwn && (
        <Alert>
          <TriangleAlertIcon />
          <AlertDescription>
            You&apos;re paying yourself. Make sure this is expected.
          </AlertDescription>
        </Alert>
      )}
    </ConfirmDialog>
  );
}
