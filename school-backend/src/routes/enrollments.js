import express from 'express';
import {
  assignStudentToClass,
  createEnrollment,
  deleteEnrollment,
  getEnrollments,
} from '../controllers/enrollmentsController.js';
import { authenticate, requireAdmin, requireTeacherOrAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { assignByEmailSchema, createEnrollmentSchema } from '../validation/schemas.js';

const router = express.Router();

router.use(authenticate);

router.get('/', requireTeacherOrAdmin, getEnrollments);
router.post('/', requireAdmin, validate({ body: createEnrollmentSchema }), createEnrollment);
router.post('/assign', requireTeacherOrAdmin, validate({ body: assignByEmailSchema }), assignStudentToClass);
router.delete('/:id', requireAdmin, deleteEnrollment);

export default router;
