# HisaabSync Frontend — Architecture

## 1. Stack (decided 2026-09-28)

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict)** | File-based routing, route handlers give us a BFF for secure cookies, easy Vercel deploy |
| Styling / UI | **Tailwind CSS v4 + shadcn/ui** (`radix-nova` style, Radix primitives, `cn` package) + `lucide-react` icons | Components are copied into our repo, so they are fully editable and accessible |
| Server state | **TanStack Query** | Caching, refetch-on-focus, invalidation after mutations, polling for notifications |
| Forms | **React Hook Form + Zod 4** (`@hookform/resolvers`), rendered with shadcn `field` components | Zod schemas mirror the backend DTO rules |
| HTTP | a thin `fetch` wrapper (`lib/api/client.ts`) | Handles the envelope, error normalization, Bearer header, and 401 → refresh → retry |
| Money | **decimal.js-light** (or big.js) + `Intl.NumberFormat` | Never do float math on amounts; API sends strings |
| Dates | `date-fns` | formatting and relative time ("2h ago") |
| Toasts | shadcn `sonner` | |
| Theme | `next-themes` (light/dark) | |
| Google login | Google Identity Services (`@react-oauth/google`) | Gets the ID token for `POST /auth/google` |
| Package manager | npm | same as the backend |

Installed in Phase 0: Next 16.3.6. `middleware.ts` → `proxy.ts`; `params`/`cookies()` are async. See CLAUDE.md §2.

## 2. Auth design — httpOnly cookie BFF (decided)

```
Browser ──(login form)──▶ Next Route Handler /api/auth/login ──▶ NestJS /auth/login
                                   │  sets httpOnly cookie  hs_rt=<refreshToken>
                                   ◀── returns { user, accessToken }   (refresh token never reaches JS)

Browser ── API calls ───────────────────────────────────────────▶ NestJS directly
            Authorization: Bearer <accessToken held in memory>

On 401 / on page load ──▶ /api/auth/refresh (reads hs_rt cookie) ──▶ NestJS /auth/refresh
                                   │  rotates hs_rt cookie
                                   ◀── returns { accessToken }
```

- Route handlers under `src/app/api/auth/` (helpers in `src/lib/auth/server.ts`): `login`, `register`, `google`, `refresh`, `logout`.
  - **Two cookies**, both `httpOnly`, `secure` in prod, `sameSite=lax`, max-age = the refresh token's `exp`:
    - `hs_rt`, the refresh token, `path=/api/auth` (sent only to the BFF, never with page requests).
    - `hs_session=1`, `path=/`, a marker so `src/proxy.ts` can gate pages without seeing the token.
  - Request bodies are whitelisted per route; `Origin` must match the host (CSRF defence in depth on top of SameSite).
  - `refresh` clears the cookies only on a real 401. A 502/503 (backend asleep) keeps the session.
  - `logout` revokes via NestJS `/auth/logout`. If the access token is expired, it refreshes first and revokes the new token. It always clears the cookies.
- **Access token lives only in memory** (`src/lib/auth/session.ts`, read with `useAuth()`). A page reload bootstraps with `/api/auth/refresh` and then `/auth/me`.
- **Single-flight refresh** within a tab (a shared promise) and **across tabs** (Web Locks `navigator.locks`), because refresh tokens rotate.
- **Cross-tab sync** via `BroadcastChannel("hisaabsync-auth")`: logging out in one tab logs out all tabs, and logging in wakes the others.
- Session states: `loading | authenticated | unauthenticated | error`. `error` means the server was unreachable during bootstrap; it shows a retry screen and does not log the user out.
- `AuthGate` (the `(app)` layout) redirects to `/login?next=…`, dropping `next` after a deliberate logout. `RedirectIfAuthenticated` (the `(auth)` layout) sends signed-in users to a validated `next` (`safeNextPath`, which blocks open redirects).
- The React Query cache is cleared on sign-out or user switch (`AuthProvider`).
- Profile data comes from `GET /auth/me` after bootstrap.
- Server-side env: `API_URL` (used by route handlers). Client env: `NEXT_PUBLIC_API_URL`. Both default to `http://localhost:3000/api/v1`.

