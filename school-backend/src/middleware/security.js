import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import config from '../config/env.js';

const json429 = (message) => (req, res) => res.status(429).json({ message });

const isAllowedOrigin = (origin) => {
  if (config.allowedOrigins.includes(origin)) return true;
  if (!config.isProd && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return true;
  return false;
};

/** Options for the `cors` package. */
export const corsOptions = {
  origin(origin, callback) {
    // Same-origin requests (via the Vercel/Vite proxy) and server-to-server calls have no Origin.
    if (!origin || isAllowedOrigin(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

/**
 * CSRF defence in depth. The session cookie is SameSite=Lax, which already
 * stops cross-site POSTs from carrying it; additionally reject any
 * state-changing request whose Origin header is present but not ours.
 */
export const originGuard = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin)) {
    return res.status(403).json({ message: 'Cross-origin request blocked' });
  }
  next();
};

const skip = () => config.isTest && process.env.ENABLE_RATE_LIMIT_IN_TESTS !== 'true';

// Login: key on IP + email so one attacker can't lock out a whole proxy egress IP,
// and one account can't be brute-forced from many requests.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip)}:${String(req.body?.email ?? '').toLowerCase().slice(0, 254)}`,
  handler: json429('Too many sign-in attempts. Please wait 15 minutes and try again.'),
  skip,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: json429('Too many accounts created from this network. Please try again later.'),
  skip,
});

// Demo sign-ins: generous enough for someone hopping between all four roles,
// tight enough that a script can't hammer the database.
export const demoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: json429('Too many demo sign-ins from this network. Please wait a few minutes.'),
  skip,
});

// General ceiling for credential endpoints (login, register, profile updates).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: json429('Too many requests. Please slow down.'),
  skip,
});

// AI generation, per signed-in user (runs after authenticate). Demo users only get
// canned text, so they have a looser ceiling.
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: (req) => (req.user?.isDemo ? 60 : 20),
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip)),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ code: 'AI_RATE_LIMITED', message: 'You have generated a lot of insights this hour. Please try again later.' }),
  skip,
});
