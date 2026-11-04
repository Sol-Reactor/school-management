import express from 'express';
import {
  getAttendance,
  getAttendanceById,
  getClassAttendance,
  getStudentAttendance,
  markAttendance,
  updateAttendance,
} from '../controllers/attendanceController.js';
import { authenticate, requireTeacherOrAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  dateRangeQuery,
  listAttendanceQuery,
  markAttendanceSchema,
  updateAttendanceSchema,
} from '../validation/schemas.js';

const router = express.Router();

router.use(authenticate);

router.get('/', requireTeacherOrAdmin, validate({ query: listAttendanceQuery }), getAttendance);
router.get('/student/:studentId', validate({ query: dateRangeQuery }), getStudentAttendance);
router.get('/class/:classId', requireTeacherOrAdmin, validate({ query: dateRangeQuery }), getClassAttendance);
router.get('/:id', getAttendanceById);
router.post('/', requireTeacherOrAdmin, validate({ body: markAttendanceSchema }), markAttendance);
router.put('/:id', requireTeacherOrAdmin, validate({ body: updateAttendanceSchema }), updateAttendance);

export default router;
