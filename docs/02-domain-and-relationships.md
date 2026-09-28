# HisaabSync — Domain Model, Relationships & Flows

Backend schema: `D:\yagnik-deploy\HisaabSync\prisma\schema.prisma`.

## 1. The core idea (treasury-pool model)

HisaabSync is **not** a Splitwise-style peer-to-peer debt tracker. Each **Room** has one shared
**Treasury** (a pooled wallet):

1. Members put money **into** the pool → **Contribution** (needs approval) → treasury CREDIT.
2. A member pays for something shared out of pocket → **Expense** (needs approval).
3. An approved expense automatically creates a **Reimbursement**, which the treasury owes that member.
4. An Admin or Accountant marks the reimbursement **PAID** → treasury DEBIT.
5. Every balance change is an immutable **TreasuryTransaction** (the ledger). Admins can add manual **ADJUSTMENT** entries.

Nothing financial is ever hard-deleted. Records only change status.

## 2. Entity relationship diagram

```
User ──< RoomMember >── Room ──1:1── RoomSettings
 │                        │  └─1:1── TreasuryAccount (currentBalance)
 │                        ├──< JoinRequest  (user asks to join via roomCode)
 │                        ├──< ExpenseCategory ──< Expense
 │                        ├──< Contribution
 │                        ├──< Expense ──1:1── Reimbursement
 │                        ├──< TreasuryTransaction (ledger)
 │                        ├──< Notification (per user, optional room)
 │                        └──< AuditLog (activity feed)
 └── RefreshToken (hashed, rotated)
```

| Entity | Key fields | Relations |
|---|---|---|
| **User** | id, fullName, email (unique), phone?, profileImageUrl?, provider (`local`\|`google`), isActive | memberships, contributions, expenses, reimbursements, notifications |
| **Room** | id, name, roomCode (unique, 6–8 chars A–Z0–9), description?, status `ACTIVE\|ARCHIVED`, createdBy | settings, treasuryAccount, members, … |
| **RoomSettings** | currencyCode (default INR), allowNegativeTreasury (default false), requireExpenseApproval, requireContributionApproval, autoCreateReimbursement | only `currencyCode` and `allowNegativeTreasury` have any effect today |
| **RoomMember** | (roomId, userId) unique, role `ADMIN\|ACCOUNTANT\|MEMBER`, status `ACTIVE\|PENDING_APPROVAL\|LEAVE_REQUESTED\|LEFT`, joinedAt, leftAt | a user's role is **per room** |
| **JoinRequest** | roomId, userId, status `PENDING\|APPROVED\|REJECTED`, rejectionReason, reviewedBy/At | on approval a RoomMember(MEMBER, ACTIVE) is created |
| **TreasuryAccount** | roomId (1:1), currentBalance Decimal(12,2) | |
| **TreasuryTransaction** | transactionType `CREDIT\|DEBIT`, referenceType `CONTRIBUTION\|REIMBURSEMENT\|ADJUSTMENT`, referenceId?, amount, description, createdBy (actor) | immutable ledger |
| **Contribution** | contributorId, amount, note?, status `PENDING\|APPROVED\|REJECTED\|CANCELLED`, rejectionReason, approvedBy/At | |
| **ExpenseCategory** | roomId, name (unique per room), isDefault | defaults: Rent, Groceries, Electricity, Maintenance |
| **Expense** | submittedBy, categoryId, amount, title, description?, receiptUrl?, status `PENDING\|APPROVED\|REJECTED\|CANCELLED`, rejectionReason, reviewedBy/At | 0..1 Reimbursement |
| **Reimbursement** | expenseId (unique), beneficiaryId, amount, status `PENDING_PAYMENT\|PAID\|REJECTED`(unused), paidBy/At | |
| **Notification** | userId, roomId?, title, message, isRead | |
| **AuditLog** | roomId?, actorId, entityType, entityId, action, metadata JSON | source of the activity feed |

## 3. Roles (per room) — what the UI should show/hide

| Capability | ADMIN | ACCOUNTANT | MEMBER |
|---|:-:|:-:|:-:|
| View room, members, treasury, ledger, contributions, expenses, reimbursements, activity, categories | ✅ | ✅ | ✅ |
| Submit contribution / expense; cancel **own** PENDING ones | ✅ | ✅ | ✅ |
| Request to leave | ✅* | ✅ | ✅ |
| Approve/reject contributions & expenses; mark reimbursements paid | ✅ | ✅ | ❌ |
| Create category | ✅ | ✅ | ❌ |
| View join requests | ✅ | ✅ | ❌ |
| Approve/reject join requests & leave requests | ✅ | ❌ | ❌ |
| Change roles, remove members, delete category, manual adjustment, edit room settings, archive, audit logs | ✅ | ❌ | ❌ |

\* The last active ADMIN cannot leave, be demoted, or be removed.
Admins cannot change their own role or remove themselves through the member endpoints.

**Source of the current user's role:** `myRole` from `GET /rooms/:roomId` (or `GET /rooms` list).

## 4. State machines

```
Contribution:  PENDING ──approve──▶ APPROVED  (treasury +amount, ledger CREDIT/CONTRIBUTION)
                  ├────reject────▶ REJECTED
                  └─cancel(owner)▶ CANCELLED

Expense:       PENDING ──approve──▶ APPROVED ──(async event)──▶ Reimbursement PENDING_PAYMENT
                  ├────reject────▶ REJECTED (reason required)
                  └─cancel(owner)▶ CANCELLED

Reimbursement: PENDING_PAYMENT ──pay──▶ PAID  (treasury −amount, ledger DEBIT/REIMBURSEMENT)
               strict mode (allowNegativeTreasury=false): pay fails if balance < amount

JoinRequest:   PENDING ──approve──▶ APPROVED (+ RoomMember ACTIVE, role MEMBER)
                  └────reject────▶ REJECTED

RoomMember:    ACTIVE ──leave-request──▶ LEAVE_REQUESTED ──approve──▶ LEFT
                                                   └──reject──▶ ACTIVE
               ACTIVE ──admin remove──▶ LEFT

Room:          ACTIVE ──(archive, currently broken)──▶ ARCHIVED → all mutations 400 ROOM_ALREADY_ARCHIVED
```

## 5. End-to-end user journeys (drive the screen design)

1. **Onboard:** register or log in (email/password or Google) → land on "My Rooms".
2. **Create a room:** name, description, currency, strict/flexible treasury → becomes ADMIN → share the `roomCode`.
3. **Join a room:** enter `roomCode` → JoinRequest PENDING → admin approves → the room appears in "My Rooms".
   (The requester cannot see their pending request status. There is no endpoint for that.)
4. **Fund the pool:** member submits a contribution → admin or accountant approves → balance goes up.
5. **Log an expense:** member submits an expense (category, amount, title, receipt URL) → approver approves → reimbursement created.
6. **Pay back:** approver opens pending reimbursements → marks paid → balance goes down (or is blocked in strict mode).
7. **Transparency:** everyone sees the treasury summary, ledger, activity feed, and their notifications.
8. **Membership admin:** change roles, remove members, handle leave requests, and edit settings.
