import { api } from "@/lib/api/client";
import type { ExpenseCategory } from "@/types/api";

/** GET /rooms/:roomId/categories — defaults first, then A–Z. Any active member. */
export function listCategories(roomId: string, signal?: AbortSignal) {
  return api.get<ExpenseCategory[]>(`/rooms/${roomId}/categories`, { signal });
}

/** POST — ADMIN/ACCOUNTANT. 409 CATEGORY_NAME_DUPLICATE (exact, case-sensitive match). */
export function createCategory(roomId: string, name: string) {
  return api.post<ExpenseCategory>(`/rooms/${roomId}/categories`, { name });
}

/** DELETE — ADMIN. 409 CATEGORY_IN_USE when any expense (any status) references it. */
export function deleteCategory(roomId: string, categoryId: string) {
  return api.delete<Record<string, never>>(`/rooms/${roomId}/categories/${categoryId}`);
}
