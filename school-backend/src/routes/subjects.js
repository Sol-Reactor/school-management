import express from 'express';
import {
  assignSubjectToClass,
  createSubject,
  deleteSubject,
  getSubjectById,
  getSubjects,
  updateSubject,
} from '../controllers/subjectsController.js';
import { authenticate, requireAdmin, requireTeacherOrAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  assignSubjectClassSchema,
  createSubjectSchema,
  updateSubjectSchema,
} from '../validation/schemas.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getSubjects);
router.get('/:id', getSubjectById);
router.post('/', requireTeacherOrAdmin, validate({ body: createSubjectSchema }), createSubject);
router.put('/:id', requireTeacherOrAdmin, validate({ body: updateSubjectSchema }), updateSubject);
router.delete('/:id', requireAdmin, deleteSubject);
router.patch(
  '/:id/assign-class',
  requireTeacherOrAdmin,
  validate({ body: assignSubjectClassSchema }),
  assignSubjectToClass
);

export default router;
