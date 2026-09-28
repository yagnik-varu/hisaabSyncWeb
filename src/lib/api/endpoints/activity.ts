import { api } from "@/lib/api/client";
import type { ActivityItem, AuditLogItem, PaginationParams } from "@/types/api";

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

export interface AuditLogParams extends ActivityParams {
  /** e.g. CONTRIBUTION, EXPENSE, REIMBURSEMENT, TREASURY_TRANSACTION, ROOM_MEMBER */
  entityType?: string;
}

/** GET /rooms/:roomId/audit-logs — ADMIN only. Same as activity but with the full `metadata`. */
export function getAuditLogs(roomId: string, params: AuditLogParams = {}, signal?: AbortSignal) {
  return api.getPage<AuditLogItem>(`/rooms/${roomId}/audit-logs`, { query: { ...params }, signal });
}
