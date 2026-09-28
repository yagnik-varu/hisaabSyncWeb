# HisaabSync Frontend — Deployment Guide

Target: **Vercel** (first-class Next.js 16 support, HTTPS by default). Any Node 20.9+ host that
runs `next build && next start` behind HTTPS also works.

---

## 1. Before you deploy — backend blockers

Fix these in `D:\yagnik-deploy\HisaabSync` first (details and fixes in `docs/05-backend-known-issues.md`):

| # | Why it blocks a real launch |
|---|---|
| **#1** | `GET /notifications` returns **every user's** notifications. The UI hides them, but the data still reaches every browser. |
| **#17** | Refresh-token hashing with bcrypt (72-byte limit) makes rotation and logout ineffective. An old refresh token keeps working. |
| **#22** | `receiptUrl` accepts `javascript:` URLs (stored XSS risk for any other client). |
| **#16** | Behind the BFF, the backend rate-limits **all users as one IP**. Enable `trust proxy`. |
| #2 / Patch A (#3, #4) | Archiving doesn't work; the room list shows a wrong balance and the details lack status/description (the UI copes, but the features are degraded). |

Backend environment on Render:
- `CORS_ORIGIN=https://<your-frontend-domain>` (replace `*`). Browsers call the API directly with Bearer tokens.
- `GOOGLE_CLIENT_ID` must equal the frontend's `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (ID-token `aud` check).
- In `main.ts`: `app.getHttpAdapter().getInstance().set('trust proxy', 1)` (issue #16).

## 2. Frontend environment variables

| Variable | Where it's used | Example |
|---|---|---|
| `API_URL` | Server only (BFF route handlers `/api/auth/*`) | `https://hissabsync.onrender.com/api/v1` |
| `NEXT_PUBLIC_API_URL` | Browser (all other API calls), inlined **at build time** | `https://hissabsync.onrender.com/api/v1` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google sign-in button (empty = hidden) | `1234….apps.googleusercontent.com` |

`NEXT_PUBLIC_*` values are baked into the JS bundle during `next build`, so **redeploy after changing them**.

## 3. Vercel steps

1. Push this repo to GitHub.
2. Vercel → *Add New Project* → import the repo. Framework preset: **Next.js**. No build overrides are needed (`npm run build`).
3. Add the three environment variables above for *Production* (and *Preview* if used).
4. Deploy, then copy the production URL into the backend's `CORS_ORIGIN` and redeploy the backend.
5. Google sign-in: in Google Cloud Console → OAuth client → add the Vercel domain to **Authorized JavaScript origins**.
6. Run the manual QA checklist (`docs/07-manual-qa-checklist.md`) against production.

## 4. Things that depend on HTTPS

- Auth cookies (`hs_rt`, `hs_session`) are `Secure` in production, so **production must be served over HTTPS**. Plain HTTP (except `localhost`) will silently fail to keep users signed in.
- HSTS (`Strict-Transport-Security`) is sent in production builds.

## 5. Security headers (next.config.ts)

Sent on every route: `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy`, and HSTS in production. `X-Powered-By` is disabled.

**Follow-up: a full CSP.** It isn't enforced yet because it needs a browser pass with Google sign-in.
A starting point to try as `Content-Security-Policy-Report-Only` first:
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/client;
style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style;
frame-src https://accounts.google.com/gsi/;
connect-src 'self' https://hissabsync.onrender.com https://accounts.google.com/gsi/;
img-src 'self' data: https:;
font-src 'self';
frame-ancestors 'none'; base-uri 'self'; form-action 'self';
```
(`img-src https:` because profile pictures are arbitrary URLs.)

## 6. Render free tier cold starts

The backend sleeps after inactivity, and the first request can take ~30–60 s. The frontend handles this:
- The top banner ("Can't reach the server…") appears on network/502/503/504 errors, pings `/health` every 5 s, and refetches everything when the server is back.
- Session bootstrap shows a "Can't reach the server → Try again" screen instead of logging users out.
- `/status` is a public page that shows backend health (handy to wake it up).
