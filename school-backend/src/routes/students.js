import express from 'express';
import {
  getStudents,
  getStudentById,
  updateStudent,
  assignToClass,
  assignToParent
} from '../controllers/studentsController.js';
import {
  authenticate,
  requireAdmin,
  requireTeacherOrAdmin,
  authorize
} from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, requireTeacherOrAdmin, getStudents);
// Students can view their own profile, teachers/parents/admins can view others
router.get('/:id', authenticate, authorize('STUDENT', 'TEACHER', 'PARENT', 'ADMIN'), getStudentById);
// Only students can update their own profile
router.put('/:id', authenticate, requireAdmin, updateStudent); // Usually admin only for updates
router.patch('/:id/class', authenticate, requireAdmin, assignToClass);
router.patch('/:id/parent', authenticate, requireAdmin, assignToParent);

export default router;