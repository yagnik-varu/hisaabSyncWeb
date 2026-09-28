# HisaabSync Frontend — Implementation Roadmap

Build **one phase at a time**. At the end of each phase, update `PROGRESS.md`.
Each phase ends with a manual check against the running backend (local by default).

## Phase 0 — Scaffold & foundations
- `create-next-app` (TS, App Router, Tailwind, ESLint, `src/` dir, `@/*` alias) in this folder.
- shadcn/ui init + base components (button, input, form, card, dialog, dropdown-menu, sheet, table, badge, tabs, select, sonner, skeleton, avatar, separator).
- Install TanStack Query, RHF, Zod, date-fns, decimal.js-light, next-themes.
- `.env.local.example` (`API_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`).
- `lib/api/client.ts` + `errors.ts` + `types/api.ts` + `money.ts` + `permissions.ts` + `query-keys.ts`.
- Providers (QueryClient, theme, toaster). Prettier config.
- **Done when:** the app runs, and a `GET /health` call renders the backend status on a temporary page.

## Phase 1 — Authentication
- BFF route handlers `api/auth/*` with the httpOnly `hs_rt` cookie.
- Auth store (in-memory access token), bootstrap-on-load, single-flight refresh, and 401 → retry.
- Login, register (with RHF + Zod), and Google sign-in button (behind `NEXT_PUBLIC_GOOGLE_CLIENT_ID`).
- Middleware/proxy route protection; logout.
- Profile page: view/edit profile, change password (hidden or disabled for Google-only users on `AUTH_NO_PASSWORD_SET`).
- **Done when:** register → reload (session survives) → wait 15 min or force-expire (auto refresh) → logout works.

## Phase 2 — App shell & rooms
- Authenticated layout: top bar (logo, room switcher, notifications bell placeholder, user menu, theme toggle).
- My Rooms page: room cards (name, code, role badge, member count, status), ACTIVE/ARCHIVED filter, pagination, empty state.
- Create-room dialog (name, description, currency select, strict/flexible toggle) → navigate into the room.
- Join-by-code dialog → "request sent, waiting for admin approval" state.
- Room layout: loads `GET /rooms/:roomId`, provides `myRole`, room nav, and copy-room-code button. Handles 403 by redirecting.
- **Done when:** create a room, see it in the list, open it, and join it from a second account.

## Phase 3 — Room overview & treasury
- Overview: balance card, total contributions, total reimbursements, pending counts (links to approvals), recent activity (5 items), quick actions.
- Treasury page: summary + ledger table (filters: type, reference type, date range) + admin "Manual adjustment" dialog.
- **Done when:** the numbers match the backend and adjustments update the balance instantly (invalidation).

## Phase 4 — Contributions
- List with status/contributor/date filters, a "Mine" toggle, and pagination.
- Submit-contribution dialog; cancel own PENDING; approve/reject (with reason) for approvers.
- **Done when:** member submits → approver approves → balance rises everywhere without a manual reload.

## Phase 5 — Categories & expenses
- Categories management (in room settings): list, create (admin/acct), delete (admin; handles `CATEGORY_IN_USE`).
- Expenses list (filters: status, category, submitter, dates), submit-expense form (category select, amount, title, description, receipt URL), expense detail page (reviewer, rejection reason, linked reimbursement), cancel own, approve/reject.
- **Done when:** the full submit → approve flow works and the detail page shows the reimbursement (after async delay/refetch).

## Phase 6 — Reimbursements & approvals inbox
- Reimbursements list (status/beneficiary filters, "Owed to me" view) and detail; "Mark paid" with confirm; `TREASURY_INSUFFICIENT_BALANCE` handling.
- **Approvals inbox** (admin/accountant): tabs for pending contributions, pending expenses, reimbursements to pay, and join requests (admin), with inline actions.
- **Done when:** an approver can clear every pending item from one page.

## Phase 7 — Members & room administration
- Members page: active members with role badges; admin role-change menu; remove member; separate "Past members" (LEFT).
- Join requests (admin/acct view; admin approve/reject); leave requests (from members with `LEAVE_REQUESTED`; `:requestId` = userId).
- "Leave room" action for the current user (with last-admin messaging).
- Room settings (admin): name, description, allowNegativeTreasury, archive (after backend fix #2).
- **Done when:** the whole membership lifecycle works across 2–3 test accounts.

## Phase 8 — Activity, audit & notifications
- Activity feed (human-readable sentences from `action`/`entityType`, actor, amount, relative time, date filters, pagination).
- Audit logs tab (admin, entityType filter, expandable metadata JSON).
- Notifications: bell with unread count (poll ~45 s + refetch on focus), dropdown of the latest items, full page with read/unread filter, mark one or all read, click-through to the room. **Requires backend fix #1 first.**

## Phase 9 — Polish & ship
- Loading skeletons, empty states, error boundaries (`error.tsx`, `not-found.tsx`), and a "server waking up" banner using `/health`.
- Responsive pass, dark mode pass, accessibility pass, and `next build` without errors or lint warnings.
- Optional: Playwright smoke test of the main journey.
- Deploy (Vercel), then set backend `CORS_ORIGIN` to the frontend domain.
