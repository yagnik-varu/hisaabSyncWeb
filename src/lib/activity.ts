/**
 * Turn audit-log activity items into sentences.
 *
 * The backend currently audits only these actions (HisaabSync/src/modules/audit/events/audit.listener.ts):
 * CONTRIBUTION_APPROVED, EXPENSE_APPROVED, REIMBURSEMENT_PAID, TREASURY_ADJUSTMENT, ROLE_UPDATED.
 * Anything else falls back to a generic sentence so new backend actions never break the UI.
 */
import {
  ArrowLeftRightIcon,
  CircleDotIcon,
  HandCoinsIcon,
  ReceiptIcon,
  ScaleIcon,
  UserCogIcon,
  type LucideIcon,
} from "lucide-react";

import type { ActivityItem } from "@/types/api";

export interface ActivityDescription {
  icon: LucideIcon;
  /** Sentence after the actor's name, e.g. "approved a contribution". */
  verb: string;
  /** Section of the room to open for more detail (relative to /rooms/:roomId). */
  href?: string;
}

export function describeActivity(item: ActivityItem): ActivityDescription {
  switch (item.action) {
    case "CONTRIBUTION_APPROVED":
      return { icon: HandCoinsIcon, verb: "approved a contribution", href: "contributions" };
    case "EXPENSE_APPROVED":
      return { icon: ReceiptIcon, verb: "approved an expense", href: `expenses/${item.entityId}` };
    case "REIMBURSEMENT_PAID":
      return { icon: ArrowLeftRightIcon, verb: "paid out a reimbursement", href: "reimbursements" };
    case "TREASURY_ADJUSTMENT":
      return { icon: ScaleIcon, verb: "made a manual treasury adjustment", href: "treasury" };
    case "ROLE_UPDATED":
      return { icon: UserCogIcon, verb: "changed a member's role", href: "members" };
    default:
      return {
        icon: CircleDotIcon,
        verb: item.action.toLowerCase().replace(/_/g, " "),
      };
  }
}
