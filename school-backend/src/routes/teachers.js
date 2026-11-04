import express from 'express';
import {
  getTeacherById,
  getTeacherClasses,
  getTeachers,
  getTeacherStudents,
} from '../controllers/teachersController.js';
import { authenticate, requireAdmin, requireTeacherOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', requireAdmin, getTeachers);
// The controller restricts these to the teacher themself or an admin.
router.get('/:id', requireTeacherOrAdmin, getTeacherById);
router.get('/:id/classes', requireTeacherOrAdmin, getTeacherClasses);
router.get('/:id/students', requireTeacherOrAdmin, getTeacherStudents);

export default router;
