import express from 'express';
import {
  assignToClass,
  assignToParent,
  getStudentById,
  getStudents,
} from '../controllers/studentsController.js';
import { authenticate, requireAdmin, requireTeacherOrAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { assignClassSchema, assignParentSchema, listStudentsQuery } from '../validation/schemas.js';

const router = express.Router();

router.use(authenticate);

router.get('/', requireTeacherOrAdmin, validate({ query: listStudentsQuery }), getStudents);
// Access to a single student is checked per-record in the controller (lib/access.js).
router.get('/:id', getStudentById);
router.patch('/:id/class', requireAdmin, validate({ body: assignClassSchema }), assignToClass);
router.patch('/:id/parent', requireAdmin, validate({ body: assignParentSchema }), assignToParent);

export default router;
