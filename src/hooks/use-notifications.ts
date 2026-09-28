"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type ListNotificationsParams,
} from "@/lib/api/endpoints/notifications";
import { queryKeys } from "@/lib/query-keys";
import type { Notification, Paginated } from "@/types/api";

/** Poll interval for the bell. No websockets on the backend (docs/01 §9). */
const POLL_MS = 45_000;

/**
 * Backend #1 defence: the API currently returns every user's notifications. We keep only the
 * current user's and report whether foreign ones were present (`leakDetected`), so the UI can
 * disable "mark all read" (which would mark everyone's as read) and explain the situation.
 */
function ownOnly(page: Paginated<Notification> | undefined, userId: string | undefined) {
  const all = page?.data ?? [];
  const own = userId ? all.filter((n) => n.userId === userId) : [];
  return { own, leakDetected: own.length !== all.length };
}

export function useNotifications(params: ListNotificationsParams) {
  const { user, status } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.notifications({ ...params }),
    queryFn: ({ signal }) => listNotifications(params, signal),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  });
  return { ...query, ...ownOnly(query.data, user?.id) };
}

/** Unread items for the bell badge + dropdown. Polls, and refetches on window focus. */
export function useUnreadNotifications() {
  const { user, status } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.notifications({ isRead: false, page: 1, limit: 100 }),
    queryFn: ({ signal }) => listNotifications({ isRead: false, page: 1, limit: 100 }, signal),
    enabled: status === "authenticated",
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });
  const { own, leakDetected } = ownOnly(query.data, user?.id);
  // Count what we can see (not meta.totalItems): it ignores other users' rows (backend #1) and
  // reflects optimistic "mark read" updates instantly. Capped at 100 → the badge shows "99+".
  const unread = own.filter((n) => !n.isRead);
  // The bulk read-all endpoint is only safe when every unread row the server returned is ours
  // AND we saw all of them (no truncation at the 100 limit).
  const bulkReadAllSafe =
    !leakDetected && (query.data?.meta.totalItems ?? Infinity) <= (query.data?.data.length ?? 0);
  return { ...query, unread, unreadCount: unread.length, leakDetected, bulkReadAllSafe };
}

export function useNotificationMutations() {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    // Optimistic: flip isRead in every cached list so the badge updates instantly.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications() });
      queryClient.setQueriesData<Paginated<Notification>>(
        { queryKey: queryKeys.notifications() },
        (old) =>
          old && { ...old, data: old.data.map((n) => (n.id === id ? { ...n, isRead: true } : n)) },
      );
    },
    onSettled: refresh,
  });

  /**
   * Mark all as read. With backend #1 the bulk endpoint marks EVERY user's notifications, so unless
   * it's proven safe we mark the user's own unread ids one by one instead.
   */
  const markAllRead = useMutation({
    mutationFn: async ({
      ownUnreadIds,
      bulkSafe,
    }: {
      ownUnreadIds: string[];
      bulkSafe: boolean;
    }) => {
      if (bulkSafe) return markAllNotificationsRead();
      await Promise.all(ownUnreadIds.map((id) => markNotificationRead(id)));
    },
    onSettled: refresh,
  });

  return { markRead, markAllRead };
}
