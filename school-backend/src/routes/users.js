import express from 'express';
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/usersController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, requireAdmin, getUsers);
router.get('/:id', authenticate, requireAdmin, getUserById);
router.put('/:id', authenticate, requireAdmin, updateUser);
router.delete('/:id', authenticate, requireAdmin, deleteUser);

export default router;