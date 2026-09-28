# Backend Known Issues that Affect the Frontend

Found while reviewing the backend code on 2026-09-28. Decision: **document now, fix in the backend
(`D:\yagnik-deploy\HisaabSync`) when the related frontend screen is being built.** Mark each one as fixed here when done.

| # | Severity | Issue | Where | Fix | Blocks phase | Status |
|---|---|---|---|---|---|---|
| 1 | 🔴 Critical (security) | Notification controller uses `@CurrentUser('id')`, but the JWT payload only has `sub`, so `userId` is `undefined`. Prisma drops `undefined` filters, so **`GET /notifications` returns every user's notifications**, `read-all` marks everyone's as read, and `/:id/read` works on anyone's notification. | `src/modules/notification/controllers/notification.controller.ts` | Use `@CurrentUser('sub')` (3 places) | 8 | Open |
| 2 | 🟠 High | Archive room does nothing. `UpdateRoomDto` accepts `status`, but `RoomRepository.updateRoomAndSettings` never writes it. The response returns the old status, and the `room.archived` event never fires. | `src/modules/room/repositories/room.repository.ts` | Pass `status` through into `room.update` data | 7 | Open |
| 3 | 🟡 Medium | `GET /rooms` → `treasuryBalance` is always `"0.00"` because `findMyRooms` doesn't include `treasuryAccount`. | `room.repository.ts#findMyRooms` | Add `treasuryAccount: true` to `include` | 2 | Open |
| 4 | 🟡 Medium | `GET /rooms/:roomId` doesn't return `status`, `description`, or `createdAt`, so the UI can't tell a room is archived from the details endpoint. | `room.service.ts#getRoomDetails` | Add those fields to the returned object | 2 | Open (workaround: use `status` from the list) |
| 5 | 🟡 Medium | Inconsistent error codes. Many services throw `new XException('CODE')` (auth, contributions, treasury). The filter then yields `code: HTTP_EXCEPTION` (or `VALIDATION_FAILED` for 400s) with the real code in `message`. Also `AUTH_EMAIL_ALREADY_EXISTS` is 400 (spec: 409), and `*_ALREADY_PROCESSED` is 400 (spec: 409). | auth/treasury services, `all-exceptions.filter.ts` | Throw `{ code, message }` objects everywhere | — | Open (the frontend normalizer handles both forms) |
| 6 | 🟢 Low | Validation `details` is an array of strings, not `{field, constraint, message}` objects as in the spec. | `all-exceptions.filter.ts` | optional | — | Workaround in the client |
| 7 | 🟢 Low | A user cannot see their own pending join requests (no endpoint). | member module | Optional: `GET /rooms/join-requests/mine` | 2 | Open (UI shows local "request sent" only) |
| 8 | 🟢 Low | Ledger `description` embeds raw user UUIDs ("Contribution from user <uuid>"). | treasury/reimbursement repos | Use names or leave as-is | 3 | Workaround: show `actor.fullName` + a type label, and don't render the raw description for system rows |
| 9 | 🟢 Info | A reimbursement is created **asynchronously** after expense approval, so fetching right after approve may miss it. | reimbursement service `@OnEvent(async)` | — | 5/6 | Workaround: invalidate again after ~1 s |
| 10 | 🟢 Info | No file upload. `receiptUrl` and `profileImageUrl` are plain URLs. | — | Future: upload endpoint (S3/Cloudinary) | 5 | URL input for now |
| 11 | 🟢 Info | A member in `LEAVE_REQUESTED` status is locked out of the room (guard requires ACTIVE) until the admin decides. | `room-member.guard.ts` | Design choice | 7 | Warn the user in the leave confirmation dialog |
| 12 | 🟢 Info | Leave-request routes take `:requestId`, but the value is really the member's **userId**. There is no list endpoint. | member controller | — | 7 | Derive from `GET /members` with status `LEAVE_REQUESTED` |
| 13 | 🟢 Info | Manual DEBIT adjustments skip the strict-mode balance check. | treasury repo | Optional | 3 | Show a warning in the adjustment dialog |
| 14 | 🟢 Info | Contribution rejection doesn't set `approvedBy/approvedAt` (no reviewer recorded). | treasury repo | Optional | 4 | — |
| 15 | 🟢 Info | `CORS_ORIGIN=*` with `credentials: true`. It works because the browser sends a Bearer token (no cookies) to NestJS. Set it to the real frontend origin in production. | `main.ts`, Render env | Config | 9 | — |
