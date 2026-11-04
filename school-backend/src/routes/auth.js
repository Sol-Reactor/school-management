import express from 'express';
import {
  demoLogin,
  getProfile,
  login,
  logout,
  register,
  updateProfile,
} from '../controllers/authController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { authLimiter, demoLimiter, loginLimiter, registerLimiter } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import {
  demoLoginSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from '../validation/schemas.js';

const router = express.Router();

// Credential and account-creation endpoints are rate limited. The session check
// (GET /profile) is not: it runs on every page load and is already authenticated,
// so limiting it would only lock out real users who share an IP (school networks).
router.post('/register', authLimiter, registerLimiter, validate({ body: registerSchema }), register);
router.post('/login', authLimiter, validate({ body: loginSchema }), loginLimiter, login);
router.post('/demo', demoLimiter, validate({ body: demoLoginSchema }), demoLogin);
router.post('/logout', logout);
router.get('/profile', authenticate, getProfile);
// Session check for app start-up: 200 with { user: null } for visitors, so a
// signed-out landing page doesn't log a 401 in the console.
router.get('/session', optionalAuthenticate, (req, res, next) => (req.user ? getProfile(req, res, next) : res.json({ user: null })));
router.put('/profile', authLimiter, authenticate, validate({ body: updateProfileSchema }), updateProfile);

export default router;
