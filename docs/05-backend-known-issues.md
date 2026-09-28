# Backend Known Issues that Affect the Frontend

Found while reviewing the backend code on 2026-09-28. Decision: **document now, fix in the backend
(`D:\yagnik-deploy\HisaabSync`) when the related frontend screen is being built.** Mark each one as fixed here when done.

| # | Severity | Issue | Where | Fix | Blocks phase | Status |
|---|---|---|---|---|---|---|
| 1 | 🔴 Critical (security) | Notification controller uses `@CurrentUser('id')`, but the JWT payload only has `sub`, so `userId` is `undefined`. Prisma drops `undefined` filters, so **`GET /notifications` returns every user's notifications**, `read-all` marks everyone's as read, and `/:id/read` works on anyone's notification. | `src/modules/notification/controllers/notification.controller.ts` | Use `@CurrentUser('sub')` (3 places) | 8 | Open |
| 2 | 🟠 High | Archive room does nothing. `UpdateRoomDto` accepts `status`, but `RoomRepository.updateRoomAndSettings` never writes it. The response returns the old status, and the `room.archived` event never fires. | `src/modules/room/repositories/room.repository.ts` | Pass `status` through into `room.update` data | 7 | Open |
| 3 | 🟡 Medium | `GET /rooms` → `treasuryBalance` is always `"0.00"` because `findMyRooms` doesn't include `treasuryAccount`. The list also lacks `currencyCode`. | `room.repository.ts#findMyRooms`, `room.service.ts#listMyRooms` | See **Patch A** below | 2 | Open (verified 2026-09-28). UI hides the balance while `currencyCode` is absent |
| 4 | 🟡 Medium | `GET /rooms/:roomId` doesn't return `status`, `description`, or `createdAt`, so the UI can't tell a room is archived from the details endpoint. `treasuryBalance` comes back as `"0"`, not 2dp. | `room.service.ts#getRoomDetails` | See **Patch A** | 2 | Open (verified). UI falls back to the cached list `status` |
| 5 | 🟡 Medium | Inconsistent error codes. Many services throw `new XException('CODE')` (auth, contributions, treasury). The filter then yields `code: HTTP_EXCEPTION` (or `VALIDATION_FAILED` for 400s) with the real code in `message`. Also `AUTH_EMAIL_ALREADY_EXISTS` is 400 (spec: 409), and `*_ALREADY_PROCESSED` is 400 (spec: 409). | auth/treasury services, `all-exceptions.filter.ts` | Throw `{ code, message }` objects everywhere | — | Open (the frontend normalizer handles both forms) |
| 6 | 🟢 Low | Validation `details` is an array of strings, not `{field, constraint, message}` objects as in the spec. | `all-exceptions.filter.ts` | optional | — | Workaround in the client |
| 7 | 🟢 Low | A user cannot see their own pending join requests (no endpoint). | member module | Optional: `GET /rooms/join-requests/mine` | 2 | Open (UI shows local "request sent" only) |
| 8 | 🟢 Low | Ledger `description` embeds raw user UUIDs ("Contribution from user <uuid>"). | treasury/reimbursement repos | Use names or leave as-is | 3 | **Worked around (P3):** `lib/ledger.ts#describeTransaction` swaps ids for member names ("a former member" if unknown) |
| 9 | 🟢 Info | A reimbursement is created **asynchronously** after expense approval, so fetching right after approve may miss it. | reimbursement service `@OnEvent(async)` | — | 5/6 | Workaround: invalidate again after ~1 s |
| 10 | 🟢 Info | No file upload. `receiptUrl` and `profileImageUrl` are plain URLs. | — | Future: upload endpoint (S3/Cloudinary) | 5 | URL input for now |
| 11 | 🟢 Info | A member in `LEAVE_REQUESTED` status is locked out of the room (guard requires ACTIVE) until the admin decides. | `room-member.guard.ts` | Design choice | 7 | Warn the user in the leave confirmation dialog |
| 12 | 🟢 Info | Leave-request routes take `:requestId`, but the value is really the member's **userId**. There is no list endpoint. | member controller | — | 7 | Derive from `GET /members` with status `LEAVE_REQUESTED` |
| 13 | 🟢 Info | Manual DEBIT adjustments skip the strict-mode balance check. | treasury repo | Optional | 3 | **Handled (P3):** the adjustment dialog previews the resulting balance and warns (destructive button) |
| 14 | 🟢 Info | Contribution rejection doesn't set `approvedBy/approvedAt` (no reviewer recorded). | treasury repo | Optional | 4 | — |
| 17 | 🔴 Critical (security) | **Refresh-token rotation and logout are ineffective.** Refresh tokens are hashed with bcrypt, which only reads the first **72 bytes**. Every refresh JWT of a user shares the same first 72 bytes (JWT header + `{"sub":"<userId>…`), so *any* valid refresh JWT of that user matches *any* stored hash. Verified in Phase 1: an already-rotated old token still refreshed successfully (200). Logout deletes an arbitrary session of that user rather than the current one. | `src/modules/auth/services/auth.service.ts` (refresh/logout/generateTokens), `utils` hashPassword | Hash refresh tokens with **SHA-256** (deterministic, fine for high-entropy tokens) and look up by hash directly (`WHERE token_hash = sha256(token)`), or add a random `jti` and store/lookup that. | — (frontend unaffected; fix ASAP) | Open |
| 16 | 🟡 Medium | Rate limits (`ThrottlerGuard`, keyed by IP) will see **the Next.js BFF server's IP** for login/register/google/refresh, so all users share one bucket (100 req/60 s) in production. Express `trust proxy` is not enabled, so `X-Forwarded-For` (which the BFF already sends) is ignored. On Render this is already true today, because the IP is Render's proxy. | `main.ts` | `app.set('trust proxy', 1)` (Render/Vercel hop count) and/or a custom throttler tracker using `X-Forwarded-For` | 9 | Open |
| 18 | 🟠 High | Join requests aren't validated against membership. (a) An existing ACTIVE member can create a join request for their own room (verified). (b) Approving a request from a **former** member (status LEFT) calls `roomMember.create`, which violates the `(roomId,userId)` unique constraint, so ex-members can never rejoin. (c) `POST /rooms/join` has no DTO, so a missing `roomCode` reaches Prisma. (d) Joining an **archived** room is allowed (the guard has no room context on this route). | `member.service.ts#requestJoin`, `member.repository.ts#approveJoinRequestTransaction`, `member.controller.ts` | Reject when a membership is ACTIVE/LEAVE_REQUESTED. On approve, `upsert` the member back to ACTIVE/MEMBER (clear `leftAt`). Add a `JoinRoomDto` (`@IsString @IsNotEmpty`). Check `room.status` in `requestJoin`. | 2 / 7 | Open. UI checks cached rooms before sending |
| 19 | 🟢 Low | Non-UUID `:roomId` (e.g. `/rooms/abc`) → **500** `INTERNAL_SERVER_ERROR` (Prisma P2023). Room/member/audit controllers don't use `ParseUUIDPipe`, and the filter doesn't map P2023. | room/member/audit controllers, `all-exceptions.filter.ts` | `ParseUUIDPipe` on `:roomId`, or map P2023 → 400 | 2 | Open (verified). UI validates the UUID before fetching |
| 20 | 🟢 Low | The activity feed is sparse: only 5 actions are audited (`CONTRIBUTION_APPROVED`, `EXPENSE_APPROVED`, `REIMBURSEMENT_PAID`, `TREASURY_ADJUSTMENT`, `ROLE_UPDATED`). Submissions, rejections, cancellations, joins, leaves, removals and settings changes aren't recorded. `CONTRIBUTION_APPROVED` metadata `contributorId` falls back to the approver (wrong person). `ROLE_UPDATED` details are stripped from the member feed, so the UI can't say whose role changed. | `audit/events/audit.listener.ts` | Add listeners for the other domain events. Pass `contributorId` in the contribution.approved payload. | 8 | Open. UI falls back to a generic sentence for unknown actions |
| 15 | 🟢 Info | `CORS_ORIGIN=*` with `credentials: true`. It works because the browser sends a Bearer token (no cookies) to NestJS. Set it to the real frontend origin in production. | `main.ts`, Render env | Config | 9 | — |

---

## Patch A — fixes #3 and #4 (ready to apply in `HisaabSync`)

`src/modules/room/repositories/room.repository.ts` → `findMyRooms`, inside `include`:
```ts
        include: {
          settings: true,
          treasuryAccount: { select: { currentBalance: true } }, // ← add
          _count: { … },
```

`src/modules/room/services/room.service.ts` → `listMyRooms` mapping:
```ts
        treasuryBalance: r.treasuryAccount?.currentBalance?.toFixed(2) ?? '0.00',
        currencyCode: r.settings?.currencyCode ?? 'INR',                         // ← add
```

`src/modules/room/services/room.service.ts` → `getRoomDetails` return object:
```ts
      description: room.description,                                              // ← add
      status: room.status,                                                        // ← add
      createdAt: room.createdAt,                                                  // ← add
      treasuryBalance: room.treasuryAccount?.currentBalance?.toFixed(2) ?? '0.00', // ← 2dp
```
No schema change and no migration. The frontend already reads these fields when present.
