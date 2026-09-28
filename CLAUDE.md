# HisaabSync Frontend — AI Developer Guide

@AGENTS.md

Web frontend for **HisaabSync**, a room-based shared-treasury expense manager.
The backend is a separate NestJS + Prisma + PostgreSQL REST API at `D:\yagnik-deploy\HisaabSync`.

## 1. Session protocol (mandatory)

1. **Start of every session:** read `PROGRESS.md` first. It is the reality of what is built.
2. **Before touching a feature:** read the matching doc below. **Never invent endpoints, fields, or roles.**
   If something is missing from `docs/01`, check the backend code (`HisaabSync/src/modules/<module>/`) and update `docs/01`.
3. **End of every session/task:** update `PROGRESS.md` (phase checkboxes, current focus, new decisions).
   If a backend issue gets fixed, update `docs/05-backend-known-issues.md`.

| Topic | File |
|---|---|
| Every endpoint, request/response shape, roles, error codes | `docs/01-backend-api-reference.md` |
| Entities, relationships, state machines, role matrix, user journeys | `docs/02-domain-and-relationships.md` |
| Stack, auth (BFF cookie) design, folder structure, conventions | `docs/03-frontend-architecture.md` |
| Phase-by-phase build plan | `docs/04-implementation-roadmap.md` |
| Backend bugs/quirks that affect the UI | `docs/05-backend-known-issues.md` |
| Deploying (Vercel, env vars, backend prerequisites, CSP follow-up) | `docs/06-deployment.md` |
| Browser QA checklist (the UI hasn't been browser-tested yet) | `docs/07-manual-qa-checklist.md` |

Backend spec docs (background reading): `D:\yagnik-deploy\HisaabSync\docs\` (`06-api-design.md`, `07-rbac-design.md`, `09-error-handling-strategy.md`).
**The backend code wins over the backend spec docs.** `docs/01` here reflects the code.

## 2. Stack
Next.js 16 (App Router, Turbopack, TypeScript strict) · React 19 · Tailwind CSS v4 · shadcn/ui (`radix-nova` style, Radix primitives) · TanStack Query v5 · React Hook Form + Zod 4 · decimal.js-light · date-fns · sonner · next-themes · Google Identity Services.

**Next.js 16 gotchas** (read `node_modules/next/dist/docs/` before using an unfamiliar API):
- `middleware.ts` is now **`proxy.ts`**. `params`, `searchParams`, `cookies()`, `headers()` are **async** (await them).
- `PageProps<'/route'>`, `LayoutProps`, and `RouteContext` are global generated types (`next typegen`, which runs inside `npm run typecheck` and the build).
- shadcn: forms use the **`field`** component (`Field`, `FieldLabel`, `FieldError`…) with React Hook Form's `Controller`. There is no `form` component. `cn` comes from shadcn's `cn` package (via `@/lib/utils`).

## 3. Hard rules

- **Mobile-first.** Most users are on phones. Build every screen for ~360–430px first, using the mobile design system in `docs/03` §5 (bottom nav, `ResponsiveDialog` sheets, `ItemList` rows, `ListToolbar` chips, `AmountField`, 40px touch targets). Never add tables or small click targets for phone flows.

- **Money:** API amounts are strings. Never use `parseFloat`/`Number` arithmetic on money. Use `lib/money.ts` (decimal lib). Send amounts as strings matching `^\d+(\.\d{1,2})?$`. Format with the room's `currencyCode`.
- **Auth:** the refresh token lives **only** in the httpOnly `hs_rt` cookie, set by `app/api/auth/*` route handlers. The access token lives **only in memory**. Never put tokens in localStorage/sessionStorage. Refresh is single-flight.
- **API access:** all calls go through `lib/api/client.ts` and `lib/api/endpoints/*`. No raw `fetch` in components.
- **Errors:** always go through `normalizeError()`. The real error code may be in `error.message` (see docs/01 §1 quirk).
- **Unknown body fields = 400** (backend `forbidNonWhitelisted`). Send only documented fields; strip empty optional fields.
- **Roles are per room.** Gate UI with `lib/permissions.ts` using `myRole` from the room query. The backend still enforces, so handle 403 gracefully.
- **After mutations,** invalidate the affected list + `['room', roomId]` + treasury queries (see docs/03 §4).
- **Confirm dialogs** for approve/reject/pay/remove/adjust. Rejections collect a reason.
- Don't hand-edit `components/ui/*` beyond small tweaks. Build features in `components/<feature>/`.
- Don't modify the backend repo unless the task is explicitly a backend fix from `docs/05`.

## 4. Commands
```bash
npm run dev          # Next dev server → http://localhost:3001 (backend owns 3000)
npm run build        # production build — must pass before a phase is "done"
npm run lint         # ESLint
npm run typecheck    # next typegen + tsc --noEmit
npm run format       # Prettier (+ tailwind class sorting); components/ui is ignored
npx shadcn@latest add <component>   # add more shadcn components
```
Backend (in `D:\yagnik-deploy\HisaabSync`):
```bash
docker compose -f docker/docker-compose.dev.yml up -d   # Postgres
npm run start:dev                                        # API at http://localhost:3000/api/v1, Swagger at /api/docs
```
Env (`.env.local`): `API_URL`, `NEXT_PUBLIC_API_URL` (both default `http://localhost:3000/api/v1`), `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
Live backend: `https://hissabsync.onrender.com/api/v1` (free tier, cold starts).

## 5. Working style
The developer treats this as a **learning project**:
- Say which doc(s) you used and explain *why* for non-obvious choices (auth flow, cache invalidation, decimals).
- Flag conflicts between a request and the docs instead of silently picking one.
- Build step by step, one roadmap phase at a time. Prefer readable code over clever code.
