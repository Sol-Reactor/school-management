import express from 'express';
import { getParentById, getParentChildren, getParents } from '../controllers/parentsController.js';
import { authenticate, authorize, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', requireAdmin, getParents);
// The controller restricts these to the parent themself or an admin.
router.get('/:id', authorize('PARENT', 'ADMIN'), getParentById);
router.get('/:id/children', authorize('PARENT', 'ADMIN'), getParentChildren);

export default router;