**Why not call NestJS from Server Components?** The access token is in browser memory, and all pages are per-user dashboards. So data fetching is client-side via TanStack Query, and pages are mostly `"use client"` inside a server layout shell. This is a deliberate trade-off for simplicity.

## 3. Folder structure

```
src/
  app/
    page.tsx                                            # public landing page (signed-in users → /rooms via proxy.ts)
    (auth)/login/page.tsx, register/page.tsx          # public, centered card layout
    (app)/layout.tsx                                    # auth-gated shell: top bar, notifications bell
    (app)/rooms/page.tsx                                # My Rooms + create/join
    (app)/rooms/[roomId]/layout.tsx                     # room shell: sidebar/tabs, loads room + myRole
    (app)/rooms/[roomId]/page.tsx                       # Overview dashboard
    (app)/rooms/[roomId]/approvals/page.tsx             # ADMIN/ACCOUNTANT inbox
    (app)/rooms/[roomId]/contributions/page.tsx
    (app)/rooms/[roomId]/expenses/page.tsx, [expenseId]/page.tsx
    (app)/rooms/[roomId]/reimbursements/page.tsx
    (app)/rooms/[roomId]/treasury/page.tsx              # summary + ledger + adjustment (admin)
    (app)/rooms/[roomId]/members/page.tsx               # members, join & leave requests
    (app)/rooms/[roomId]/activity/page.tsx              # activity feed; audit-log tab for admin
    (app)/rooms/[roomId]/settings/page.tsx              # room settings + categories (admin/acct)
    (app)/notifications/page.tsx
    (app)/profile/page.tsx
    api/auth/{login,register,google,refresh,logout}/route.ts
    layout.tsx, providers.tsx, globals.css
  components/
    ui/                  # shadcn generated — do not hand-edit heavily
    shared/              # Money, StatusBadge, EmptyState, DataTable, Pagination, ConfirmDialog, RoleGate
    rooms/ expenses/ contributions/ … (feature components)
    landing/             # landing page sections (server) + DemoPhone / RoleSwitcher (client islands)
  lib/
    api/client.ts        # fetch wrapper, envelope unwrapping, ApiError, refresh-retry
    api/errors.ts        # normalizeError() — implements the error-code quirk rule
    api/endpoints/*.ts   # one file per backend module: auth, rooms, members, categories, treasury, contributions, expenses, reimbursements, notifications, activity
    auth/                # token store, bootstrap, useAuth()
    money.ts             # parse/format/compare Decimal strings
    permissions.ts       # can(role, action) — mirrors docs/02 §3
    query-keys.ts        # central TanStack Query key factory
  hooks/                 # useRoom(roomId), useMyRole(), useRoomMutations…
  types/api.ts           # TS types for every response shape in docs/01
  schemas/               # zod schemas (amount, room, expense, …)
```

## 4. Conventions

- **Types:** hand-write `types/api.ts` from `docs/01-backend-api-reference.md`. All money fields are `string`.
- **Query keys:** `['rooms']`, `['room', roomId]`, `['room', roomId, 'expenses', filters]`, … After any mutation, invalidate the affected lists **and** `['room', roomId]` (pending counts) **and** `['room', roomId, 'treasury']`.
- **Permissions:** hide or disable actions with `permissions.ts`. The backend is still the authority, so handle 403 gracefully.
- **Archived room:** when known ARCHIVED (from the list `status`, or after any `ROOM_ALREADY_ARCHIVED` error), show a read-only banner and disable all mutation buttons.
- **Money input:** a text input with regex `^\d+(\.\d{1,2})?$`, amount > 0, sent as a string. Display with `Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode })`.
- **Status badges:** one `StatusBadge` component with a consistent color map (PENDING = amber, APPROVED/PAID = green, REJECTED = red, CANCELLED = gray, PENDING_PAYMENT = blue).
- **Lists:** server pagination via `page`/`limit`, with filters kept in the URL search params so they are shareable and survive a back button.
- **Destructive or financial actions** (approve, reject, pay, remove member, adjustment) always go through a `ConfirmDialog`. Reject dialogs collect the reason.
- **Responsive:** mobile-first. The room nav is a sidebar on desktop and a bottom/tab bar or sheet on mobile.
- **Accessibility:** use shadcn/Radix primitives, label every input, and keep keyboard flows working.

