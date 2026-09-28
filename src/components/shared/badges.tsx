import { ArchiveIcon, CalculatorIcon, CrownIcon, UserIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Role, RoomStatus } from "@/types/api";

const ROLE_META: Record<Role, { label: string; icon: typeof UserIcon; className: string }> = {
  ADMIN: {
    label: "Admin",
    icon: CrownIcon,
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  ACCOUNTANT: {
    label: "Accountant",
    icon: CalculatorIcon,
    className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  MEMBER: {
    label: "Member",
    icon: UserIcon,
    className: "border-border bg-muted text-muted-foreground",
  },
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const meta = ROLE_META[role];
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={cn(meta.className, className)}>
      <Icon />
      {meta.label}
    </Badge>
  );
}

export function RoomStatusBadge({ status, className }: { status: RoomStatus; className?: string }) {
  if (status === "ACTIVE") return null;
  return (
    <Badge variant="secondary" className={className}>
      <ArchiveIcon />
      Archived
    </Badge>
  );
}

/**
 * Colour map for every workflow status in the app (docs/03 §4):
 * PENDING amber · APPROVED/PAID green · REJECTED red · CANCELLED/LEFT gray · PENDING_PAYMENT blue.
 */
const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  APPROVED: {
    label: "Approved",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  PAID: {
    label: "Paid",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  REJECTED: {
    label: "Rejected",
    className: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  },
  CANCELLED: { label: "Cancelled", className: "border-border bg-muted text-muted-foreground" },
  PENDING_PAYMENT: {
    label: "Awaiting payment",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  ACTIVE: {
    label: "Active",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  LEAVE_REQUESTED: {
    label: "Leave requested",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  PENDING_APPROVAL: {
    label: "Pending approval",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  LEFT: { label: "Left", className: "border-border bg-muted text-muted-foreground" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = STATUS_STYLES[status] ?? {
    label: status.replace(/_/g, " ").toLowerCase(),
    className: "",
  };
  return (
    <Badge variant="outline" className={cn(style.className, className)}>
      {style.label}
    </Badge>
  );
}
