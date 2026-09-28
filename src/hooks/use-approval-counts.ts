"use client";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { useJoinRequests } from "@/hooks/use-join-requests";
import { useReimbursements } from "@/hooks/use-reimbursements";

/**
 * Everything waiting on an approver, in one place, so the nav badges and the overview agree:
 * pending contributions + pending expenses (from room details), reimbursements waiting to be paid,
 * and pending join requests. Extra queries only run for approvers.
 */
export function useApprovalCounts() {
  const { roomId, room, can } = useCurrentRoom();
  const reviewer = can("contributions.review");

  const payouts = useReimbursements(
    roomId,
    { status: "PENDING_PAYMENT", page: 1, limit: 1 },
    { enabled: reviewer },
  );
  const joins = useJoinRequests(roomId, reviewer && can("joinRequests.view"));

  const contributions = room.pendingContributionsCount;
  const expenses = room.pendingExpensesCount;
  const payoutsCount = reviewer ? (payouts.data?.meta.totalItems ?? 0) : 0;
  const joinsCount = reviewer ? (joins.data?.filter((r) => r.status === "PENDING").length ?? 0) : 0;

  return {
    reviewer,
    contributions,
    expenses,
    payouts: payoutsCount,
    joins: joinsCount,
    total: reviewer ? contributions + expenses + payoutsCount + joinsCount : 0,
  };
}