## 5. Mobile-first design system (decided 2026-09-28)

Most users are on phones. **Design and build for ~360–430px first**, then enhance from `md` (768px).
Screenshots at 390px are verified with a Playwright + Edge script (see PROGRESS.md).

| Area | Rule / component |
|---|---|
| Touch targets | Controls are **40px on phones**, compact from `md` (`h-10 md:h-8` in `components/ui/button|input|select|tabs|dropdown-menu`). Inputs use 16px text on phones (no iOS zoom). |
| Room navigation | Phones: `RoomBottomNav`, a fixed bottom bar: Home · Expenses · **+** (add money / log expense sheet) · Approvals (approvers, badge) or Payouts (members) · More (sheet with all other sections, room code, Invite, All rooms). Desktop: `RoomNav` top tabs. Page content gets `pb-[calc(5rem+env(safe-area-inset-bottom))]` on phones. |
| Forms | `ResponsiveDialog` → **bottom sheet (vaul Drawer) on phones**, Dialog on desktop. Use `ResponsiveDialogBody` (scrolls) + `ResponsiveDialogFooter` (pinned, full-width buttons; put Cancel first, primary last). |
| Confirmations | `ConfirmDialog` stays a centered alert (native mobile pattern), widened to `100% - 2rem` on phones. |
| Money input | `AmountField`: decimal keypad, currency prefix, as-you-type sanitizing, optional quick-amount chips. |
| Few choices | `ChoiceChips` (radiogroup) instead of a Select when there are ≤ ~8 options (e.g. categories). |
| Lists | `ItemList` / `ItemRow` card lists, **not tables**: title + amount, status + one truncating detail span + short date (`formatShortDate`) under the amount, notes, and a footer with full-width actions (Approve is primary and last). |
| Filters | `ListToolbar`: status as scrollable chips, optional "Mine"/"Owed to me" chip, secondary filters in a bottom sheet behind a "Filters" button (count badge) on phones, inline on desktop. |
| Page titles | `SectionHeader` (title + action; description hidden on phones). The room header is hidden on phones; the room name is in the app header, and Home has its own compact hero. |
| Details | Side sheets become **bottom** sheets on phones (`useIsMobile()`). |
| Header | Phones: icon logo, room switcher, bell = link to /notifications, avatar menu (Profile, **Theme**, Log out). Desktop: dropdown bell + theme toggle. |
| Native touches | `InviteButton` uses the Web Share API (WhatsApp etc.) with a copy fallback. `TextField` sets `autoCapitalize/autoCorrect/inputMode/enterKeyHint` per type. `viewport-fit=cover` + safe-area padding. `themeColor`. No tap highlight. `touch-action: manipulation`. |
| Grids | Mobile grids need an explicit **`grid-cols-1`** (`minmax(0,1fr)`). A bare `grid` uses an `auto` track, so long `truncate`/no-wrap text widens the column past the screen. |
| Motion (landing) | Keyframes live in `globals.css` (`--animate-rise/toast/fill/flow/float/marquee/orbit`). Always apply them with `motion-safe:`; auto-playing content gets a pause button and doesn't auto-play under reduced motion. Anything timed in JS waits for hydration (`useHydrated` in `demo-phone.tsx`) so CSS and timers stay in sync. |
