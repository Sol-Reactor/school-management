import express from 'express';
import {
  createTimetable,
  deleteTimetable,
  getClassTimetable,
  getTeacherTimetable,
  getTimetable,
  getTimetableById,
  updateTimetable,
} from '../controllers/timetableController.js';
import { authenticate, requireTeacherOrAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTimetableSchema,
  listTimetableQuery,
  updateTimetableSchema,
} from '../validation/schemas.js';

const router = express.Router();

router.use(authenticate);

router.get('/', validate({ query: listTimetableQuery }), getTimetable);
router.get('/class/:classId', getClassTimetable);
router.get('/teacher/:teacherId', requireTeacherOrAdmin, getTeacherTimetable);
router.get('/:id', getTimetableById);
router.post('/', requireTeacherOrAdmin, validate({ body: createTimetableSchema }), createTimetable);
router.put('/:id', requireTeacherOrAdmin, validate({ body: updateTimetableSchema }), updateTimetable);
router.delete('/:id', requireTeacherOrAdmin, deleteTimetable);

export default router;
