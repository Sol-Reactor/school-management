// Centralised, validated configuration. Importing this module loads .env and
// fails fast (process exit) if anything required is missing or unsafe, so the
// server can never boot with a guessable JWT secret.
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z
    .string({ error: 'JWT_SECRET is required' })
    .min(32, 'JWT_SECRET must be at least 32 characters (use `openssl rand -hex 32`)'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  // Comma-separated list of browser origins allowed to call the API.
  FRONTEND_URL: z.string().default(''),
  // Number of reverse proxies in front of Express (Render = 1, Vercel rewrite + Render = 2).
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const env = parsed.data;

export const config = {
  ...env,
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  allowedOrigins: env.FRONTEND_URL.split(',').map((s) => s.trim()).filter(Boolean),
};

export default config;
