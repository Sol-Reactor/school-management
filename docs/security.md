# Security decisions

## Accounts and roles

- **Public sign-up creates only `STUDENT` or `PARENT` accounts.** The zod schema for
  `POST /api/auth/register` rejects any other role, so it can't be bypassed by calling the
  API directly.
- **`TEACHER` and `ADMIN` accounts are created by an admin** via `POST /api/users`.
- The first admin is created from the command line with `npm run reset-admin-password`,
  which reads the email/password from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (or `--email` /
  `--password`), rejects weak passwords and never prints the password.

## Sessions

- Sessions are JWTs in an **httpOnly, `SameSite=Lax`, `Secure` (in production) cookie**.
  JavaScript never sees the token, so an XSS bug can't exfiltrate it.
- The frontend reaches the API through a same-origin `/api` proxy (Vercel rewrite in
  production, Vite proxy in development), which keeps the cookie first-party.
- The JWT holds only `sub` (user id) and `role`. Every request re-loads the user from the
  database, so deleted accounts lose access immediately.
- `JWT_SECRET` must be at least 32 characters; the server exits at startup otherwise. There
  is no fallback secret.
- `Authorization: Bearer` tokens are still accepted for API clients and tests. Browsers
  never send these automatically, so they aren't a CSRF vector.

## CSRF

- `SameSite=Lax` stops cross-site `POST`/`PUT`/`DELETE` requests from carrying the cookie.
- As a second layer, `originGuard` rejects state-changing requests whose `Origin` header
  isn't an allowed frontend origin.

## Authorization

All "who may see what" rules live in one module, `school-backend/src/lib/access.js`:

| Role | Can access |
| --- | --- |
| Admin | everything |
| Teacher | classes they teach and the students in them (via `classId` or enrollments) |
| Student | themselves and their own class |
| Parent | their own children and those children's classes |

List endpoints apply these rules as Prisma `where` scopes. Detail endpoints call
`assertCanViewStudent`, `assertCanManageClass`, `assertCanManageExam`, and so on. See
[api.md](api.md) for the per-endpoint rules.

## Abuse protection

- **Login:** 10 failed attempts per 15 minutes per IP and email (successful logins don't
  count).
- **Registration:** 10 per hour per IP.
- **All other `/api/auth` routes:** 100 per 15 minutes.
- Login does a dummy bcrypt comparison for unknown emails, so response time doesn't reveal
  which accounts exist.
- Request bodies are limited to 100 kB, and every create/update route is validated with zod.

## Demo accounts

Seeded demo users have `isDemo = true`. The `authenticate` middleware rejects any
non-GET request from a demo user with `403`, so the public demo can't be vandalised.

## Logging

Logs never include passwords, tokens, or per-request user emails. Unexpected errors are
logged server-side with a stack trace. Clients get a generic `500` message.
