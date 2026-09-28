import { api } from "@/lib/api/client";
import type { Notification, PaginationParams } from "@/types/api";

export interface ListNotificationsParams extends PaginationParams {
  isRead?: boolean;
}

/**
 * GET /notifications — newest first.
 * ⚠️ Backend #1: currently returns EVERY user's notifications. Callers must filter by userId
 * (see hooks/use-notifications.ts) until the backend is fixed.
 */
export function listNotifications(params: ListNotificationsParams = {}, signal?: AbortSignal) {
  return api.getPage<Notification>("/notifications", { query: { ...params }, signal });
}

/** PATCH /notifications/:id/read — only ever call with the current user's own ids. */
export function markNotificationRead(id: string) {
  return api.patch<Record<string, never>>(`/notifications/${id}/read`);
}

/**
 * PATCH /notifications/read-all.
 * ⚠️ Backend #1: currently marks ALL users' notifications as read. Never call while the leak is
 * detected (the hook guards this).
 */
export function markAllNotificationsRead() {
  return api.patch<Record<string, never>>("/notifications/read-all");
}
