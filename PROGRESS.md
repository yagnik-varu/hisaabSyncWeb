# PROGRESS.md — HisaabSync Frontend Build State

> Read FIRST every session. Update LAST every session. Keep it compact (status + facts).

Last updated: `2026-09-28` — Phase 0 complete.

## 1. Phase status (see `docs/04-implementation-roadmap.md`)

- [x] **Discovery** — Backend explored; docs/01–05 written
- [x] **Phase 0** — Next 16.3.6 scaffold, shadcn (radix-nova) + 20 base components, TanStack Query/RHF/Zod 4/decimal/date-fns/next-themes, `lib/api/{client,errors,endpoints/health}`, `lib/{env,money,permissions,query-keys}`, `types/api.ts`, providers, temporary backend status page at `/`
- [x] **Phase 1** — BFF `app/api/auth/*` (hs_rt + hs_session cookies), `lib/auth/{constants,server,session}`, `useAuth`, `AuthProvider`, `AuthGate`/`RedirectIfAuthenticated`, `src/proxy.ts`, login/register (+ Google button when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set), profile + change password, minimal app header with user menu, `/status` public page, placeholder `/rooms`
- [x] **Phase 2** — My Rooms (Active/Archived tabs + pagination in URL, cards, empty states), create-room and join-by-code dialogs, header room switcher, room shell (`RoomShell` + `useCurrentRoom()` context, header with copyable code, role-aware scrollable nav with pending-approvals badge, archived banner, not-found/403/unreachable states), basic overview stat cards, placeholder pages for later sections; shared `badges`, `EmptyState`, `PaginationBar`, `CopyButton`, `Money`
- [x] **Phase 3** — Overview (treasury summary cards, recent activity, needs-attention with pending counts, quick actions), Treasury page (summary, ledger with direction/source/date filters in URL + pagination, readable descriptions, admin manual adjustment dialog with balance preview + strict-mode warning); reusable `ActivityList`, `TreasurySummaryCards`; `lib/{dates,ledger,activity}`, `schemas/treasury` (`amountField` for all money inputs)
- [x] **Phase 4** — Contributions page (status/member/date filters in URL, pagination, table with note + rejection reason, "(you)" markers), submit dialog (also on the overview quick action), row actions: approve/reject (optional reason) for approvers and cancel-own, with an own-item approval warning; shared `ConfirmDialog` (async, inline errors, optional/required reason), `useUrlFilters` + `oneOf`/`uuidParam`, `list-filters` (`FilterSelect`, `DateRangeFilter`, `FilterBar`, `ClearFiltersButton`); treasury view refactored onto them
- [ ] **Phase 5** — Categories & expenses
- [ ] **Phase 6** — Reimbursements & approvals inbox
- [ ] **Phase 7** — Members & room administration
- [ ] **Phase 8** — Activity, audit & notifications
- [ ] **Phase 9** — Polish & ship

