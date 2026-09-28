# HisaabSync — Web Frontend

Next.js frontend for **HisaabSync**, a room-based shared-treasury expense manager.
The backend (NestJS REST API) lives in a separate repo: `HisaabSync`.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_URL at your backend
npm run dev                        # http://localhost:3001
```

The backend must be running (default `http://localhost:3000/api/v1`) or you can use the live API
`https://hissabsync.onrender.com/api/v1`. `/status` shows backend connectivity.

## Features

Rooms with a shared treasury · contributions and expenses with approval workflows · automatic
reimbursements and payouts (strict or flexible balance) · immutable ledger with filters · approvals
inbox · members, roles, join/leave requests · activity timeline and admin audit log · notifications
· light/dark mode · mobile-friendly.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on port 3001 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate Next route types + `tsc --noEmit` |
| `npm run format` | Prettier with Tailwind class sorting |

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · TanStack Query · React Hook Form + Zod · decimal.js-light.

## Documentation

- `CLAUDE.md` — project rules and session protocol
- `PROGRESS.md` — current build state
- `docs/01-backend-api-reference.md` — every API endpoint and response shape
- `docs/02-domain-and-relationships.md` — entities, roles, state machines
- `docs/03-frontend-architecture.md` — architecture and conventions
- `docs/04-implementation-roadmap.md` — phased plan
- `docs/05-backend-known-issues.md` — backend bugs that affect the UI
- `docs/06-deployment.md` — deploying to Vercel and backend prerequisites
- `docs/07-manual-qa-checklist.md` — browser QA checklist
