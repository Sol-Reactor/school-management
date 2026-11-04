import express from 'express';
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from '../controllers/usersController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createUserSchema, listUsersQuery, updateUserSchema } from '../validation/schemas.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', validate({ query: listUsersQuery }), getUsers);
router.post('/', validate({ body: createUserSchema }), createUser);
router.get('/:id', getUserById);
router.put('/:id', validate({ body: updateUserSchema }), updateUser);
router.delete('/:id', deleteUser);

export default router;
