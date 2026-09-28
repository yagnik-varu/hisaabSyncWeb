"use client";

import { BellOffIcon, CheckCheckIcon, ShieldAlertIcon } from "lucide-react";

import { NotificationItem } from "@/components/notifications/notification-item";
import { EmptyState } from "@/components/shared/empty-state";
import { FormError } from "@/components/shared/form-error";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useNotificationMutations,
  useNotifications,
  useUnreadNotifications,
} from "@/hooks/use-notifications";
import { useResetEmptyPage, useUrlFilters } from "@/hooks/use-url-filters";
import { normalizeError } from "@/lib/api/errors";

const PAGE_SIZE = 30;

export function NotificationsView() {
  const { searchParams, update, setPage, page } = useUrlFilters();
  const onlyUnread = searchParams.get("filter") === "unread";

  const list = useNotifications({
    isRead: onlyUnread ? false : undefined,
    page,
    limit: PAGE_SIZE,
  });
  const {
    unread,
    unreadCount,
    bulkReadAllSafe,
    leakDetected: unreadLeak,
  } = useUnreadNotifications();
  const { markAllRead } = useNotificationMutations();
  const leakDetected = list.leakDetected || unreadLeak;
  useResetEmptyPage(!!list.data && list.own.length === 0 && !list.isFetching, page, setPage);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3 sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground hidden text-sm sm:block">
            Updates about your rooms: approvals, payouts and join requests.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={unreadCount === 0 || markAllRead.isPending}
          onClick={() =>
            markAllRead.mutate({ ownUnreadIds: unread.map((n) => n.id), bulkSafe: bulkReadAllSafe })
          }
        >
          <CheckCheckIcon />
          <span className="sm:hidden">Read all</span>
          <span className="hidden sm:inline">Mark all read</span>
        </Button>
      </div>

      {leakDetected && (
        <Alert>
          <ShieldAlertIcon />
          <AlertDescription>
            The server is currently sending notifications that belong to other people (known backend
            bug #1). Only yours are shown here, and page counts may be off until it&apos;s fixed.
          </AlertDescription>
        </Alert>
      )}

      <Tabs
        value={onlyUnread ? "unread" : "all"}
        onValueChange={(v) => update({ filter: v === "unread" ? "unread" : undefined })}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread{unreadCount > 0 ? ` (${unreadCount > 99 ? "99+" : unreadCount})` : ""}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {list.isError ? (
        <FormError message={normalizeError(list.error).message} />
      ) : list.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : list.own.length === 0 ? (
        <EmptyState
          icon={BellOffIcon}
          title={onlyUnread ? "No unread notifications" : "No notifications yet"}
          description="You'll be notified when your contributions or expenses are reviewed, reimbursements are paid, and more."
        />
      ) : (
        <div
          className="space-y-3 transition-opacity data-[stale=true]:opacity-60"
          data-stale={list.isPlaceholderData}
        >
          <div className="divide-y rounded-xl border p-1">
            {list.own.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </div>
          {list.data && (
            <PaginationBar
              meta={list.data.meta}
              onPageChange={setPage}
              disabled={list.isFetching}
            />
          )}
        </div>
      )}
    </div>
  );
}
