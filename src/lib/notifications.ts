/**
 * Where a notification should take you. The backend sends only { title, message, roomId }, so we
 * route on the (stable) titles from HisaabSync/src/modules/notification/events/notification.listener.ts.
 */
import {
  ArrowLeftRightIcon,
  BellIcon,
  CircleCheckIcon,
  CircleXIcon,
  ReceiptIcon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react";

import type { Notification } from "@/types/api";

interface NotificationMeta {
  icon: LucideIcon;
  tone: "default" | "success" | "danger";
  /** Path inside the room, or null for "no useful link" (e.g. rejected join → no access). */
  path: string | null;
}

const BY_TITLE: Record<string, NotificationMeta> = {
  "New Join Request": { icon: UserPlusIcon, tone: "default", path: "members" },
  "Join Request Approved": { icon: CircleCheckIcon, tone: "success", path: "" },
  "Join Request Rejected": { icon: CircleXIcon, tone: "danger", path: null },
  "New Expense Submitted": { icon: ReceiptIcon, tone: "default", path: "approvals?tab=expenses" },
  "Expense Approved": { icon: CircleCheckIcon, tone: "success", path: "expenses" },
  "Expense Rejected": { icon: CircleXIcon, tone: "danger", path: "expenses?status=REJECTED" },
  "Contribution Approved": { icon: CircleCheckIcon, tone: "success", path: "contributions" },
  "Contribution Rejected": {
    icon: CircleXIcon,
    tone: "danger",
    path: "contributions?status=REJECTED",
  },
  "Reimbursement Paid": { icon: ArrowLeftRightIcon, tone: "success", path: "reimbursements" },
};

export function notificationMeta(n: Notification): NotificationMeta & { href: string | null } {
  const meta = BY_TITLE[n.title] ?? { icon: BellIcon, tone: "default" as const, path: "" };
  const href =
    n.roomId && meta.path !== null ? `/rooms/${n.roomId}${meta.path ? `/${meta.path}` : ""}` : null;
  return { ...meta, href };
}
