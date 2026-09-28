/**
 * Room-level permission checks for the UI (mirrors docs/02 §3 and backend @Roles decorators).
 *
 * The backend is still the authority — these only decide what to SHOW. Always handle
 * a 403 gracefully even when the button was visible.
 */

import type { Role } from "@/types/api";

const ALL: readonly Role[] = ["ADMIN", "ACCOUNTANT", "MEMBER"];
const APPROVERS: readonly Role[] = ["ADMIN", "ACCOUNTANT"];
const ADMIN_ONLY: readonly Role[] = ["ADMIN"];

export const PERMISSIONS = {
  // Room
  "room.view": ALL,
  "room.update": ADMIN_ONLY,
  "room.archive": ADMIN_ONLY,
  "room.leave": ALL,

  // Members
  "members.view": ALL,
  "members.changeRole": ADMIN_ONLY,
  "members.remove": ADMIN_ONLY,
  "joinRequests.view": APPROVERS,
  "joinRequests.review": ADMIN_ONLY,
  "leaveRequests.review": ADMIN_ONLY,

  // Categories
  "categories.view": ALL,
  "categories.create": APPROVERS,
  "categories.delete": ADMIN_ONLY,

  // Contributions
  "contributions.submit": ALL,
  "contributions.review": APPROVERS,

  // Expenses
  "expenses.submit": ALL,
  "expenses.review": APPROVERS,

  // Reimbursements
  "reimbursements.pay": APPROVERS,

  // Treasury
  "treasury.view": ALL,
  "treasury.adjust": ADMIN_ONLY,

  // Activity & audit
  "activity.view": ALL,
  "audit.view": ADMIN_ONLY,
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

/** can("ACCOUNTANT", "expenses.review") → true */
export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

/**
 * "Cancel own pending X" is not role-based — it depends on ownership + status.
 * Kept here so all "can the user do this?" logic lives in one file.
 */
export function canCancelOwn(
  currentUserId: string | null | undefined,
  ownerId: string,
  status: string,
): boolean {
  return !!currentUserId && currentUserId === ownerId && status === "PENDING";
}
