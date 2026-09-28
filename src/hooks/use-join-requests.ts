"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveJoinRequest,
  listJoinRequests,
  rejectJoinRequest,
} from "@/lib/api/endpoints/members";
import { queryKeys } from "@/lib/query-keys";

export function useJoinRequests(roomId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.roomJoinRequests(roomId),
    queryFn: ({ signal }) => listJoinRequests(roomId, signal),
    enabled,
  });
}

export function useJoinRequestMutations(roomId: string) {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.roomJoinRequests(roomId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.roomMembers(roomId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.roomDetails(roomId) });
  };

  const approve = useMutation({
    mutationFn: (requestId: string) => approveJoinRequest(roomId, requestId),
    onSuccess: refresh,
    onError: refresh,
  });
  const reject = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) =>
      rejectJoinRequest(roomId, requestId, reason),
    onSuccess: refresh,
    onError: refresh,
  });
  return { approve, reject };
}
