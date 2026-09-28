/**
 * Human-friendly ledger rows.
 *
 * The backend writes system descriptions with raw user ids (docs/05 #8), e.g.
 *   "Contribution from user 3e98…"   "Reimbursement paid to user 3e98…"
 * We swap known ids for member names; unknown ids become "a former member".
 */
import type { ReferenceType, RoomMemberItem, TreasuryTransaction } from "@/types/api";

const UUID_IN_TEXT = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

export const REFERENCE_LABELS: Record<ReferenceType, string> = {
  CONTRIBUTION: "Contribution",
  REIMBURSEMENT: "Reimbursement",
  ADJUSTMENT: "Manual adjustment",
};

export type MemberNames = Map<string, string>;

export function buildMemberNames(members: RoomMemberItem[] | undefined): MemberNames {
  return new Map((members ?? []).map((m) => [m.userId, m.fullName]));
}

export function describeTransaction(tx: TreasuryTransaction, names: MemberNames): string {
  if (tx.referenceType === "ADJUSTMENT") return tx.description; // admin's own audit note
  return tx.description
    .replace(/\buser\s+(?=[0-9a-f]{8}-)/i, "") // "from user <id>" → "from <id>"
    .replace(UUID_IN_TEXT, (id) => names.get(id) ?? "a former member");
}
