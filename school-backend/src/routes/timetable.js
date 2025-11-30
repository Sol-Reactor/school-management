import express from 'express';
import {
  getTimetable,
  getTimetableById,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  getClassTimetable,
  getTeacherTimetable
} from '../controllers/timetableController.js';
import {
  authenticate,
  requireTeacherOrAdmin,
  requireClassMembership
} from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getTimetable);
router.get('/class/:classId', authenticate, requireClassMembership, getClassTimetable);
router.get('/teacher/:teacherId', authenticate, requireTeacherOrAdmin, getTeacherTimetable);
router.get('/:id', authenticate, getTimetableById);
router.post('/', authenticate, requireTeacherOrAdmin, createTimetable);
router.put('/:id', authenticate, requireTeacherOrAdmin, updateTimetable);
router.delete('/:id', authenticate, requireTeacherOrAdmin, deleteTimetable);

export default router;