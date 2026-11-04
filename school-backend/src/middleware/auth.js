// Authentication + coarse role authorisation.
// Fine-grained "does this user own this record" checks live in lib/access.js.
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import prisma from '../lib/prisma.js';
import { forbidden, unauthorized } from '../lib/errors.js';

export const SESSION_COOKIE = 'haya_session';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const parseDuration = (value) => {
  const m = /^(\d+)([smhd])$/.exec(value);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const unit = { s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[m[2]];
  return Number(m[1]) * unit;
};

export const cookieOptions = {
  httpOnly: true, // not readable from JavaScript → immune to token theft via XSS
  secure: config.isProd, // HTTPS only in production
  sameSite: 'lax', // first-party via the Vercel /api proxy; blocks cross-site POSTs
  path: '/',
  maxAge: parseDuration(config.JWT_EXPIRES_IN),
};

export const signSession = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });

export const setSessionCookie = (res, user) => {
  res.cookie(SESSION_COOKIE, signSession(user), cookieOptions);
};

export const clearSessionCookie = (res) => {
  const { maxAge: _maxAge, ...opts } = cookieOptions;
  res.clearCookie(SESSION_COOKIE, opts);
};

const readToken = (req) => {
  if (req.cookies?.[SESSION_COOKIE]) return req.cookies[SESSION_COOKIE];
  // Bearer tokens are still accepted for API clients and tests.
  // Browsers never attach these automatically, so they are not a CSRF vector.
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
};

/** Requires a valid session; attaches `req.user` with profile ids. */
export const authenticate = async (req, res, next) => {
  const token = readToken(req);
  if (!token) throw unauthorized('Please sign in to continue');

  let payload;
  try {
    payload = jwt.verify(token, config.JWT_SECRET);
  } catch (err) {
    clearSessionCookie(res);
    throw unauthorized(err.name === 'TokenExpiredError' ? 'Your session has expired' : 'Invalid session');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isDemo: true,
      student: { select: { id: true, classId: true } },
      teacher: { select: { id: true } },
      parent: { select: { id: true } },
    },
  });

  if (!user) {
    clearSessionCookie(res);
    throw unauthorized('Account no longer exists');
  }

  // Demo accounts are read-only. Routes can opt out (e.g. AI, which returns
  // canned responses for demo users) by setting req.allowDemoWrite first.
  if (user.isDemo && !SAFE_METHODS.has(req.method) && !req.allowDemoWrite) {
    throw forbidden('This is a read-only demo account. Changes are disabled.');
  }

  req.user = user;
  next();
};

/** Marks the following handlers as safe for demo accounts to call. */
export const allowDemoWrite = (req, res, next) => {
  req.allowDemoWrite = true;
  next();
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) throw unauthorized();
  if (!roles.includes(req.user.role)) {
    throw forbidden(`This action requires one of these roles: ${roles.join(', ')}`);
  }
  next();
};

export const requireAdmin = authorize('ADMIN');
export const requireTeacher = authorize('TEACHER');
export const requireStudent = authorize('STUDENT');
export const requireParent = authorize('PARENT');
export const requireTeacherOrAdmin = authorize('TEACHER', 'ADMIN');
