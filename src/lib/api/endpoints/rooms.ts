import { api } from "@/lib/api/client";
import type {
  CreatedRoom,
  JoinRequest,
  PaginationParams,
  RoomDetails,
  RoomListItem,
  RoomStatus,
  UpdatedRoom,
} from "@/types/api";

export interface ListRoomsParams extends PaginationParams {
  status?: RoomStatus;
}

/** GET /rooms — rooms where the current user is an ACTIVE member (paginated). */
export function listRooms(params: ListRoomsParams = {}, signal?: AbortSignal) {
  return api.getPage<RoomListItem>("/rooms", {
    query: { status: params.status, page: params.page, limit: params.limit },
    signal,
  });
}

/** GET /rooms/:roomId — 403 ROOM_ACCESS_DENIED / ROOM_MEMBER_NOT_ACTIVE if not an active member. */
export function getRoom(roomId: string, signal?: AbortSignal) {
  return api.get<RoomDetails>(`/rooms/${roomId}`, { signal });
}

export interface CreateRoomInput {
  name: string;
  description?: string;
  currencyCode?: string;
  allowNegativeTreasury?: boolean;
}

/** POST /rooms — caller becomes ADMIN; treasury + default categories are created async. */
export function createRoom(input: CreateRoomInput) {
  return api.post<CreatedRoom>("/rooms", input);
}

export interface UpdateRoomInput {
  name?: string;
  description?: string;
  allowNegativeTreasury?: boolean;
  status?: RoomStatus;
}

/** PATCH /rooms/:roomId — ADMIN only. */
export function updateRoom(roomId: string, input: UpdateRoomInput) {
  return api.patch<UpdatedRoom>(`/rooms/${roomId}`, input);
}

/** POST /rooms/join — creates (or returns the existing) PENDING join request. 404 ROOM_NOT_FOUND. */
export function joinRoom(roomCode: string) {
  return api.post<JoinRequest>("/rooms/join", { roomCode });
}
