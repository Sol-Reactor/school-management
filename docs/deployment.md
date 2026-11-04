# Deployment

Haya is deployed as two services:

| Part | Host | Root dir |
| --- | --- | --- |
| Frontend (React + Vite) | Vercel | `school-frontend/` |
| API (Express + Prisma) | Render | `school-backend/` |
| Database | Render PostgreSQL (or any Postgres) | — |

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
- **Start command:** `npm run start:prod` (runs `prisma migrate deploy`, then starts the server)
- **Health check path:** `/health`

Environment variables:

| Variable | Required | Example / notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Render's internal Postgres URL |
| `JWT_SECRET` | yes | 32+ random chars — `openssl rand -hex 32`. Server refuses to start without it. |
| `NODE_ENV` | yes | `production` (enables `Secure` cookies) |
| `FRONTEND_URL` | yes | `https://manageschool-fawn.vercel.app` (comma-separate several) |
| `TRUST_PROXY` | yes | `2` — Vercel's proxy + Render's proxy, so rate limiting sees the real client IP |
| `JWT_EXPIRES_IN` | no | default `7d` |

### First deploy after this change: baseline the migrations

Earlier versions created the production schema with `prisma db push`, which doesn't record
migrations. If `prisma migrate deploy` fails with **P3005 (database schema is not empty)**,
mark the migrations that already match production as applied, once, from your machine:

```bash
cd school-backend
DATABASE_URL="<render external url>" npx prisma migrate resolve --applied 20251119060143_init
DATABASE_URL="<render external url>" npx prisma migrate resolve --applied 20251119122823_add_notifications
DATABASE_URL="<render external url>" npx prisma migrate deploy   # applies the newer migrations
```

## Vercel (frontend)

- **Root directory:** `school-frontend`
- **Build command:** `npm run build` · **Output:** `dist`
- Edit the `/api/:path*` destination in `vercel.json` to your Render URL.
- **Remove the old `VITE_API_URL` environment variable.** The app now calls `/api` on its own
  origin. (It reads `VITE_API_BASE`, which you should leave unset.)

## Free-tier cold starts

Render's free tier sleeps after ~15 minutes idle; the first request can take 30–60 seconds.
The frontend handles this: route guards and the sign-in page show a
"Waking up the server…" state with elapsed time, poll `/api/health`, and retry automatically.
