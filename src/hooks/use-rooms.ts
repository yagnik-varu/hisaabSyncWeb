"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createRoom,
  getRoom,
  joinRoom,
  listRooms,
  type CreateRoomInput,
  type ListRoomsParams,
} from "@/lib/api/endpoints/rooms";
import { queryKeys } from "@/lib/query-keys";

/** Paginated "My rooms". keepPreviousData avoids a skeleton flash when switching page/tab. */
export function useRoomsList(params: ListRoomsParams) {
  return useQuery({
    queryKey: queryKeys.rooms({ ...params }),
    queryFn: ({ signal }) => listRooms(params, signal),
    placeholderData: keepPreviousData,
  });
}

/** Active rooms for the header switcher (first 50 is plenty for a personal list). */
export function useRoomSwitcherList(enabled = true) {
  return useQuery({
    enabled,
    queryKey: queryKeys.rooms({ status: "ACTIVE", page: 1, limit: 50 }),
    queryFn: ({ signal }) => listRooms({ status: "ACTIVE", page: 1, limit: 50 }, signal),
    staleTime: 60_000,
  });
}

export function useRoomDetails(roomId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.roomDetails(roomId),
    queryFn: ({ signal }) => getRoom(roomId, signal),
    enabled,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRoomInput) => createRoom(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rooms() });
    },
  });
}

export function useJoinRoom() {
  return useMutation({
    mutationFn: (roomCode: string) => joinRoom(roomCode),
    // Nothing to invalidate: the room only appears in "My rooms" after an admin approves.
  });
}
