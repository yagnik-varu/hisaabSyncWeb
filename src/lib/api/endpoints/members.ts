import { api } from "@/lib/api/client";
import type { RoomMemberItem } from "@/types/api";

/** GET /rooms/:roomId/members — ALL statuses (ACTIVE, LEAVE_REQUESTED, LEFT…), oldest first. */
export function listMembers(roomId: string, signal?: AbortSignal) {
  return api.get<RoomMemberItem[]>(`/rooms/${roomId}/members`, { signal });
}
