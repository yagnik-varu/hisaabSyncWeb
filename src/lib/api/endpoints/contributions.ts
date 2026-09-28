import { api } from "@/lib/api/client";
import type { Contribution, ContributionStatus, PaginationParams } from "@/types/api";

export interface ListContributionsParams extends PaginationParams {
  status?: ContributionStatus;
  contributorId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/** GET /rooms/:roomId/contributions — newest first, includes `contributor { id, fullName, email }`. */
export function listContributions(
  roomId: string,
  params: ListContributionsParams,
  signal?: AbortSignal,
) {
  return api.getPage<Contribution>(`/rooms/${roomId}/contributions`, {
    query: { ...params },
    signal,
  });
}

/** POST /rooms/:roomId/contributions — any active member; starts as PENDING. */
export function submitContribution(roomId: string, input: { amount: string; note?: string }) {
  return api.post<Contribution>(`/rooms/${roomId}/contributions`, input);
}

/** DELETE — own + PENDING only (CONTRIBUTION_ACCESS_DENIED / CONTRIBUTION_CANNOT_CANCEL). */
export function cancelContribution(roomId: string, id: string) {
  return api.delete<Contribution>(`/rooms/${roomId}/contributions/${id}`);
}

/** PATCH approve — ADMIN/ACCOUNTANT, 10/min. Credits the treasury. */
export function approveContribution(roomId: string, id: string) {
  return api.patch<Contribution>(`/rooms/${roomId}/contributions/${id}/approve`);
}

/** PATCH reject — ADMIN/ACCOUNTANT, 10/min. Reason is optional for contributions. */
export function rejectContribution(roomId: string, id: string, rejectionReason?: string) {
  return api.patch<Contribution>(
    `/rooms/${roomId}/contributions/${id}/reject`,
    rejectionReason ? { rejectionReason } : {},
  );
}
