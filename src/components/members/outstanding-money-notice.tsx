"use client";

import { TriangleAlertIcon } from "lucide-react";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { Money } from "@/components/shared/money";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { useContributions } from "@/hooks/use-contributions";
import { useExpenses } from "@/hooks/use-expenses";
import { useReimbursements } from "@/hooks/use-reimbursements";
import { addMoney } from "@/lib/money";

/**
 * Shown in "remove member" / "approve leave" / "leave room" confirmations. The backend lets people
 * leave with money still in flight (docs/05 #23), so we at least make it visible first.
 * Rendered only while the dialog is open, so these queries run on demand.
 */
export function OutstandingMoneyNotice({ userId, isSelf }: { userId: string; isSelf?: boolean }) {
  const { roomId, currencyCode, can } = useCurrentRoom();
  const approver = can("reimbursements.pay");

  const owed = useReimbursements(roomId, {
    status: "PENDING_PAYMENT",
    beneficiaryId: userId,
    page: 1,
    limit: 100,
  });
  const pendingContributions = useContributions(roomId, {
    status: "PENDING",
    contributorId: userId,
    page: 1,
    limit: 1,
  });
  const pendingExpenses = useExpenses(roomId, {
    status: "PENDING",
    submittedBy: userId,
    page: 1,
    limit: 1,
  });

  if (owed.isPending || pendingContributions.isPending || pendingExpenses.isPending) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Spinner /> Checking for unsettled money…
      </p>
    );
  }

  const owedTotal = addMoney(...(owed.data?.data.map((r) => r.amount) ?? []));
  const owedCount = owed.data?.meta.totalItems ?? 0;
  const contributionCount = pendingContributions.data?.meta.totalItems ?? 0;
  const expenseCount = pendingExpenses.data?.meta.totalItems ?? 0;
  if (owedCount + contributionCount + expenseCount === 0) return null;

  const subject = isSelf ? "You" : "This member";
  return (
    <Alert>
      <TriangleAlertIcon />
      <AlertDescription>
        <ul className="list-disc space-y-1 pl-4">
          {owedCount > 0 && (
            <li>
              {subject} {isSelf ? "are" : "is"} still owed{" "}
              <Money value={owedTotal} currency={currencyCode} className="font-medium" /> in{" "}
              {owedCount} unpaid reimbursement{owedCount === 1 ? "" : "s"}.
            </li>
          )}
          {contributionCount > 0 && (
            <li>
              {contributionCount} pending contribution{contributionCount === 1 ? "" : "s"}.
            </li>
          )}
          {expenseCount > 0 && (
            <li>
              {expenseCount} pending expense{expenseCount === 1 ? "" : "s"}.
            </li>
          )}
        </ul>
        <p className="mt-1">
          {approver
            ? "Consider settling these first. They stay on the books either way."
            : "Consider asking an admin to settle these first."}
        </p>
      </AlertDescription>
    </Alert>
  );
}
