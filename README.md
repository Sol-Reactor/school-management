# Haya: school management

A full-stack school management system with four roles (**Admin, Teacher, Student,
Parent**): classes, enrollment, attendance, exams, grades, timetables and notifications.

**Live:** https://manageschool-fawn.vercel.app

| Layer | Stack |
| --- | --- |
| Frontend | React 19, Vite, Redux Toolkit, Tailwind CSS 3 (`school-frontend/`, deployed on Vercel) |
| Backend | Express 5, Prisma 6, PostgreSQL, zod (`school-backend/`, deployed on Render) |

## Local setup

Prerequisites: Node 18 or newer, plus Docker (or any PostgreSQL 14+).

```bash
# 1. Database (Postgres on localhost:5433)
docker compose up -d

# 2. API
cd school-backend
cp .env.example .env            # then set JWT_SECRET (openssl rand -hex 32)
npm install
npx prisma migrate deploy
npm run reset-admin-password -- --email you@example.com --password 'A-Strong#Passphrase1'
npm run dev                     # http://localhost:5000

# 3. Web app (in another terminal)
cd school-frontend
npm install
npm run dev                     # http://localhost:5173, with /api proxied to :5000
```

### Environment variables

**Backend (`school-backend/.env`):**

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | 32+ characters. The server won't start without it |
| `FRONTEND_URL` | prod | Allowed browser origin(s), comma-separated |
| `NODE_ENV` | prod | `production` enables Secure cookies |
| `TRUST_PROXY` | prod | Number of proxies in front of the API (`2` on Vercel + Render) |
| `JWT_EXPIRES_IN` | no | Session length, default `7d` |

**Frontend:** nothing is required. The app calls `/api` on its own origin.

## Scripts

| Where | Command | What it does |
| --- | --- | --- |
| backend | `npm run dev` | API with auto-reload |
| backend | `npm run start:prod` | apply migrations, then start (used on Render) |
| backend | `npm run reset-admin-password` | create or reset an admin from env vars or CLI args |
| frontend | `npm run dev` / `build` / `lint` | Vite dev server, production build, ESLint |

## Documentation

- [docs/api.md](docs/api.md): endpoints, access rules and the error format
- [docs/security.md](docs/security.md): auth, sessions, CSRF, rate limiting, demo accounts
- [docs/deployment.md](docs/deployment.md): Render and Vercel setup, migration baselining, cold starts
