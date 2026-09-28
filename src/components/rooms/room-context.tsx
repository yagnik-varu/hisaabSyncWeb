"use client";

import { createContext, useContext } from "react";

import { can, type Permission } from "@/lib/permissions";
import type { Role, RoomDetails } from "@/types/api";

export interface RoomContextValue {
  roomId: string;
  room: RoomDetails;
  myRole: Role;
  currencyCode: string;
  /** Read-only mode: hide/disable every mutation (backend answers ROOM_ALREADY_ARCHIVED anyway). */
  isArchived: boolean;
  can: (permission: Permission) => boolean;
}

const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({
  room,
  isArchived,
  children,
}: {
  room: RoomDetails;
  isArchived: boolean;
  children: React.ReactNode;
}) {
  const value: RoomContextValue = {
    roomId: room.id,
    room,
    myRole: room.myRole,
    currencyCode: room.settings.currencyCode || "INR",
    isArchived,
    can: (permission) => can(room.myRole, permission),
  };
  return <RoomContext value={value}>{children}</RoomContext>;
}

/** Current room for any component under /rooms/[roomId]. */
export function useCurrentRoom(): RoomContextValue {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useCurrentRoom must be used inside /rooms/[roomId]");
  return ctx;
}
