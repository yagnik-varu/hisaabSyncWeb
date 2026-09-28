"use client";

import { ArchiveIcon, HomeIcon, LogInIcon, PlusIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { CreateRoomDialog } from "@/components/rooms/create-room-dialog";
import { JoinRoomDialog } from "@/components/rooms/join-room-dialog";
import { RoomCard, RoomCardSkeleton } from "@/components/rooms/room-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FormError } from "@/components/shared/form-error";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useRoomsList } from "@/hooks/use-rooms";
import { normalizeError } from "@/lib/api/errors";
import type { RoomStatus } from "@/types/api";

const PAGE_SIZE = 12;

/**
 * "My rooms". Filters live in the URL (?status=ARCHIVED&page=2) so they survive reloads,
 * the back button and can be shared.
 */
export function RoomsView() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status: RoomStatus = searchParams.get("status") === "ARCHIVED" ? "ARCHIVED" : "ACTIVE";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const rooms = useRoomsList({ status, page, limit: PAGE_SIZE });

  function setParams(next: { status?: RoomStatus; page?: number }) {
    const params = new URLSearchParams(searchParams);
    const nextStatus = next.status ?? status;
    const nextPage = next.page ?? 1;
    if (nextStatus === "ARCHIVED") params.set("status", "ARCHIVED");
    else params.delete("status");
    if (nextPage > 1) params.set("page", String(nextPage));
    else params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  // Current page emptied (e.g. rooms archived/left)? Go back to page 1.
  const pageIsEmpty = !!rooms.data && rooms.data.data.length === 0 && !rooms.isFetching;
  useEffect(() => {
    if (pageIsEmpty && page > 1) {
      const params = new URLSearchParams(searchParams);
      params.delete("page");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  }, [pageIsEmpty, page, searchParams, pathname, router]);

  const createButton = (
    <CreateRoomDialog
      trigger={
        <Button>
          <PlusIcon />
          Create room
        </Button>
      }
    />
  );
  const joinButton = (
    <JoinRoomDialog
      trigger={
        <Button variant="outline">
          <LogInIcon />
          Join with code
        </Button>
      }
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My rooms</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back{user ? `, ${user.fullName.split(" ")[0]}` : ""}. Pick a room or start a new
            one.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          {joinButton}
          {createButton}
        </div>
      </div>

      <Tabs value={status} onValueChange={(v) => setParams({ status: v as RoomStatus })}>
        <TabsList>
          <TabsTrigger value="ACTIVE">Active</TabsTrigger>
          <TabsTrigger value="ARCHIVED">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {rooms.isError ? (
        <FormError message={normalizeError(rooms.error).message} />
      ) : rooms.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <RoomCardSkeleton key={i} />
          ))}
        </div>
      ) : rooms.data.data.length === 0 ? (
        status === "ACTIVE" ? (
          <EmptyState
            icon={HomeIcon}
            title="No rooms yet"
            description="Create a room for your flat, trip or group, or join one with a code from its admin."
            action={
              <>
                {joinButton}
                {createButton}
              </>
            }
          />
        ) : (
          <EmptyState
            icon={ArchiveIcon}
            title="No archived rooms"
            description="Rooms an admin archives become read-only and show up here."
          />
        )
      ) : (
        <>
          <div
            className="grid gap-4 transition-opacity data-[stale=true]:opacity-60 sm:grid-cols-2 lg:grid-cols-3"
            data-stale={rooms.isPlaceholderData}
          >
            {rooms.data.data.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
          <PaginationBar
            meta={rooms.data.meta}
            onPageChange={(p) => setParams({ page: p })}
            disabled={rooms.isFetching}
          />
        </>
      )}
    </div>
  );
}
