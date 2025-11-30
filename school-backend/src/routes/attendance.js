import express from 'express';
import {
  getAttendance,
  getAttendanceById,
  markAttendance,
  updateAttendance,
  getStudentAttendance,
  getClassAttendance
} from '../controllers/attendanceController.js';
import {
  authenticate,
  requireTeacherOrAdmin,
  requireOwnership,
  requireClassOwnership
} from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, requireTeacherOrAdmin, getAttendance);
router.get('/student/:studentId', authenticate, requireOwnership('student'), getStudentAttendance);
router.get('/class/:classId', authenticate, requireClassOwnership, getClassAttendance);
router.get('/:id', authenticate, requireOwnership('attendance'), getAttendanceById);
router.post('/', authenticate, requireTeacherOrAdmin, markAttendance);
router.put('/:id', authenticate, requireTeacherOrAdmin, updateAttendance);

export default router;