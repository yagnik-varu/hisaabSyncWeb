# Manual QA Checklist (browser)

**Why this exists:** during development every phase was verified with `lint`, `typecheck`,
`next build` and **curl against the real backend** (API flows, permissions, error codes, cookies,
headers). The UI itself (clicks, dialogs, layout, focus, dark mode) has **not** been exercised in
a real browser yet. Run this once locally (`npm run dev`, backend on :3000) and once in production.

Use two browsers or profiles: **A** = room admin, **B** = second account.
Tick each box; note anything odd in `PROGRESS.md` → Known issues.

## 1. Auth (Phase 1)
- [ ] `/rooms` while signed out → redirected to `/login?next=%2Frooms`
- [ ] Register with a mismatched confirm password → inline field error, no request sent
- [ ] Register with an existing email → error on the **email** field
- [ ] Register OK → lands on `/rooms`; **reload** → still signed in
- [ ] Wrong password → "Invalid email or password." banner
- [ ] Profile: change name → header avatar/initials update without reload; clear phone → saved as empty
- [ ] Change password: wrong current password → error on that field; success → toast
- [ ] Open two tabs, log out in one → the other tab also goes to `/login`
- [ ] (If `NEXT_PUBLIC_GOOGLE_CLIENT_ID` set) Google button renders in light and dark mode and signs in

## 2. Rooms (Phase 2)
- [ ] Empty state with Create / Join buttons
- [ ] Create room → opens the room; the code copies to the clipboard with a toast
- [ ] B: Join with a wrong code → field error; with the right code → "Request sent" state
- [ ] A: join code of a room you're already in → "You're already a member"
- [ ] Header room switcher lists rooms and marks the current one
- [ ] `/rooms/not-a-uuid` → "Room not found"; B opening A's room before approval → toast + back to `/rooms`

## 3. Overview & treasury (Phase 3)
- [ ] Summary cards show balance / contributed / reimbursed in the room currency (INR uses 1,00,000 grouping)
- [ ] Ledger filters update the URL; reload keeps them; Clear resets them
- [ ] Admin: manual debit larger than the balance in strict mode → red warning + destructive button
- [ ] After an adjustment the balance updates everywhere without reload

## 4. Contributions (Phase 4)
- [ ] B submits → A sees it pending (overview "Needs attention", nav badge, approvals)
- [ ] A approves → balance increases; B rejects/cancels flows work; "(you)" markers correct
- [ ] Approving your own contribution shows the warning

## 5. Expenses (Phase 5)
- [ ] Log an expense with a receipt link → paperclip icon; detail page link opens in a new tab
- [ ] Reject requires a reason (Confirm blocked while empty)
- [ ] After approve, the detail page shows "Creating the reimbursement…" then the reimbursement card
- [ ] Settings: add category "rent" when "Rent" exists → blocked; delete a used category → clear error

## 6. Reimbursements & approvals (Phase 6)
- [ ] Row click opens the side sheet; URL gets `?open=`; browser Back closes it
- [ ] Mark paid shows balance before/after; strict mode + insufficient balance → Confirm disabled with explanation
- [ ] Approvals inbox tabs show counts and open on the first non-empty tab
- [ ] Join request from an existing member shows "Already a member" and only Reject

## 7. Members & settings (Phase 7)
- [ ] "…" menu: change role opens a dialog **after** the menu closes; role badge updates
- [ ] Remove dialog shows outstanding money for that member (if any)
- [ ] B: Leave room → redirected to `/rooms` with a toast; A sees the leave request; Reject restores B
- [ ] Last admin: Leave button's dialog blocks confirm with an explanation
- [ ] Room details form: Save disabled until something changes
- [ ] Archive: typed code required; with backend bug #2 an error explains the server didn't archive

## 8. Activity & notifications (Phase 8)
- [ ] Activity timeline + date filter; admin sees the "Audit log" tab and can expand entries
- [ ] Bell badge updates within ~45 s (or on tab focus) after B's expense is approved
- [ ] Clicking a notification marks it read and opens the right page
- [ ] While backend #1 is unfixed: the notifications page shows the "other people's notifications" notice

## 9. Polish (Phase 9)
- [ ] Stop the backend → amber banner appears on the next request; start it → banner disappears, data refreshes, toast
- [ ] DevTools offline → "You're offline" banner
- [ ] Unknown URL while signed in → "Page not found"
- [ ] Keyboard: Tab from page load → "Skip to content" appears; dialogs trap focus; Esc closes them
- [ ] 360px width (DevTools device mode): header fits, tables don't overflow, room nav scrolls sideways
- [ ] Dark mode: every page readable (status badges, banners, credit/debit amounts)
- [ ] Browser tab titles: "Overview · HisaabSync", "Treasury · HisaabSync", …
