import { api } from "@/lib/api/client";
import type {
  PaginationParams,
  ReimbursementDetails,
  ReimbursementListItem,
  ReimbursementPayResult,
  ReimbursementStatus,
} from "@/types/api";

export interface ListReimbursementsParams extends PaginationParams {
  status?: Exclude<ReimbursementStatus, "REJECTED">;
  beneficiaryId?: string;
}

/** GET /rooms/:roomId/reimbursements — newest first, with beneficiary + expense (title, amount, category). */
export function listReimbursements(
  roomId: string,
  params: ListReimbursementsParams,
  signal?: AbortSignal,
) {
  return api.getPage<ReimbursementListItem>(`/rooms/${roomId}/reimbursements`, {
    query: { ...params },
    signal,
  });
}

/** GET /rooms/:roomId/reimbursements/:id — adds `payer { id, fullName }`. */
export function getReimbursement(roomId: string, id: string, signal?: AbortSignal) {
  return api.get<ReimbursementDetails>(`/rooms/${roomId}/reimbursements/${id}`, { signal });
}

/**
 * PATCH pay — ADMIN/ACCOUNTANT, 10/min. Debits the treasury.
 * 400 TREASURY_INSUFFICIENT_BALANCE (strict mode), 409 REIMBURSEMENT_ALREADY_PAID.
 */
export function payReimbursement(roomId: string, id: string) {
  return api.patch<ReimbursementPayResult>(`/rooms/${roomId}/reimbursements/${id}/pay`);
}
