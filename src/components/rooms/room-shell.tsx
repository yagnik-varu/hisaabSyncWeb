"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArchiveIcon, ArrowLeftIcon, SearchXIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { RoomProvider } from "@/components/rooms/room-context";
import { RoomNav } from "@/components/rooms/room-nav";
import { RoleBadge, RoomStatusBadge } from "@/components/shared/badges";
import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
import { ServerUnreachable } from "@/components/shared/full-page-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoomDetails } from "@/hooks/use-rooms";
import { normalizeError } from "@/lib/api/errors";
import { isUuid } from "@/schemas/room";
import type { Paginated, RoomListItem, RoomStatus } from "@/types/api";

const ACCESS_DENIED_CODES = new Set(["ROOM_ACCESS_DENIED", "ROOM_MEMBER_NOT_ACTIVE"]);

/**
 * Loads GET /rooms/:roomId once for every page in the room and shares it via RoomProvider.
 * Handles: invalid id, not a member (→ back to /rooms), not found, server unreachable.
 */
export function RoomShell({ roomId, children }: { roomId: string; children: React.ReactNode }) {
  const validId = isUuid(roomId);
  const room = useRoomDetails(roomId, validId);
  const router = useRouter();
  const queryClient = useQueryClient();

  const error = room.error ? normalizeError(room.error) : null;
  const accessDenied = !!error && (error.status === 403 || ACCESS_DENIED_CODES.has(error.code));

  useEffect(() => {
    if (!accessDenied) return;
    toast.error("You don't have access to that room.", {
      description: "You may have left it, or your membership is pending.",
    });
    router.replace("/rooms");
  }, [accessDenied, router]);

  if (!validId || error?.status === 404 || error?.code === "ROOM_NOT_FOUND") {
    return (
      <EmptyState
        icon={SearchXIcon}
        title="Room not found"
        description="This room doesn't exist or the link is wrong."
        action={
          <Button asChild variant="outline">
            <Link href="/rooms">
              <ArrowLeftIcon />
              Back to my rooms
            </Link>
          </Button>
        }
      />
    );
  }

  if (accessDenied) return <RoomHeaderSkeleton />;
  if (error)
    return (
      <ServerUnreachable
        message={error.message}
        onRetry={() => void room.refetch()}
        retrying={room.isFetching}
      />
    );
  if (!room.data) return <RoomHeaderSkeleton />;

  // Room status comes from the details endpoint once backend #4 is fixed; until then, fall back
  // to whatever the cached "My rooms" list says about this room.
  let status: RoomStatus | undefined = room.data.status;
  if (!status) {
    for (const [, page] of queryClient.getQueriesData<Paginated<RoomListItem>>({
      queryKey: ["rooms"],
    })) {
      const match = page?.data.find((r) => r.id === roomId);
      if (match) {
        status = match.status;
        break;
      }
    }
  }
  const isArchived = status === "ARCHIVED";
  const details = room.data;

  return (
    <RoomProvider room={details} isArchived={isArchived}>
      <div className="space-y-4">
        <div className="space-y-1">
          <Link
            href="/rooms"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeftIcon className="size-3.5" />
            My rooms
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{details.name}</h1>
            <RoleBadge role={details.myRole} />
            {status && <RoomStatusBadge status={status} />}
          </div>
          <div className="text-muted-foreground flex items-center gap-1 text-sm">
            Room code
            <span className="text-foreground font-mono font-medium tracking-wider">
              {details.roomCode}
            </span>
            <CopyButton
              value={details.roomCode}
              label="Copy room code"
              successMessage="Room code copied. Share it with people you want to invite."
              className="size-7"
            />
          </div>
          {details.description && (
            <p className="text-muted-foreground max-w-2xl text-sm">{details.description}</p>
          )}
        </div>

        {isArchived && (
          <Alert>
            <ArchiveIcon />
            <AlertDescription>This room is archived. Everything is read-only.</AlertDescription>
          </Alert>
        )}

        <RoomNav />
        <div className="pt-2">{children}</div>
      </div>
    </RoomProvider>
  );
}

function RoomHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  );
}
