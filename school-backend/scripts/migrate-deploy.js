// Applies migrations on deploy (`npm run start:prod`).
//
// The production database was first created with `prisma db push`, so it has
// tables but no migration history, and a plain `prisma migrate deploy` fails with
// P3005. On that one occasion this script records the migrations whose tables
// already exist as applied (a "baseline"), then runs `migrate deploy` as usual.
// On a fresh database, or one that already has history, it changes nothing.
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

// Migrations that `db push` already covered, with a table each one creates.
const BASELINE = [
  { name: '20251119060143_init', table: 'User' },
  { name: '20251119122823_add_notifications', table: 'Notification' },
];

const prisma = (cmd) => {
  const result = spawnSync('npx', ['prisma', ...cmd], { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

const tableExists = async (db, name) => {
  const [{ exists }] = await db.$queryRaw`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ${name}
    ) AS "exists"`;
  return exists;
};

const db = new PrismaClient();
let toBaseline = [];
try {
  if (!(await tableExists(db, '_prisma_migrations'))) {
    for (const m of BASELINE) {
      if (await tableExists(db, m.table)) toBaseline.push(m.name);
      else break; // migrations are ordered: stop at the first one not yet applied
    }
  }
} finally {
  await db.$disconnect();
}

if (toBaseline.length) {
  console.log(`[migrate] Existing schema without migration history: baselining ${toBaseline.join(', ')}`);
  for (const name of toBaseline) prisma(['migrate', 'resolve', '--applied', name]);
}
prisma(['migrate', 'deploy']);

// SEED_DEMO=true refreshes the demo school on start (demo data only, idempotent).
// Useful on hosts without a shell; remove the variable afterwards to keep cold starts fast.
if (process.env.SEED_DEMO === 'true') {
  console.log('[migrate] SEED_DEMO=true: refreshing the demo school');
  const seed = spawnSync('node', ['prisma/seed.js'], { stdio: 'inherit' });
  if (seed.status !== 0) console.error('[migrate] Demo seed failed; starting the server anyway.');
}
