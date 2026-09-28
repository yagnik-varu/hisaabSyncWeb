"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  approveLeave,
  rejectLeave,
  removeMember,
  requestLeave,
  updateMemberRole,
} from "@/lib/api/endpoints/members";
import { updateRoom, type UpdateRoomInput } from "@/lib/api/endpoints/rooms";
import { queryKeys } from "@/lib/query-keys";
import type { Role } from "@/types/api";

/** Admin actions on other members. Member count shows in room details and the rooms list. */
export function useMemberMutations(roomId: string) {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.roomMembers(roomId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.roomDetails(roomId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.rooms() });
    void queryClient.invalidateQueries({ queryKey: ["room", roomId, "activity"] });
  };

  const changeRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      updateMemberRole(roomId, userId, role),
    onSuccess: refresh,
    onError: refresh,
  });
  const remove = useMutation({
    mutationFn: (userId: string) => removeMember(roomId, userId),
    onSuccess: refresh,
    onError: refresh,
  });
  const approveLeaveRequest = useMutation({
    mutationFn: (userId: string) => approveLeave(roomId, userId),
    onSuccess: refresh,
    onError: refresh,
  });
  const rejectLeaveRequest = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      rejectLeave(roomId, userId, reason),
    onSuccess: refresh,
    onError: refresh,
  });

  return { changeRole, remove, approveLeaveRequest, rejectLeaveRequest };
}

/** Current user asks to leave. Afterwards they can no longer open the room (docs/05 #11). */
export function useRequestLeave(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => requestLeave(roomId),
    onSuccess: () => {
      // The room disappears from "My rooms" (only ACTIVE memberships are listed).
      // Don't touch the room's own queries here: RoomShell is still mounted and would refetch,
      // get 403 and show a second "no access" toast. The caller navigates away instead.
      void queryClient.invalidateQueries({ queryKey: queryKeys.rooms() });
    },
  });
}

export function useUpdateRoom(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateRoomInput) => updateRoom(roomId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.roomDetails(roomId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rooms() });
    },
  });
}
