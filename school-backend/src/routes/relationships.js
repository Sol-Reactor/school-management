import express from 'express';
import {
  getParentStudents,
  getStudentParents,
  linkStudentToParent,
  unlinkStudentFromParent,
} from '../controllers/relationshipsController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { linkParentSchema } from '../validation/schemas.js';

const router = express.Router();

router.use(authenticate);

// Ownership is checked in the controller via lib/access.js.
router.post('/students/:studentId/parents', validate({ body: linkParentSchema }), linkStudentToParent);
router.delete('/students/:studentId/parents/:parentId', unlinkStudentFromParent);
router.get('/students/:studentId/parents', getStudentParents);
router.get('/parents/:parentId/students', getParentStudents);

export default router;
