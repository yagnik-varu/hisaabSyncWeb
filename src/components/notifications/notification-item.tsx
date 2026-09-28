"use client";

import { formatDistanceToNow } from "date-fns";
import { CheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useNotificationMutations } from "@/hooks/use-notifications";
import { formatDateTime } from "@/lib/dates";
import { notificationMeta } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/api";

const TONE: Record<"default" | "success" | "danger", string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
};

/**
 * One notification. Clicking it marks it read and opens the related page. The "mark read" button
 * lets you clear it without navigating.
 */
export function NotificationItem({
  notification: n,
  compact,
  onNavigate,
}: {
  notification: Notification;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { markRead } = useNotificationMutations();
  const { icon: Icon, tone, href } = notificationMeta(n);

  function open() {
    if (!n.isRead) markRead.mutate(n.id);
    if (href) {
      onNavigate?.();
      router.push(href);
    }
  }

  return (
    <div
      className={cn(
        "group hover:bg-muted/50 flex gap-3 rounded-lg p-2",
        !n.isRead && "bg-primary/[0.03]",
      )}
    >
      <button
        type="button"
        onClick={open}
        className="flex min-w-0 flex-1 gap-3 text-left outline-none"
        aria-label={`${n.title}${n.isRead ? "" : " (unread)"}`}
      >
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
            TONE[tone],
          )}
        >
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className={cn("truncate text-sm", !n.isRead && "font-semibold")}>{n.title}</span>
            {!n.isRead && <span className="bg-primary size-2 shrink-0 rounded-full" aria-hidden />}
          </span>
          <span className={cn("text-muted-foreground block text-sm", compact && "line-clamp-2")}>
            {n.message}
          </span>
          <time
            dateTime={n.createdAt}
            title={formatDateTime(n.createdAt)}
            className="text-muted-foreground text-xs"
          >
            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
          </time>
        </span>
      </button>
      {!n.isRead && (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          aria-label="Mark as read"
          onClick={() => markRead.mutate(n.id)}
        >
          <CheckIcon />
        </Button>
      )}
    </div>
  );
}
