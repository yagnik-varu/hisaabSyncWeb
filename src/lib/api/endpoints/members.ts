import { api } from "@/lib/api/client";
import type {
  JoinRequest,
  JoinRequestWithUser,
  Role,
  RoomMemberItem,
  RoomMemberRecord,
} from "@/types/api";

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

// ─── Membership management ──────────────────────────────────────────────────
// Backend rules (member.service.ts#ensureSafeAdminRemoval):
// - an admin can't change their own role or remove themselves → 403 ROOM_ADMIN_CANNOT_KICK_SELF
// - the last ACTIVE admin can't be demoted/removed/leave       → 400 ROOM_LAST_ADMIN_CANNOT_LEAVE

/**
 * PATCH /rooms/:roomId/members/:userId/role — ADMIN, 10/min.
 * `role` is NOT validated server-side (an invalid value → 500), so only pass a Role.
 */
export function updateMemberRole(roomId: string, userId: string, role: Role) {
  return api.patch<RoomMemberRecord>(`/rooms/${roomId}/members/${userId}/role`, { role });
}

/** DELETE /rooms/:roomId/members/:userId — ADMIN. Soft: status → LEFT. */
export function removeMember(roomId: string, userId: string) {
  return api.delete<RoomMemberRecord>(`/rooms/${roomId}/members/${userId}`);
}

/**
 * POST /rooms/:roomId/leave-request — current user. Status → LEAVE_REQUESTED, which immediately
 * locks them out of the room until an admin decides (docs/05 #11).
 */
export function requestLeave(roomId: string) {
  return api.post<RoomMemberRecord>(`/rooms/${roomId}/leave-request`);
}

/** PATCH …/leave-requests/:userId/approve — ADMIN. NOTE: the path param is the member's USER id. */
export function approveLeave(roomId: string, userId: string) {
  return api.patch<RoomMemberRecord>(`/rooms/${roomId}/leave-requests/${userId}/approve`);
}

/** PATCH …/leave-requests/:userId/reject — ADMIN. Member goes back to ACTIVE. */
export function rejectLeave(roomId: string, userId: string, rejectionReason?: string) {
  return api.patch<RoomMemberRecord>(
    `/rooms/${roomId}/leave-requests/${userId}/reject`,
    rejectionReason ? { rejectionReason } : {},
  );
}
