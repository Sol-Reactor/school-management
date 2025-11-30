import express from 'express';
import {
  getParents,
  getParentById,
  getParentChildren
} from '../controllers/parentsController.js';
import {
  authenticate,
  requireAdmin,
  requireParent,
  authorize
} from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, requireAdmin, getParents);
// Parents can view their own profile, admins can view any
router.get('/:id', authenticate, authorize('PARENT', 'ADMIN'), getParentById);
// Only parents can view their children
router.get('/:id/children', authenticate, requireParent, getParentChildren);

export default router;