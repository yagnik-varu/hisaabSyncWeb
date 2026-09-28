import { api } from "@/lib/api/client";
import type {
  PaginationParams,
  ReferenceType,
  TransactionType,
  TreasurySummary,
  TreasuryTransaction,
} from "@/types/api";

/** GET /rooms/:roomId/treasury — { currentBalance, totalContributions, totalReimbursements, currencyCode }. */
export function getTreasurySummary(roomId: string, signal?: AbortSignal) {
  return api.get<TreasurySummary>(`/rooms/${roomId}/treasury`, { signal });
}

export interface ListTransactionsParams extends PaginationParams {
  transactionType?: TransactionType;
  referenceType?: ReferenceType;
  /** ISO date-time (inclusive). */
  dateFrom?: string;
  /** ISO date-time (inclusive) — send end-of-day, the backend compares with `lte`. */
  dateTo?: string;
}

/** GET /rooms/:roomId/treasury/transactions — immutable ledger, newest first (paginated). */
export function listTransactions(
  roomId: string,
  params: ListTransactionsParams,
  signal?: AbortSignal,
) {
  return api.getPage<TreasuryTransaction>(`/rooms/${roomId}/treasury/transactions`, {
    query: { ...params },
    signal,
  });
}

export interface CreateAdjustmentInput {
  transactionType: TransactionType;
  /** Positive amount string, 2dp. */
  amount: string;
  /** Mandatory audit note. */
  description: string;
}

/** POST /rooms/:roomId/treasury/adjustments — ADMIN only, 10 req/min. No strict-mode check (docs/05 #13). */
export function createAdjustment(roomId: string, input: CreateAdjustmentInput) {
  return api.post<TreasuryTransaction>(`/rooms/${roomId}/treasury/adjustments`, input);
}
