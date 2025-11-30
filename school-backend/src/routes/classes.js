import express from 'express';
import {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassStudents,
  getClassSubjects
} from '../controllers/classesController.js';
import {
  authenticate,
  requireAdmin,
  requireTeacherOrAdmin,
  requireClassOwnership,
  requireClassMembership
} from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getClasses);
router.get('/:id', authenticate, requireClassMembership, getClassById);
router.post('/', authenticate, requireTeacherOrAdmin, createClass);
router.put('/:id', authenticate, requireTeacherOrAdmin, requireClassOwnership, updateClass);
router.delete('/:id', authenticate, requireAdmin, deleteClass);
router.get('/:id/students', authenticate, requireClassMembership, getClassStudents);
router.get('/:id/subjects', authenticate, requireClassMembership, getClassSubjects);

export default router;