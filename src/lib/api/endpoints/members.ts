import { api } from "@/lib/api/client";
import type { JoinRequest, JoinRequestWithUser, RoomMemberItem } from "@/types/api";

/** GET /rooms/:roomId/members — ALL statuses (ACTIVE, LEAVE_REQUESTED, LEFT…), oldest first. */
export function listMembers(roomId: string, signal?: AbortSignal) {
  return api.get<RoomMemberItem[]>(`/rooms/${roomId}/members`, { signal });
}

/** GET /rooms/:roomId/join-requests — ADMIN/ACCOUNTANT. All statuses, newest first, not paginated. */
export function listJoinRequests(roomId: string, signal?: AbortSignal) {
  return api.get<JoinRequestWithUser[]>(`/rooms/${roomId}/join-requests`, { signal });
}

/**
 * PATCH approve — ADMIN. Creates a MEMBER. Fails with 409 RESOURCE_ALREADY_EXISTS when the user
 * already has a membership row (current or former member — docs/05 #18).
 */
export function approveJoinRequest(roomId: string, requestId: string) {
  return api.patch<JoinRequest>(`/rooms/${roomId}/join-requests/${requestId}/approve`);
}

/** PATCH reject — ADMIN. Reason optional. */
export function rejectJoinRequest(roomId: string, requestId: string, rejectionReason?: string) {
  return api.patch<JoinRequest>(
    `/rooms/${roomId}/join-requests/${requestId}/reject`,
    rejectionReason ? { rejectionReason } : {},
  );
}
