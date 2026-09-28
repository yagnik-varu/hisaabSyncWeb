"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getRoomActivity, type ActivityParams } from "@/lib/api/endpoints/activity";
import { listMembers } from "@/lib/api/endpoints/members";
import {
  createAdjustment,
  getTreasurySummary,
  listTransactions,
  type CreateAdjustmentInput,
  type ListTransactionsParams,
} from "@/lib/api/endpoints/treasury";
import { queryKeys } from "@/lib/query-keys";

export function useTreasurySummary(roomId: string) {
  return useQuery({
    queryKey: queryKeys.roomTreasury(roomId),
    queryFn: ({ signal }) => getTreasurySummary(roomId, signal),
  });
}

export function useTransactions(roomId: string, params: ListTransactionsParams) {
  return useQuery({
    queryKey: queryKeys.roomTransactions(roomId, { ...params }),
    queryFn: ({ signal }) => listTransactions(roomId, params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useRoomActivity(roomId: string, params: ActivityParams) {
  return useQuery({
    queryKey: queryKeys.roomActivity(roomId, { ...params }),
    queryFn: ({ signal }) => getRoomActivity(roomId, params, signal),
    placeholderData: keepPreviousData,
  });
}

/** Members change rarely — cache them longer; used to turn user ids into names. */
export function useRoomMembers(roomId: string) {
  return useQuery({
    queryKey: queryKeys.roomMembers(roomId),
    queryFn: ({ signal }) => listMembers(roomId, signal),
    staleTime: 5 * 60_000,
  });
}

export function useCreateAdjustment(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdjustmentInput) => createAdjustment(roomId, input),
    onSuccess: () => {
      // Balance shows up in: room details, treasury summary, the ledger, and the activity feed.
      void queryClient.invalidateQueries({ queryKey: queryKeys.roomDetails(roomId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.roomTreasury(roomId) });
      void queryClient.invalidateQueries({ queryKey: ["room", roomId, "activity"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rooms() });
    },
  });
}
