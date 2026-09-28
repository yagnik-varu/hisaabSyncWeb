# PROGRESS.md — HisaabSync Frontend Build State

> Read FIRST every session. Update LAST every session. Keep it compact (status + facts).

Last updated: `2026-09-28` — Phase 0 complete.

## 1. Phase status (see `docs/04-implementation-roadmap.md`)

- [x] **Discovery** — Backend explored; docs/01–05 written
- [x] **Phase 0** — Next 16.3.6 scaffold, shadcn (radix-nova) + 20 base components, TanStack Query/RHF/Zod 4/decimal/date-fns/next-themes, `lib/api/{client,errors,endpoints/health}`, `lib/{env,money,permissions,query-keys}`, `types/api.ts`, providers, temporary backend status page at `/`
- [ ] **Phase 1** — Authentication (BFF cookie, login/register/Google, profile)
- [ ] **Phase 2** — App shell & rooms (list, create, join, room layout)
- [ ] **Phase 3** — Room overview & treasury
- [ ] **Phase 4** — Contributions
- [ ] **Phase 5** — Categories & expenses
- [ ] **Phase 6** — Reimbursements & approvals inbox
- [ ] **Phase 7** — Members & room administration
- [ ] **Phase 8** — Activity, audit & notifications
- [ ] **Phase 9** — Polish & ship

## 2. Current focus
**Next:** Phase 1: auth. Build the BFF route handlers (`app/api/auth/*`, httpOnly `hs_rt` cookie), the auth store, and a `configureApiAuth()` wiring (client.ts already has single-flight refresh + 401 retry hooks), then the login/register/Google pages, `src/proxy.ts`, and the profile page.
**Blocked by:** nothing. The local backend was not running during Phase 0, so it was verified against the Render backend (`/health` OK, CORS reflects `http://localhost:3001`).

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

## 4. Backend fixes status
See `docs/05-backend-known-issues.md`. Open blockers: #1 notifications (Phase 8), #2 archive (Phase 7), #3/#4 room fields (Phase 2).

## 5. Environment facts
- Frontend folder: `D:\yagnik-deploy\HissabSyncFrontend` (the user commits manually)
- Node 24.16 / npm 11.13. Env: copy `.env.local.example` → `.env.local`. To point at the live API, set `NEXT_PUBLIC_API_URL=https://hissabsync.onrender.com/api/v1`.
- Checks: `npm run lint && npm run typecheck && npm run build` (all passing at end of P0).
- Backend folder: `D:\yagnik-deploy\HisaabSync` (NestJS, port 3000, prefix `api/v1`)
