import { UsersIcon } from "lucide-react";
import Link from "next/link";

import { RoleBadge, RoomStatusBadge } from "@/components/shared/badges";
import { Money } from "@/components/shared/money";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { RoomListItem } from "@/types/api";

export function RoomCard({ room }: { room: RoomListItem }) {
  const archived = room.status === "ARCHIVED";

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="focus-visible:ring-ring/50 rounded-xl outline-none focus-visible:ring-3"
    >
      <Card
        className={cn(
          "hover:border-foreground/20 h-full transition-colors",
          archived && "opacity-75",
        )}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 text-base">{room.name}</CardTitle>
            <RoomStatusBadge status={room.status} />
          </div>
          <CardDescription className="font-mono text-xs tracking-wider">
            {room.roomCode}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto space-y-3">
          {room.currencyCode && (
            <div>
              <p className="text-muted-foreground text-xs">Treasury balance</p>
              <Money
                value={room.treasuryBalance}
                currency={room.currencyCode}
                className="text-lg font-semibold"
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <RoleBadge role={room.myRole} />
            <span className="text-muted-foreground flex items-center gap-1 text-sm">
              <UsersIcon className="size-3.5" />
              {room.memberCount}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function RoomCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/4" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-6 w-1/2" />
        <div className="flex justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-8" />
        </div>
      </CardContent>
    </Card>
  );
}
