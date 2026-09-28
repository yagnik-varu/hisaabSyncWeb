# HisaabSync Backend — API Reference (for the Frontend)

> Source of truth: **the backend code** at `D:\yagnik-deploy\HisaabSync\src\modules\*`.
> Backend spec docs live in `D:\yagnik-deploy\HisaabSync\docs\` (esp. `06-api-design.md`),
> but where the spec and the code differ, this file records **what the code actually does**.
> Last verified against backend code: 2026-09-28.

Backend stack: NestJS 11 + Prisma 7 + PostgreSQL. Swagger UI: `{API_ORIGIN}/api/docs`.

---

## 1. Global conventions

| Item | Value |
|---|---|
| Base URL | `{API_ORIGIN}/api/v1` (e.g. `http://localhost:3000/api/v1`, live: `https://hissabsync.onrender.com/api/v1`) |
| Auth header | `Authorization: Bearer <accessToken>` |
| Access token TTL | 15 min (`JWT_EXPIRES_IN`) |
| Refresh token TTL | 7 days, **rotated on every refresh** (old one is deleted) |
| JWT payload | `{ sub: userId, email }` |
| Validation | `whitelist + forbidNonWhitelisted` → **sending unknown body fields = 400** |
| Global rate limit | 100 req / 60 s. Sensitive writes (approve/reject/pay/adjust/role change): **10 req / 60 s** → 429 |
| Money | Prisma `Decimal(12,2)` → serialized as **strings** (`"1450.00"`, sometimes `"1450"`). Send amounts as strings matching `^\d+(\.\d{1,2})?$` |
| Dates | ISO 8601 strings (`createdAt`, etc.). Filters `dateFrom`/`dateTo` accept ISO date strings |
| IDs | UUID v4 strings. Many routes use `ParseUUIDPipe` → non-UUID id = 400 |

### Success envelope
```json
{ "success": true, "message": "…", "data": { } }
```

### Paginated envelope (data + meta at top level, NOT nested)
```json
{
  "success": true, "message": "…",
  "data": [ ],
  "meta": { "page": 1, "limit": 20, "totalItems": 45, "totalPages": 3, "hasNextPage": true, "hasPreviousPage": false }
}
```
⚠️ Exception: `GET /rooms/:roomId/activity` and `GET /rooms/:roomId/audit-logs` return
`meta: { total, page, limit, totalPages }` (no `totalItems`/`hasNextPage`). Normalize in the client.

Query params for all paginated lists: `page` (default 1), `limit` (default 20).

### Error envelope
```json
{
  "success": false,
  "error": { "code": "TREASURY_INSUFFICIENT_BALANCE", "message": "…", "details": [] },
  "timestamp": "2026-08-08T12:00:00.000Z",
  "path": "/api/v1/rooms/…"
}
```
⚠️ **Error code quirk** — see `05-backend-known-issues.md` #5. Many services throw
`new XxxException('SOME_CODE')`, which the filter turns into
`{ code: "HTTP_EXCEPTION" | "VALIDATION_FAILED", message: "SOME_CODE" }`.
**Client rule:** if `error.code` is `HTTP_EXCEPTION`, or it is `VALIDATION_FAILED` while `details` is empty and `message` matches `/^[A-Z][A-Z0-9_]+$/`, then treat `message` as the real code.

Validation errors (`400 VALIDATION_FAILED`): `details` is an **array of strings** (class-validator messages, e.g. `"amount must be a positive number with up to 2 decimal places"`). It is **not** the `{field, constraint}` objects the spec describes. Map them to fields by taking the first word of each string.

---

## 2. Auth — `/auth`

| Method | Path | Access | Body | Returns (`data`) |
|---|---|---|---|---|
| POST | `/auth/register` | Public (throttled) | `{ fullName, email, password (min 8), phone? }` | `{ user:{id,fullName,email}, accessToken, refreshToken }` — 201 |
| POST | `/auth/login` | Public (throttled) | `{ email, password }` | same as register — 200 |
| POST | `/auth/google` | Public (throttled) | `{ idToken }` (Google Identity Services ID token) | same as register — 200 |
| POST | `/auth/refresh` | Public (throttled) | `{ refreshToken }` | `{ accessToken, refreshToken }` (rotated) |
| POST | `/auth/logout` | Bearer | `{ refreshToken }` | — |
| GET | `/auth/me` | Bearer | — | `{ id, fullName, email, phone, profileImageUrl, isActive, createdAt }` |
| PATCH | `/auth/profile` | Bearer | `{ fullName?, phone? (IsPhoneNumber, e.g. +919876543210), profileImageUrl? (URL) }` | `{ id, fullName, email, phone, profileImageUrl }` |
| PATCH | `/auth/change-password` | Bearer | `{ currentPassword, newPassword (min 8) }` | — |
| GET | `/auth/test-auth` | Bearer | — | debug endpoint, ignore |

