import express from 'express';
import {
  createClass,
  deleteClass,
  getClassById,
  getClasses,
  getClassStudents,
  getClassSubjects,
  updateClass,
} from '../controllers/classesController.js';
import { authenticate, requireAdmin, requireTeacherOrAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createClassSchema, updateClassSchema } from '../validation/schemas.js';

const router = express.Router();

router.use(authenticate);

// Per-class access (view vs. manage) is enforced in the controller via lib/access.js.
router.get('/', getClasses);
router.post('/', requireTeacherOrAdmin, validate({ body: createClassSchema }), createClass);
router.get('/:id', getClassById);
router.put('/:id', requireTeacherOrAdmin, validate({ body: updateClassSchema }), updateClass);
router.delete('/:id', requireAdmin, deleteClass);
router.get('/:id/students', requireTeacherOrAdmin, getClassStudents);
router.get('/:id/subjects', getClassSubjects);

export default router;
