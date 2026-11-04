import express from 'express';
import {
  createGrade,
  deleteGrade,
  getExamGrades,
  getGradeById,
  getGrades,
  getStudentGrades,
  updateGrade,
} from '../controllers/gradesController.js';
import { authenticate, requireTeacherOrAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createGradeSchema, listGradesQuery, updateGradeSchema } from '../validation/schemas.js';

const router = express.Router();

router.use(authenticate);

router.get('/', requireTeacherOrAdmin, validate({ query: listGradesQuery }), getGrades);
router.get('/student/:studentId', getStudentGrades);
router.get('/exam/:examId', requireTeacherOrAdmin, getExamGrades);
router.get('/:id', getGradeById);
router.post('/', requireTeacherOrAdmin, validate({ body: createGradeSchema }), createGrade);
router.put('/:id', requireTeacherOrAdmin, validate({ body: updateGradeSchema }), updateGrade);
router.delete('/:id', requireTeacherOrAdmin, deleteGrade);

export default router;
