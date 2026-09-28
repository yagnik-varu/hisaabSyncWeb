"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getReimbursement,
  listReimbursements,
  payReimbursement,
  type ListReimbursementsParams,
} from "@/lib/api/endpoints/reimbursements";
import { queryKeys } from "@/lib/query-keys";

export function useReimbursements(
  roomId: string,
  params: ListReimbursementsParams,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.roomReimbursements(roomId, { ...params }),
    queryFn: ({ signal }) => listReimbursements(roomId, params, signal),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useReimbursement(roomId: string, id: string | null) {
  return useQuery({
    queryKey: queryKeys.roomReimbursement(roomId, id ?? "none"),
    queryFn: ({ signal }) => getReimbursement(roomId, id as string, signal),
    enabled: !!id,
  });
}

export function usePayReimbursement(roomId: string) {
  const queryClient = useQueryClient();
  const refreshReimbursements = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.roomReimbursements(roomId) });
    void queryClient.invalidateQueries({ queryKey: ["room", roomId, "reimbursement"] });
  };

  return useMutation({
    mutationFn: (id: string) => payReimbursement(roomId, id),
    onSuccess: () => {
      refreshReimbursements();
      // Money left the treasury: balance everywhere, ledger, activity, and expense detail cards.
      void queryClient.invalidateQueries({ queryKey: queryKeys.roomDetails(roomId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.roomTreasury(roomId) });
      void queryClient.invalidateQueries({ queryKey: ["room", roomId, "activity"] });
      void queryClient.invalidateQueries({ queryKey: ["room", roomId, "expense"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rooms() });
    },
    // ALREADY_PAID / INSUFFICIENT_BALANCE → our numbers are stale; refresh them.
    onError: () => {
      refreshReimbursements();
      void queryClient.invalidateQueries({ queryKey: queryKeys.roomTreasury(roomId) });
    },
  });
}
