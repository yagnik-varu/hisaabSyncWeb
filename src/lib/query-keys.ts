/**
 * TanStack Query key factory — the single source of truth for cache keys.
 *
 * Keys are hierarchical, so invalidating a prefix refreshes everything below it:
 *   invalidateQueries({ queryKey: queryKeys.room(roomId) })            → the whole room
 *   invalidateQueries({ queryKey: queryKeys.roomExpenses(roomId) })    → every expenses list (all filters)
 *
 * After a mutation, invalidate the affected list + room details (pending counts) + treasury.
 */

type Filters = Record<string, unknown> | undefined;

export const queryKeys = {
  health: () => ["health"] as const,

  me: () => ["me"] as const,

  rooms: (filters?: Filters) => (filters ? (["rooms", filters] as const) : (["rooms"] as const)),

  room: (roomId: string) => ["room", roomId] as const,
  roomDetails: (roomId: string) => ["room", roomId, "details"] as const,
  roomMembers: (roomId: string) => ["room", roomId, "members"] as const,
  roomJoinRequests: (roomId: string) => ["room", roomId, "join-requests"] as const,
  roomCategories: (roomId: string) => ["room", roomId, "categories"] as const,

  roomTreasury: (roomId: string) => ["room", roomId, "treasury"] as const,
  roomTransactions: (roomId: string, filters?: Filters) =>
    ["room", roomId, "treasury", "transactions", filters ?? {}] as const,

  roomContributions: (roomId: string, filters?: Filters) =>
    filters
      ? (["room", roomId, "contributions", filters] as const)
      : (["room", roomId, "contributions"] as const),

  roomExpenses: (roomId: string, filters?: Filters) =>
    filters
      ? (["room", roomId, "expenses", filters] as const)
      : (["room", roomId, "expenses"] as const),
  roomExpense: (roomId: string, expenseId: string) =>
    ["room", roomId, "expense", expenseId] as const,

  roomReimbursements: (roomId: string, filters?: Filters) =>
    filters
      ? (["room", roomId, "reimbursements", filters] as const)
      : (["room", roomId, "reimbursements"] as const),
  roomReimbursement: (roomId: string, reimbursementId: string) =>
    ["room", roomId, "reimbursement", reimbursementId] as const,

  roomActivity: (roomId: string, filters?: Filters) =>
    ["room", roomId, "activity", filters ?? {}] as const,
  roomAuditLogs: (roomId: string, filters?: Filters) =>
    ["room", roomId, "audit-logs", filters ?? {}] as const,

  notifications: (filters?: Filters) =>
    filters ? (["notifications", filters] as const) : (["notifications"] as const),
} as const;
