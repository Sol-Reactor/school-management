// Creates an admin account, or resets the password of an existing one.
//
// Usage (values are never printed):
//   ADMIN_EMAIL=you@school.org ADMIN_PASSWORD='a-long-passphrase' npm run reset-admin-password
//   npm run reset-admin-password -- --email you@school.org --password 'a-long-passphrase'
//
// Prefer the env-var form: CLI arguments can end up in shell history.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
};

const email = (arg('email') ?? process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
const password = arg('password') ?? process.env.ADMIN_PASSWORD ?? '';
const fullName = arg('name') ?? process.env.ADMIN_NAME ?? 'Administrator';

const COMMON = ['password', 'password123', 'admin', 'admin123', 'qwerty', '12345678', 'letmein'];

function weakPasswordReason(pw) {
  if (pw.length < 12) return 'must be at least 12 characters';
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw)) return 'must mix upper- and lower-case letters';
  if (!/\d/.test(pw)) return 'must contain a number';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'must contain a symbol';
  if (COMMON.some((c) => pw.toLowerCase().includes(c))) return 'is too common';
  if (pw.toLowerCase().includes(email.split('@')[0])) return 'must not contain the email name';
  return null;
}

async function main() {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Provide a valid admin email via ADMIN_EMAIL or --email.');
    process.exit(1);
  }
  const reason = weakPasswordReason(password);
  if (reason) {
    console.error(`Refusing weak password: it ${reason}.`);
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const hash = await bcrypt.hash(password, 12);
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });

    if (existing && existing.role !== 'ADMIN') {
      console.error('That email belongs to a non-admin account. Aborting.');
      process.exit(1);
    }

    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { password: hash } });
      console.log(`Password reset for admin ${email}.`);
    } else {
      await prisma.user.create({ data: { email, password: hash, fullName, role: 'ADMIN' } });
      console.log(`Admin account created for ${email}.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Failed to reset admin password:', err.message);
  process.exit(1);
});
