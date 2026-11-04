# Deployment

Haya is deployed as two services:

| Part | Host | Root dir |
| --- | --- | --- |
| Frontend (React + Vite) | Vercel | `school-frontend/` |
| API (Express + Prisma) | Render | `school-backend/` |
| Database | Neon PostgreSQL (or any Postgres 14+) | — |

## How requests flow

The browser only ever talks to the Vercel origin. `school-frontend/vercel.json` rewrites
`/api/*` to the Render service, so the session cookie is **first-party** and can use
`SameSite=Lax` (cross-site cookies are increasingly blocked by browsers).

```
Browser ──► https://<app>.vercel.app/api/... ──(Vercel rewrite)──► https://<service>.onrender.com/api/...
```

All other paths rewrite to `index.html`, so deep links like `/dashboard` work on refresh.

## Render (API)

Settings (also captured in `render.yaml`):

- **Build command:** `npm install && npm run build` (runs `prisma generate`)
- **Start command:** `npm start` or `npm run start:prod` (both apply migrations via `scripts/migrate-deploy.js`, then start the server)
- **Health check path:** `/health`

Environment variables:

| Variable | Required | Example / notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon connection string (direct, not `-pooler`) |
| `JWT_SECRET` | yes | 32+ random chars — `openssl rand -hex 32`. Server refuses to start without it. |
| `NODE_ENV` | yes | `production` (enables `Secure` cookies) |
| `FRONTEND_URL` | yes | `https://manageschool-fawn.vercel.app` (comma-separate several) |
| `TRUST_PROXY` | yes | `2` — Vercel's proxy + Render's proxy, so rate limiting sees the real client IP |
| `ANTHROPIC_API_KEY` | for AI | Enables Haya Insights for real accounts (demo accounts never use it) |
| `ANTHROPIC_MODEL` | no | default `claude-opus-5-5` |
| `DEMO_PASSWORD` | no | password for the seeded demo accounts (default `HayaDemo#2026`) |
| `JWT_EXPIRES_IN` | no | default `7d` |

### Demo data

The one-click demo needs the demo school. After the first successful deploy, seed it once
from your machine (it only creates or replaces `@demo.haya.app` data and is safe to re-run):

```bash
cd school-backend
DATABASE_URL="<neon url>" npm run db:seed
```

### Migrations and the one-time baseline

`npm run start:prod` runs [`scripts/migrate-deploy.js`](../school-backend/scripts/migrate-deploy.js)
before starting the server. The production database (Neon) was originally created with
`prisma db push`, which leaves tables but no migration history, so a plain
`prisma migrate deploy` would fail with **P3005**. On that first deploy the script marks the
migrations whose tables already exist (`init`, `add_notifications`) as applied, then runs
`migrate deploy` for everything newer. On a fresh database, or one with history, it only runs
`migrate deploy`. Nothing has to be run by hand.

Use Neon's **direct** connection string (host without `-pooler`) for `DATABASE_URL`:
migrations need it.

## Vercel (frontend)

- **Root directory:** `school-frontend`
- **Build command:** `npm run build` · **Output:** `dist`
- `vercel.json` rewrites `/api/:path*` to `https://school-management-hhzr.onrender.com` — update it if the Render URL changes.
- **Remove the old `VITE_API_URL` environment variable.** The app now calls `/api` on its own
  origin. (It reads `VITE_API_BASE`, which you should leave unset.)

## Free-tier cold starts

Render's free tier sleeps after ~15 minutes idle; the first request can take 30–60 seconds.
The frontend handles this: route guards and the sign-in page show a
"Waking up the server…" state with elapsed time, poll `/api/health`, and retry automatically.
