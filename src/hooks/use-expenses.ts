"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { createCategory, deleteCategory, listCategories } from "@/lib/api/endpoints/categories";
import {
  approveExpense,
  cancelExpense,
  getExpense,
  listExpenses,
  rejectExpense,
  submitExpense,
  type ListExpensesParams,
  type SubmitExpenseInput,
} from "@/lib/api/endpoints/expenses";
import { queryKeys } from "@/lib/query-keys";

// ─── Categories ─────────────────────────────────────────────────────────────

export function useCategories(roomId: string) {
  return useQuery({
    queryKey: queryKeys.roomCategories(roomId),
    queryFn: ({ signal }) => listCategories(roomId, signal),
    staleTime: 5 * 60_000,
  });
}

export function useCategoryMutations(roomId: string) {
  const queryClient = useQueryClient();
  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: queryKeys.roomCategories(roomId) });

  const create = useMutation({
    mutationFn: (name: string) => createCategory(roomId, name),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (categoryId: string) => deleteCategory(roomId, categoryId),
    onSuccess: refresh,
    onError: refresh,
  });
  return { create, remove };
}

// ─── Expenses ───────────────────────────────────────────────────────────────

export function useExpenses(roomId: string, params: ListExpensesParams) {
  return useQuery({
    queryKey: queryKeys.roomExpenses(roomId, { ...params }),
    queryFn: ({ signal }) => listExpenses(roomId, params, signal),
    placeholderData: keepPreviousData,
  });
}

/** How many times the detail page re-checks for the async reimbursement (~15 s at 1.5 s). */
const REIMBURSEMENT_MAX_POLLS = 10;

/**
 * Expense details. After approval the reimbursement is created asynchronously by the backend
 * (docs/05 #9), so while an APPROVED expense has no reimbursement yet we poll briefly.
 * `reimbursementMissing` becomes true when polling gave up (the backend listener swallows errors),
 * so the UI can stop showing a spinner and explain instead.
 */
export function useExpense(roomId: string, expenseId: string, enabled = true) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.roomExpense(roomId, expenseId);
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => getExpense(roomId, expenseId, signal),
    enabled,
    refetchInterval: (q) => {
      const data = q.state.data;
      const waiting = data?.status === "APPROVED" && !data.reimbursement;
      return waiting && q.state.dataUpdateCount < REIMBURSEMENT_MAX_POLLS ? 1500 : false;
    },
  });
  const polls = queryClient.getQueryState(queryKey)?.dataUpdateCount ?? 0;
  const reimbursementMissing =
    query.data?.status === "APPROVED" &&
    !query.data.reimbursement &&
    polls >= REIMBURSEMENT_MAX_POLLS &&
    !query.isFetching;
  return { ...query, reimbursementMissing };
}

function invalidateAfterChange(queryClient: QueryClient, roomId: string, expenseId?: string) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.roomExpenses(roomId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.roomDetails(roomId) });
  if (expenseId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.roomExpense(roomId, expenseId) });
  }
}

export function useExpenseMutations(roomId: string) {
  const queryClient = useQueryClient();

  const submit = useMutation({
    mutationFn: (input: SubmitExpenseInput) => submitExpense(roomId, input),
    onSuccess: () => invalidateAfterChange(queryClient, roomId),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelExpense(roomId, id),
    onSuccess: (_d, id) => invalidateAfterChange(queryClient, roomId, id),
  });

  const approve = useMutation({
    mutationFn: (id: string) => approveExpense(roomId, id),
    onSuccess: (_d, id) => {
      invalidateAfterChange(queryClient, roomId, id);
      void queryClient.invalidateQueries({ queryKey: ["room", roomId, "activity"] });
      // The reimbursement appears a moment later (async event) — refresh its lists twice.
      const refreshReimbursements = () =>
        void queryClient.invalidateQueries({ queryKey: queryKeys.roomReimbursements(roomId) });
      refreshReimbursements();
      setTimeout(refreshReimbursements, 1500);
    },
    onError: (_e, id) => invalidateAfterChange(queryClient, roomId, id),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectExpense(roomId, id, reason),
    onSuccess: (_d, { id }) => invalidateAfterChange(queryClient, roomId, id),
    onError: (_e, { id }) => invalidateAfterChange(queryClient, roomId, id),
  });

  return { submit, cancel, approve, reject };
}