## 2. Current focus
**Next:** Phase 5: categories and expenses. Reuse `ConfirmDialog` (expense reject reason is **required**, ≤500), `useUrlFilters`, `list-filters`, `amountField`, and the `useContributionMutations` invalidation pattern. Remember the async reimbursement after approve (docs/05 #9).
**Pending backend work (user to apply):** **Patch A** in `docs/05` (#3/#4 room fields). Claude's file tools can't write outside this folder, so run `/add-dir D:\yagnik-deploy\HisaabSync` to let Claude apply backend fixes. #17 (refresh-token hashing) is security-critical.
**Phase 2 verification:** checked with curl against the local backend: list/create/details/join, invalid code 404, non-UUID 500 (#19), and a member joining their own room (#18). All room pages return 200 with a session cookie. Test room "Phase 2 Test Room" (code `5OIS0I`) exists, owned by the test account, with one stray PENDING join request from test #18.
**Verification gap:** Phase 1 BFF flows were verified with curl against the local backend (register, duplicate email, wrong password, proxy redirects, CSRF origin block, refresh rotation, profile update/null-clear, change-password error, logout revocation). The in-browser UI flow (forms, bootstrap after reload, cross-tab logout, Google button) still needs a **manual browser check**.
**Test data:** one test account `phase1-test-1790584568@example.com` was created in the dev DB (no delete endpoint; remove via Prisma Studio if wanted).

## 3. Key decisions
- 2026-09-28: Next.js App Router + Tailwind + shadcn/ui + TanStack Query + RHF/Zod.
- 2026-09-28: Auth = httpOnly refresh-token cookie via Next route handlers (BFF); access token in memory; browser calls NestJS directly with Bearer.
- 2026-09-28: API base URL configurable via env, defaults to local `http://localhost:3000/api/v1`.
- 2026-09-28: Backend bugs are documented in `docs/05` and fixed in the backend when the related screen is built.
- 2026-09-28 (P0): Dev server port **3001** (backend uses 3000). Scaffolded via scratchpad because create-next-app refuses non-empty dirs.
- 2026-09-28 (P0): shadcn v4 has no `form` component → use `field` + RHF `Controller`. `cn` is shadcn's official `cn` package (replaces clsx+tailwind-merge).
- 2026-09-28 (P0): zod pinned to v4 explicitly (npm deduped it to v3 because the `shadcn` CLI dep uses zod 3).
- 2026-09-28 (P0): API client throws `ApiError {status, code, message(friendly), details[]}`. The error-code quirk (code in `message`) was verified against the live API. 429 → `RATE_LIMITED`, fetch TypeError → `NETWORK_ERROR`.
- 2026-09-28 (P0): `/health` is not enveloped → `api.raw()`. A 503 means the DB is down or the Render instance is cold starting.

- 2026-09-28 (P1): The client's `refreshAccessToken` hook resolves null only on 401 and rejects on network/5xx errors, so a cold-starting backend never logs users out.
- 2026-09-28 (P1): RHF: use `useWatch` (not `form.watch`) — React Compiler lint flags `watch` as incompatible.
- 2026-09-28 (P1): Profile PATCH sends `null` to clear phone/image ("" fails `@IsPhoneNumber`/`@IsUrl`). Phone format is `+countrycode…`.
- 2026-09-28 (P1): Google-only accounts are detected only through `AUTH_NO_PASSWORD_SET` (`/auth/me` has no `provider` field).

- 2026-09-28 (P2): Room-scoped UI reads `useCurrentRoom()` → `{ roomId, room, myRole, currencyCode, isArchived, can() }`. Gate every mutation with `can(...)` and `!isArchived`.
- 2026-09-28 (P2): New room types fields are optional (`RoomDetails.status/description/createdAt`, `RoomListItem.currencyCode`) until Patch A is deployed. `isArchived` falls back to the cached list status.
- 2026-09-28 (P2): Validate `:roomId` as a UUID client-side (backend 500s on bad ids).
- 2026-09-28 (P2): No notifications bell yet (Phase 8), to avoid dead UI.
- 2026-09-28 (P3): Date filters are sent as exact instants (start/end of the local day, `lib/dates.ts`) because the backend uses `lte` on dateTo.
- 2026-09-28 (P3): List filters live in the URL, and `router.replace` + a page reset happen on every filter change (see `treasury-view.tsx`). This is the pattern for Phases 4–8.
- 2026-09-28 (P3): After money mutations, invalidate `roomDetails`, the `roomTreasury` prefix (includes the ledger), the activity prefix and `rooms()` (see `useCreateAdjustment`).
- 2026-09-28 (P4): Row actions use one mutation set per row (`ContributionActions`), so pending state is per item. Approve/reject `onError` also invalidates, because "already processed" means the list is stale.
- 2026-09-28 (P4): Second test account `phase4-member-1790589061@example.com` (MEMBER of the test room, joined via code). Test room balance ₹1,050 (+500 adjustment, +300 admin, +250 member); one rejected (₹100) and one cancelled (₹50) contribution.
- 2026-09-28 (P3): Test room now has a +₹500 adjustment ("Phase 3 verification: opening float"). The ledger is append-only.

## 4. Backend fixes status
See `docs/05-backend-known-issues.md`. Open: **#17 refresh-token hashing (security, fix soon)**, #1 notifications (Phase 8), #2 archive (Phase 7), #3/#4 room fields (Phase 2), #16 throttling behind BFF (before deploy).

## 5. Environment facts
- Frontend folder: `D:\yagnik-deploy\HissabSyncFrontend` (the user commits manually)
- Node 24.16 / npm 11.13. Env: copy `.env.local.example` → `.env.local`. To point at the live API, set `NEXT_PUBLIC_API_URL=https://hissabsync.onrender.com/api/v1`.
- Checks: `npm run lint && npm run typecheck && npm run build` (all passing at end of P0).
- Backend folder: `D:\yagnik-deploy\HisaabSync` (NestJS, port 3000, prefix `api/v1`)
