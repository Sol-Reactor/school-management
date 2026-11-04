import express from 'express';
import {
  createExam,
  deleteExam,
  getClassExams,
  getExamById,
  getExams,
  updateExam,
} from '../controllers/examsController.js';
import { authenticate, requireTeacherOrAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createExamSchema, listExamsQuery, updateExamSchema } from '../validation/schemas.js';

const router = express.Router();

router.use(authenticate);

router.get('/', validate({ query: listExamsQuery }), getExams);
router.get('/class/:classId', getClassExams);
router.get('/:id', getExamById);
router.post('/', requireTeacherOrAdmin, validate({ body: createExamSchema }), createExam);
router.put('/:id', requireTeacherOrAdmin, validate({ body: updateExamSchema }), updateExam);
router.delete('/:id', requireTeacherOrAdmin, deleteExam);

export default router;
