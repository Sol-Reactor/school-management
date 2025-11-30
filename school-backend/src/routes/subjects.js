import express from 'express';
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  assignSubjectToClass
} from '../controllers/subjectsController.js';
import {
  authenticate,
  requireAdmin,
  requireTeacherOrAdmin
} from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getSubjects);
router.get('/:id', authenticate, getSubjectById);
router.post('/', authenticate, requireTeacherOrAdmin, createSubject);
router.put('/:id', authenticate, requireTeacherOrAdmin, updateSubject);
router.delete('/:id', authenticate, requireAdmin, deleteSubject);
router.patch('/:id/assign-class', authenticate, requireTeacherOrAdmin, assignSubjectToClass);

export default router;