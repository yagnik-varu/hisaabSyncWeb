import { api } from "@/lib/api/client";
import type { Expense, ExpenseDetails, ExpenseStatus, PaginationParams } from "@/types/api";

export interface ListExpensesParams extends PaginationParams {
  status?: ExpenseStatus;
  categoryId?: string;
  submittedBy?: string;
  dateFrom?: string;
  dateTo?: string;
}

/** GET /rooms/:roomId/expenses — newest first, includes `category` and `submitter { id, fullName }`. */
export function listExpenses(roomId: string, params: ListExpensesParams, signal?: AbortSignal) {
  return api.getPage<Expense>(`/rooms/${roomId}/expenses`, { query: { ...params }, signal });
}

/** GET /rooms/:roomId/expenses/:id — with reviewer and linked reimbursement (if any). */
export function getExpense(roomId: string, expenseId: string, signal?: AbortSignal) {
  return api.get<ExpenseDetails>(`/rooms/${roomId}/expenses/${expenseId}`, { signal });
}

export interface SubmitExpenseInput {
  categoryId: string;
  amount: string;
  title: string;
  description?: string;
  receiptUrl?: string;
}

/** POST — any active member; starts PENDING. 404 CATEGORY_NOT_FOUND. */
export function submitExpense(roomId: string, input: SubmitExpenseInput) {
  return api.post<Expense>(`/rooms/${roomId}/expenses`, input);
}

/** DELETE — own + PENDING only (EXPENSE_ACCESS_DENIED / EXPENSE_CANNOT_CANCEL). Returns `{}`, not the expense. */
export function cancelExpense(roomId: string, expenseId: string) {
  return api.delete<Record<string, never>>(`/rooms/${roomId}/expenses/${expenseId}`);
}

/** PATCH approve — ADMIN/ACCOUNTANT, 10/min. Reimbursement is created ASYNC afterwards (docs/05 #9). */
export function approveExpense(roomId: string, expenseId: string) {
  return api.patch<Expense>(`/rooms/${roomId}/expenses/${expenseId}/approve`);
}

/** PATCH reject — ADMIN/ACCOUNTANT, 10/min. Reason REQUIRED (≤ 500). */
export function rejectExpense(roomId: string, expenseId: string, rejectionReason: string) {
  return api.patch<Expense>(`/rooms/${roomId}/expenses/${expenseId}/reject`, { rejectionReason });
}
