/**
 * TypeScript types for the HisaabSync NestJS API.
 * Source: docs/01-backend-api-reference.md (verified against backend code).
 *
 * Conventions:
 * - Money (Prisma Decimal) arrives as a string → typed as `Money`.
 * - Dates arrive as ISO strings → typed as `IsoDate`.
 */

export type Money = string;
export type IsoDate = string;
export type Uuid = string;

// ─── Envelopes ──────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

/** Normalized pagination meta (activity/audit endpoints use a different shape; the client normalizes it). */
export interface PageMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details: unknown[];
  };
  timestamp?: IsoDate;
  path?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ─── Enums ──────────────────────────────────────────────────────────────────

export type RoomStatus = "ACTIVE" | "ARCHIVED";
export type Role = "ADMIN" | "ACCOUNTANT" | "MEMBER";
export type MemberStatus = "ACTIVE" | "PENDING_APPROVAL" | "LEAVE_REQUESTED" | "LEFT";
export type JoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type TransactionType = "CREDIT" | "DEBIT";
export type ReferenceType = "CONTRIBUTION" | "REIMBURSEMENT" | "ADJUSTMENT";
export type ContributionStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type ReimbursementStatus = "PENDING_PAYMENT" | "PAID" | "REJECTED";

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: Uuid;
  fullName: string;
  email: string;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: Uuid;
  fullName: string;
  email: string;
  phone: string | null;
  profileImageUrl: string | null;
  isActive: boolean;
  createdAt: IsoDate;
}

// ─── Rooms & members ────────────────────────────────────────────────────────

export interface RoomSettingsSummary {
  currencyCode: string;
  allowNegativeTreasury: boolean;
}

/** Item of GET /rooms. */
export interface RoomListItem {
  id: Uuid;
  name: string;
  roomCode: string;
  status: RoomStatus;
  myRole: Role;
  memberCount: number;
  /** Always "0.00" until backend issue #3 is fixed. */
  treasuryBalance: Money;
  /** Added by the backend #3 fix. When absent, the UI hides the (wrong) balance. */
  currencyCode?: string;
}

/** GET /rooms/:roomId */
export interface RoomDetails {
  id: Uuid;
  name: string;
  roomCode: string;
  myRole: Role;
  memberCount: number;
  treasuryBalance: Money;
  pendingExpensesCount: number;
  pendingContributionsCount: number;
  settings: RoomSettingsSummary;
  // Only present once backend issue #4 is fixed — always handle `undefined`.
  status?: RoomStatus;
  description?: string | null;
  createdAt?: IsoDate;
}

/** POST /rooms response. */
export interface CreatedRoom {
  id: Uuid;
  name: string;
  roomCode: string;
  description: string | null;
  status: RoomStatus;
  createdBy: Uuid;
  createdAt: IsoDate;
  myRole: Role;
  settings: RoomSettingsSummary;
}

/** PATCH /rooms/:roomId response. */
export interface UpdatedRoom {
  id: Uuid;
  name: string;
  description: string | null;
  status: RoomStatus;
  settings: RoomSettingsSummary;
}

/** Item of GET /rooms/:roomId/members (all statuses included). */
export interface RoomMemberItem {
  userId: Uuid;
  fullName: string;
  role: Role;
  status: MemberStatus;
  joinedAt: IsoDate;
}

/** Raw RoomMember row returned by role/remove/leave endpoints. */
export interface RoomMemberRecord {
  id: Uuid;
  roomId: Uuid;
  userId: Uuid;
  role: Role;
  status: MemberStatus;
  joinedAt: IsoDate;
  leftAt: IsoDate | null;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

export interface JoinRequest {
  id: Uuid;
  roomId: Uuid;
  userId: Uuid;
  status: JoinRequestStatus;
  rejectionReason: string | null;
  reviewedBy: Uuid | null;
  reviewedAt: IsoDate | null;
  createdAt: IsoDate;
}

export interface JoinRequestWithUser extends JoinRequest {
  user: { fullName: string; email: string };
}

// ─── Categories ─────────────────────────────────────────────────────────────

export interface ExpenseCategory {
  id: Uuid;
  roomId: Uuid;
  name: string;
  isDefault: boolean;
  createdAt: IsoDate;
}

// ─── Treasury & contributions ───────────────────────────────────────────────

export interface UserRef {
  id: Uuid;
  fullName: string;
}

export interface UserRefWithEmail extends UserRef {
  email: string;
}

export interface TreasurySummary {
  currentBalance: Money;
  totalContributions: Money;
  totalReimbursements: Money;
  currencyCode: string;
}

export interface TreasuryTransaction {
  id: Uuid;
  roomId: Uuid;
  transactionType: TransactionType;
  referenceType: ReferenceType;
  referenceId: Uuid | null;
  amount: Money;
  description: string;
  createdBy: Uuid;
  createdAt: IsoDate;
  actor?: UserRefWithEmail;
}

export interface Contribution {
  id: Uuid;
  roomId: Uuid;
  contributorId: Uuid;
  amount: Money;
  note: string | null;
  status: ContributionStatus;
  rejectionReason: string | null;
  approvedBy: Uuid | null;
  approvedAt: IsoDate | null;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  contributor?: UserRefWithEmail;
}

// ─── Expenses & reimbursements ──────────────────────────────────────────────

export interface Expense {
  id: Uuid;
  roomId: Uuid;
  submittedBy: Uuid;
  categoryId: Uuid;
  amount: Money;
  title: string;
  description: string | null;
  receiptUrl: string | null;
  status: ExpenseStatus;
  rejectionReason: string | null;
  reviewedBy: Uuid | null;
  reviewedAt: IsoDate | null;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  category?: ExpenseCategory;
  submitter?: UserRef & { email?: string; phone?: string | null };
}

export interface Reimbursement {
  id: Uuid;
  expenseId: Uuid;
  roomId: Uuid;
  beneficiaryId: Uuid;
  amount: Money;
  status: ReimbursementStatus;
  paidBy: Uuid | null;
  paidAt: IsoDate | null;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

/** GET /expenses/:id */
export interface ExpenseDetails extends Expense {
  reviewer: UserRef | null;
  reimbursement: Reimbursement | null;
}

export interface ReimbursementListItem extends Reimbursement {
  beneficiary: UserRef & { profileImageUrl: string | null };
  expense: {
    id: Uuid;
    title: string;
    amount: Money;
    category: { id: Uuid; name: string };
  };
}

export interface ReimbursementDetails extends ReimbursementListItem {
  payer: UserRef | null;
}

export interface ReimbursementPayResult {
  id: Uuid;
  status: ReimbursementStatus;
  paidAt: IsoDate;
  treasuryNewBalance: Money;
}

// ─── Notifications & activity ───────────────────────────────────────────────

export interface Notification {
  id: Uuid;
  userId: Uuid;
  roomId: Uuid | null;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: IsoDate;
}

export interface ActivityItem {
  id: Uuid;
  action: string;
  entityType: string;
  entityId: Uuid;
  createdAt: IsoDate;
  actor: UserRef;
  details: { amount?: Money };
}

export interface AuditLogItem extends Omit<ActivityItem, "details"> {
  metadata: Record<string, unknown>;
}

// ─── Health (raw @nestjs/terminus shape, NOT wrapped in the envelope) ──────

export interface HealthIndicator {
  status: "up" | "down";
  [key: string]: unknown;
}

export interface HealthCheckResult {
  status: "ok" | "error" | "shutting_down";
  info?: Record<string, HealthIndicator>;
  error?: Record<string, HealthIndicator>;
  details?: Record<string, HealthIndicator>;
}
