"use client";

import { CheckIcon, ChevronsUpDownIcon, LayoutGridIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useRoomSwitcherList } from "@/hooks/use-rooms";

/** Header dropdown to jump between active rooms. Hidden until the user has at least one room. */
export function RoomSwitcher() {
  const params = useParams<{ roomId?: string }>();
  const { status } = useAuth();
  // Lives in the header (outside AuthGate), so wait for the session before querying.
  const rooms = useRoomSwitcherList(status === "authenticated");
  const list = rooms.data?.data ?? [];
  const current = list.find((r) => r.id === params.roomId);

  if (list.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="max-w-[45vw] gap-1 sm:max-w-xs">
          <span className="truncate">{current?.name ?? "Switch room"}</span>
          <ChevronsUpDownIcon className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-muted-foreground text-xs">Your rooms</DropdownMenuLabel>
        {list.map((room) => (
          <DropdownMenuItem key={room.id} asChild>
            <Link href={`/rooms/${room.id}`}>
              <span className="flex-1 truncate">{room.name}</span>
              {room.id === params.roomId && <CheckIcon />}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/rooms">
            <LayoutGridIcon />
            All rooms
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
