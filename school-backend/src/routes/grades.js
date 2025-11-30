import express from 'express';
import {
  getGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
  getStudentGrades,
  getExamGrades
} from '../controllers/gradesController.js';
import {
  authenticate,
  requireTeacherOrAdmin,
  requireOwnership
} from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, requireTeacherOrAdmin, getGrades);
router.get('/student/:studentId', authenticate, requireOwnership('student'), getStudentGrades);
router.get('/exam/:examId', authenticate, requireTeacherOrAdmin, getExamGrades);
router.get('/:id', authenticate, requireOwnership('grade'), getGradeById);
router.post('/', authenticate, requireTeacherOrAdmin, createGrade);
router.put('/:id', authenticate, requireTeacherOrAdmin, updateGrade);
router.delete('/:id', authenticate, requireTeacherOrAdmin, deleteGrade);

export default router;