import express from 'express';
import {
  getEnrollments,
  createEnrollment,
  deleteEnrollment,
  assignStudentToClass
} from '../controllers/enrollmentsController.js';
import {
  authenticate,
  requireAdmin,
  requireTeacherOrAdmin
} from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, requireTeacherOrAdmin, getEnrollments);
router.post('/', authenticate, requireAdmin, createEnrollment);
router.post('/assign', authenticate, requireTeacherOrAdmin, assignStudentToClass);
router.delete('/:id', authenticate, requireAdmin, deleteEnrollment);

export default router;