Auth error codes (arrive in `message`, see quirk above):
`AUTH_INVALID_CREDENTIALS` (401), `AUTH_EMAIL_ALREADY_EXISTS` (**400**, spec says 409),
`AUTH_REFRESH_TOKEN_INVALID` (401), `AUTH_INVALID_TOKEN` (401), `AUTH_EXPIRED_TOKEN` (401),
`AUTH_GOOGLE_TOKEN_INVALID` (401), `AUTH_GOOGLE_EMAIL_NOT_VERIFIED` (401), `AUTH_NO_PASSWORD_SET` (400, Google-only user changing password).

Google login: the frontend uses Google Identity Services to get an ID token and POSTs it here. The backend `GOOGLE_CLIENT_ID` must equal the frontend's client ID (the `aud` check).

---

## 3. Rooms — `/rooms`

| Method | Path | Access | Body / Query | Returns (`data`) |
|---|---|---|---|---|
| POST | `/rooms` | Bearer | `{ name (≤100), description?, currencyCode? (≤10, default INR), allowNegativeTreasury? (default false) }` | `{ id, name, roomCode, description, status, createdBy, createdAt, myRole:"ADMIN", settings:{currencyCode, allowNegativeTreasury} }` — 201 |
| GET | `/rooms` | Bearer | `?status=ACTIVE\|ARCHIVED&page&limit` | **paginated** `[{ id, name, roomCode, status, myRole, memberCount, treasuryBalance }]` — only rooms where caller is ACTIVE member. ⚠️ `treasuryBalance` is always `"0.00"` (known issue #3) |
| GET | `/rooms/:roomId` | Active member | — | `{ id, name, roomCode, myRole, memberCount, treasuryBalance, pendingExpensesCount, pendingContributionsCount, settings:{allowNegativeTreasury, currencyCode} }` ⚠️ no `status`/`description` (issue #4) |
| PATCH | `/rooms/:roomId` | ADMIN, not archived | `{ name?, description?, allowNegativeTreasury?, status? }` | `{ id, name, description, status, settings }` ⚠️ `status` is ignored → archive doesn't work (issue #2) |

Creating a room triggers async side effects: a treasury account (balance 0) is created, and the default categories `Rent, Groceries, Electricity, Maintenance` are seeded. Both happen via events, so they may lag the 201 by a few ms.

## 4. Members, join & leave — `/rooms`

| Method | Path | Access | Body | Returns (`data`) |
|---|---|---|---|---|
| GET | `/rooms/:roomId/members` | Active member | — | `[{ userId, fullName, role, status, joinedAt }]`, which includes **all** statuses (ACTIVE, LEAVE_REQUESTED, LEFT…), ordered by joinedAt |
| POST | `/rooms/join` | Bearer | `{ roomCode }` | JoinRequest `{ id, roomId, userId, status:"PENDING", rejectionReason, reviewedBy, reviewedAt, createdAt }` — 201. Idempotent: returns the existing PENDING request if there is one |
| GET | `/rooms/:roomId/join-requests` | ADMIN, ACCOUNTANT | — (no filter/pagination in code) | `[JoinRequest & { user:{fullName,email} }]` newest first, **all statuses** |
| PATCH | `/rooms/:roomId/join-requests/:requestId/approve` | ADMIN | — | updated JoinRequest (a member row with role MEMBER is created) |
| PATCH | `/rooms/:roomId/join-requests/:requestId/reject` | ADMIN | `{ rejectionReason? }` | updated JoinRequest |
| PATCH | `/rooms/:roomId/members/:userId/role` | ADMIN (10/min) | `{ role: "ADMIN"\|"ACCOUNTANT"\|"MEMBER" }` | RoomMember row. Blocked on self (`ROOM_ADMIN_CANNOT_KICK_SELF`) and on the last admin (`ROOM_LAST_ADMIN_CANNOT_LEAVE`) |
| DELETE | `/rooms/:roomId/members/:userId` | ADMIN | — | RoomMember row, now `status: LEFT` (soft) |
| POST | `/rooms/:roomId/leave-request` | Active member | — | RoomMember row, now `status: LEAVE_REQUESTED`. Last admin → `ROOM_LAST_ADMIN_CANNOT_LEAVE` |
| PATCH | `/rooms/:roomId/leave-requests/:requestId/approve` | ADMIN | — | RoomMember → LEFT |
| PATCH | `/rooms/:roomId/leave-requests/:requestId/reject` | ADMIN | `{ rejectionReason? }` | RoomMember → ACTIVE |

⚠️ **Leave requests are not a separate table.** `:requestId` in the leave-request routes is really the **member's `userId`**.
To list pending leave requests, filter `GET /members` by `status === "LEAVE_REQUESTED"`.

⚠️ A member with `LEAVE_REQUESTED` status **fails `RoomMemberGuard`** (403 `ROOM_MEMBER_NOT_ACTIVE`), so they lose access to the room while the request is pending.

## 5. Categories — `/rooms/:roomId/categories`

| Method | Path | Access | Body | Returns |
|---|---|---|---|---|
| GET | `/rooms/:roomId/categories` | Active member | — | `[{ id, roomId, name, isDefault, createdAt }]` (defaults first, then A–Z) |
| POST | `/rooms/:roomId/categories` | ADMIN, ACCOUNTANT | `{ name (≤100) }` | category. `CATEGORY_NAME_DUPLICATE` 409 |
| DELETE | `/rooms/:roomId/categories/:categoryId` | ADMIN | — | `{}`. `CATEGORY_IN_USE` 409 if any expense uses it; `CATEGORY_NOT_FOUND` 404 |

## 6. Treasury & contributions

| Method | Path | Access | Body / Query | Returns (`data`) |
|---|---|---|---|---|
| GET | `/rooms/:roomId/treasury` | Active member | — | `{ currentBalance, totalContributions, totalReimbursements, currencyCode }` (strings, 2dp) |
| GET | `/rooms/:roomId/treasury/transactions` | Active member | `?transactionType=CREDIT\|DEBIT&referenceType=CONTRIBUTION\|REIMBURSEMENT\|ADJUSTMENT&dateFrom&dateTo&page&limit` | **paginated** TreasuryTransaction `& { actor:{id,fullName,email} }` |
| POST | `/rooms/:roomId/treasury/adjustments` | ADMIN (10/min) | `{ transactionType, amount (numeric string), description }` | TreasuryTransaction (ADJUSTMENT). Note: no balance check on DEBIT |
| POST | `/rooms/:roomId/contributions` | Active member | `{ amount, note? }` | Contribution (status PENDING) — 201 |
| GET | `/rooms/:roomId/contributions` | Active member | `?status&contributorId&dateFrom&dateTo&page&limit` | **paginated** Contribution `& { contributor:{id,fullName,email} }` |
| DELETE | `/rooms/:roomId/contributions/:id` | owner only, PENDING | — | Contribution → CANCELLED. Errors: `CONTRIBUTION_ACCESS_DENIED` 403, `CONTRIBUTION_CANNOT_CANCEL` 400 |
| PATCH | `/rooms/:roomId/contributions/:id/approve` | ADMIN, ACCOUNTANT (10/min) | — | Contribution → APPROVED; a treasury CREDIT is written and the balance is incremented |
| PATCH | `/rooms/:roomId/contributions/:id/reject` | ADMIN, ACCOUNTANT (10/min) | `{ rejectionReason? }` | Contribution → REJECTED. Already processed → **400** `CONTRIBUTION_ALREADY_PROCESSED` |

Note: `requireContributionApproval` in RoomSettings is **not used**. Every contribution needs approval.

## 7. Expenses — `/rooms/:roomId/expenses`

| Method | Path | Access | Body / Query | Returns (`data`) |
|---|---|---|---|---|
| POST | `/expenses` | Active member | `{ categoryId (uuid), amount, title (≤255), description?, receiptUrl? (string) }` | Expense `& { category, submitter:{id,fullName,email} }` — 201 |
| GET | `/expenses` | Active member | `?status&categoryId&submittedBy&dateFrom&dateTo&page&limit` | **paginated** Expense `& { category, submitter:{id,fullName} }` |
| GET | `/expenses/:id` | Active member | — | Expense `& { category, submitter:{id,fullName,email,phone}, reviewer:{id,fullName}\|null, reimbursement\|null }` |
| DELETE | `/expenses/:id` | owner only, PENDING | — | Expense → CANCELLED (`EXPENSE_ACCESS_DENIED` 403 / `EXPENSE_CANNOT_CANCEL` 400) |
| PATCH | `/expenses/:id/approve` | ADMIN, ACCOUNTANT (10/min) | — | Expense → APPROVED. **A reimbursement is created asynchronously** (see issue #9) |
| PATCH | `/expenses/:id/reject` | ADMIN, ACCOUNTANT (10/min) | `{ rejectionReason (required, ≤500) }` | Expense → REJECTED. Already processed → **400** `EXPENSE_ALREADY_PROCESSED` |

There is no file upload endpoint. `receiptUrl` is just a string (see issue #10).

## 8. Reimbursements — `/rooms/:roomId/reimbursements`

| Method | Path | Access | Query | Returns (`data`) |
|---|---|---|---|---|
| GET | `/reimbursements` | Active member | `?status=PENDING_PAYMENT\|PAID&beneficiaryId&page&limit` | **paginated** Reimbursement `& { beneficiary:{id,fullName,profileImageUrl}, expense:{id,title,amount,category:{id,name}} }` |
| GET | `/reimbursements/:id` | Active member | — | same `& { payer:{id,fullName}\|null }` |
| PATCH | `/reimbursements/:id/pay` | ADMIN, ACCOUNTANT (10/min) | — | `{ id, status:"PAID", paidAt, treasuryNewBalance }`. Errors: `TREASURY_INSUFFICIENT_BALANCE` 400 (when `allowNegativeTreasury=false`), `REIMBURSEMENT_ALREADY_PAID` 409 |

## 9. Notifications — `/notifications`  ⚠️ broken, see issue #1

| Method | Path | Access | Query | Returns |
|---|---|---|---|---|
| GET | `/notifications` | Bearer | `?isRead=true\|false&page&limit` | **paginated** `[{ id, userId, roomId, title, message, isRead, createdAt }]` |
| PATCH | `/notifications/read-all` | Bearer | — | `{}` |
| PATCH | `/notifications/:id/read` | Bearer | — | `{}` |

Notifications are generated for: join requested (→ admins), member added, join rejected, expense submitted (→ admins + accountants), expense approved/rejected, contribution approved/rejected, and reimbursement paid.
There are no websockets. Poll (e.g. every 30–60 s) or refetch on window focus.

## 10. Activity & audit

| Method | Path | Access | Query | Returns |
|---|---|---|---|---|
| GET | `/rooms/:roomId/activity` | Active member | `?dateFrom&dateTo&page&limit` | `data: [{ id, action, entityType, entityId, createdAt, actor:{id,fullName}, details:{amount?} }]`, `meta:{total,page,limit,totalPages}` |
| GET | `/rooms/:roomId/audit-logs` | ADMIN | `?entityType&dateFrom&dateTo&page&limit` | same, but with the full `metadata` object instead of `details` |

## 11. Health
`GET /health` (public). Terminus DB and memory check. Use it to show a "backend waking up" banner (Render free tier cold start).

---

## 12. Error code catalog (what the UI should handle)

| Code | HTTP | UI treatment |
|---|---|---|
| `AUTH_EXPIRED_TOKEN` / `AUTH_INVALID_TOKEN` | 401 | silent refresh → retry once → else logout |
| `AUTH_REFRESH_TOKEN_INVALID` | 401 | logout + redirect /login |
| `AUTH_INVALID_CREDENTIALS` | 401 | form error "Invalid email or password" |
| `AUTH_EMAIL_ALREADY_EXISTS` | 400 | email field error |
| `VALIDATION_FAILED` | 400 | map `details[]` strings onto form fields |
| `ROOM_ACCESS_DENIED` / `ROOM_MEMBER_NOT_ACTIVE` | 403 | redirect to /rooms with a toast |
| `INSUFFICIENT_PERMISSION` | 403 | toast (UI should already hide the action) |
| `ROOM_ALREADY_ARCHIVED` | 400 | read-only banner; disable mutations |
| `ROOM_NOT_FOUND` | 404 | "Invalid room code" on the join form |
| `ROOM_LAST_ADMIN_CANNOT_LEAVE` / `ROOM_ADMIN_CANNOT_KICK_SELF` | 400/403 | explain promoting another admin first |
| `ROOM_LEAVE_REQUEST_NOT_FOUND`, `JOIN_REQUEST_ALREADY_PROCESSED`, `*_ALREADY_PROCESSED`, `REIMBURSEMENT_ALREADY_PAID` | 409/400 | toast + refetch list (stale data) |
| `TREASURY_INSUFFICIENT_BALANCE` | 400 | explain the treasury needs a top-up |
| `CATEGORY_NAME_DUPLICATE` / `CATEGORY_IN_USE` | 409 | inline error |
| any (HTTP status 429; code arrives as `HTTP_EXCEPTION`) | 429 | "Too many requests, wait a minute". Detect by HTTP status, not code |
