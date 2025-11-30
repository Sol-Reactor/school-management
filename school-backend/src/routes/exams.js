import express from 'express';
import {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getClassExams
} from '../controllers/examsController.js';
import {
  authenticate,
  requireTeacherOrAdmin,
  requireClassMembership
} from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getExams);
router.get('/class/:classId', authenticate, requireClassMembership, getClassExams);
router.get('/:id', authenticate, getExamById);
router.post('/', authenticate, requireTeacherOrAdmin, createExam);
router.put('/:id', authenticate, requireTeacherOrAdmin, updateExam);
router.delete('/:id', authenticate, requireTeacherOrAdmin, deleteExam);

export default router;