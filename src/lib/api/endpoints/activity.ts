import { api } from "@/lib/api/client";
import type { ActivityItem, PaginationParams } from "@/types/api";

export interface ActivityParams extends PaginationParams {
  dateFrom?: string;
  dateTo?: string;
}

/**
 * GET /rooms/:roomId/activity — room timeline sourced from audit logs (newest first).
 * Its meta shape differs ({ total, … }); the client normalizes it to PageMeta.
 */
export function getRoomActivity(roomId: string, params: ActivityParams = {}, signal?: AbortSignal) {
  return api.getPage<ActivityItem>(`/rooms/${roomId}/activity`, { query: { ...params }, signal });
}
