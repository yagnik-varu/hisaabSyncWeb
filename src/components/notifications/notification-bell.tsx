"use client";

import { BellIcon, CheckCheckIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { NotificationItem } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useNotificationMutations, useUnreadNotifications } from "@/hooks/use-notifications";

const SHOWN = 6;

/** Header bell: unread badge (polled every 45 s) and the latest unread items. */
export function NotificationBell() {
  const { status } = useAuth();
  const [open, setOpen] = useState(false);
  const { unread, unreadCount, bulkReadAllSafe } = useUnreadNotifications();
  const { markAllRead } = useNotificationMutations();

  if (status !== "authenticated") return null;

  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span className="bg-destructive absolute -top-0.5 -right-0.5 min-w-4 rounded-full px-1 text-[10px] leading-4 font-semibold text-white tabular-nums">
              {badge}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-1">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="xs"
              disabled={markAllRead.isPending}
              onClick={() =>
                markAllRead.mutate({
                  ownUnreadIds: unread.map((n) => n.id),
                  bulkSafe: bulkReadAllSafe,
                })
              }
            >
              <CheckCheckIcon />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[60vh] overflow-y-auto">
          {unread.length === 0 ? (
            <p className="text-muted-foreground px-2 py-6 text-center text-sm">
              You&apos;re all caught up.
            </p>
          ) : (
            unread
              .slice(0, SHOWN)
              .map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  compact
                  onNavigate={() => setOpen(false)}
                />
              ))
          )}
        </div>
        <DropdownMenuSeparator />
        <Button asChild variant="ghost" className="w-full justify-center" size="sm">
          <Link href="/notifications" onClick={() => setOpen(false)}>
            View all notifications
          </Link>
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
