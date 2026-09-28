"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import {
  approveContribution,
  cancelContribution,
  listContributions,
  rejectContribution,
  submitContribution,
  type ListContributionsParams,
} from "@/lib/api/endpoints/contributions";
import { queryKeys } from "@/lib/query-keys";

export function useContributions(roomId: string, params: ListContributionsParams) {
  return useQuery({
    queryKey: queryKeys.roomContributions(roomId, { ...params }),
    queryFn: ({ signal }) => listContributions(roomId, params, signal),
    placeholderData: keepPreviousData,
  });
}

/**
 * Every contribution change affects: contribution lists and room details (pending count).
 * Approvals additionally move money: treasury summary + ledger, activity feed, rooms list balance.
 */
function invalidateAfterChange(queryClient: QueryClient, roomId: string, moneyMoved: boolean) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.roomContributions(roomId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.roomDetails(roomId) });
  if (moneyMoved) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.roomTreasury(roomId) });
    void queryClient.invalidateQueries({ queryKey: ["room", roomId, "activity"] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.rooms() });
  }
}

export function useContributionMutations(roomId: string) {
  const queryClient = useQueryClient();

  const submit = useMutation({
    mutationFn: (input: { amount: string; note?: string }) => submitContribution(roomId, input),
    onSuccess: () => invalidateAfterChange(queryClient, roomId, false),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelContribution(roomId, id),
    onSuccess: () => invalidateAfterChange(queryClient, roomId, false),
  });

  const approve = useMutation({
    mutationFn: (id: string) => approveContribution(roomId, id),
    onSuccess: () => invalidateAfterChange(queryClient, roomId, true),
    // "Already processed" means our list is stale → refresh it either way.
    onError: () => invalidateAfterChange(queryClient, roomId, false),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      rejectContribution(roomId, id, reason),
    onSuccess: () => invalidateAfterChange(queryClient, roomId, false),
    onError: () => invalidateAfterChange(queryClient, roomId, false),
  });

  return { submit, cancel, approve, reject };
}
