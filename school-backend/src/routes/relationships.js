import express from 'express';
import {
  linkStudentToParent,
  unlinkStudentFromParent,
  getStudentParents,
  getParentStudents
} from '../controllers/relationshipsController.js';
import {
  authenticate,
  requireOwnership,
  authorize
} from '../middleware/auth.js';

const router = express.Router();

// Student can link themselves to a parent
router.post('/students/:studentId/parents', 
  authenticate, 
  requireOwnership('student'), 
  linkStudentToParent
);

// Student/Parent can unlink relationship
router.delete('/students/:studentId/parents/:parentId', 
  authenticate, 
  authorize('STUDENT', 'PARENT', 'ADMIN'), 
  unlinkStudentFromParent
);

// Get student's parents
router.get('/students/:studentId/parents', 
  authenticate, 
  requireOwnership('student'), 
  getStudentParents
);

// Get parent's students
router.get('/parents/:parentId/students', 
  authenticate, 
  requireOwnership('parent'), 
  getParentStudents
);

export default router;