import express from 'express';
import {
  demoLogin,
  getProfile,
  login,
  logout,
  register,
  updateProfile,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter, loginLimiter, registerLimiter } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import {
  demoLoginSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from '../validation/schemas.js';

const router = express.Router();

router.use(authLimiter);

router.post('/register', registerLimiter, validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), loginLimiter, login);
router.post('/demo', validate({ body: demoLoginSchema }), demoLogin);
router.post('/logout', logout);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, validate({ body: updateProfileSchema }), updateProfile);

export default router;
