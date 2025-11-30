import express from 'express';
import {
  getTeachers,
  getTeacherById,
  getTeacherClasses,
  getTeacherStudents
} from '../controllers/teachersController.js';
import {
  authenticate,
  requireAdmin,
  requireTeacher,
  authorize
} from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, requireAdmin, getTeachers);
// Teachers can view their own profile, admins can view any
router.get('/:id', authenticate, authorize('TEACHER', 'ADMIN'), getTeacherById);
router.get('/:id/classes', authenticate, requireTeacher, getTeacherClasses);
router.get('/:id/students', authenticate, requireTeacher, getTeacherStudents);

export default router;