import express from 'express';
import { explainRisk, generateSummary, getAtRisk, getSummary } from '../controllers/insightsController.js';
import { allowDemoWrite, authenticate, requireTeacherOrAdmin } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import { generateInsightSchema } from '../validation/schemas.js';

const router = express.Router();

// Per-student access is enforced in the controller with the same rules as the data.
router.get('/students/:id/summary', authenticate, getSummary);
// Demo accounts may call the generators: they get canned responses (no API call).
router.post('/students/:id/summary', allowDemoWrite, authenticate, aiLimiter, validate({ body: generateInsightSchema }), generateSummary);

router.get('/at-risk', authenticate, requireTeacherOrAdmin, getAtRisk);
router.post('/at-risk/:studentId/explain', allowDemoWrite, authenticate, requireTeacherOrAdmin, aiLimiter, validate({ body: generateInsightSchema }), explainRisk);

export default router;
