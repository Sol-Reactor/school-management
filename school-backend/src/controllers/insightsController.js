// Haya Insights: AI progress summaries and at-risk explanations.
//
// Access follows the data rules exactly (lib/access.js): parents only their own
// children, teachers only students in their classes, students only themselves,
// admins everyone (demo admins: the demo school).
import prisma from '../lib/prisma.js';
import { conflict, notFound } from '../lib/errors.js';
import { assertCanViewStudent } from '../lib/access.js';
import { AiError, aiConfigured, aiModel, streamCompletion } from '../ai/client.js';
import { buildStudentSnapshot, inputHash, MIN_DATA_POINTS } from '../ai/studentSnapshot.js';
import { findAtRiskStudents, RULES } from '../ai/riskFlags.js';
import { cannedProgressSummary, cannedRiskExplanation, streamCanned } from '../ai/canned.js';
import { PROGRESS_SUMMARY_VERSION, progressSummarySystem, progressSummaryUser } from '../ai/prompts/progressSummary.js';
import { RISK_EXPLANATION_VERSION, riskExplanationSystem, riskExplanationUser } from '../ai/prompts/riskExplanation.js';

/** Cached output is reused only if it was built from the same data with the same prompt + model. */
const CACHE_MAX_AGE_MS = 7 * 864e5;

// Hash the underlying data, not rolling windows like "last 14 days", so a summary
// only goes stale when grades or attendance actually change.
const summaryFingerprint = (snapshot) =>
  inputHash(PROGRESS_SUMMARY_VERSION, aiModel(), snapshot.attendance.sessionsRecorded, snapshot.attendance.absences,
    snapshot.attendance.excusedAbsences, snapshot.attendance.lateArrivals, snapshot.subjects, snapshot.recentResults);

const insightView = (row, { stale = false } = {}) =>
  row && {
    id: row.id,
    content: row.content,
    model: row.model,
    canned: row.canned,
    createdAt: row.createdAt,
    stale,
  };

const loadSnapshot = async (user, studentId) => {
  await assertCanViewStudent(user, studentId);
  const built = await buildStudentSnapshot(studentId);
  if (!built) throw notFound('Student not found');
  return built;
};

// GET /api/insights/students/:id/summary — latest stored summary (if any).
export const getSummary = async (req, res) => {
  const { snapshot } = await loadSnapshot(req.user, req.params.id);
  const latest = await prisma.aiInsight.findFirst({
    where: { studentId: req.params.id, kind: 'PROGRESS_SUMMARY' },
    orderBy: { createdAt: 'desc' },
  });
  res.json({
    insight: insightView(latest, { stale: latest ? latest.inputHash !== summaryFingerprint(snapshot) : false }),
    aiAvailable: aiConfigured() || req.user.isDemo,
    demo: !!req.user.isDemo,
  });
};

/** Writes one server-sent event. */
const sse = (res, event, data) => {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

// POST /api/insights/students/:id/summary  { regenerate?: boolean }
// Responds with JSON when a cached summary is reused, otherwise streams SSE:
//   event: meta  { model, canned }
//   event: delta { text }
//   event: done  { insight }
//   event: error { code, message }
export const generateSummary = async (req, res) => {
  const studentId = req.params.id;
  const { snapshot, dataPoints } = await loadSnapshot(req.user, studentId);

  if (dataPoints < MIN_DATA_POINTS || (snapshot.subjects.length === 0 && snapshot.attendance.sessionsRecorded < MIN_DATA_POINTS)) {
    throw new AiError(
      'INSUFFICIENT_DATA',
      `There isn't enough data for ${snapshot.firstName} yet. Summaries need some graded work or attendance first.`,
      422
    );
  }

  const demo = !!req.user.isDemo;
  const hash = summaryFingerprint(snapshot);

  if (!req.body.regenerate && !demo) {
    const cached = await prisma.aiInsight.findFirst({
      where: { studentId, kind: 'PROGRESS_SUMMARY', inputHash: hash, createdAt: { gte: new Date(Date.now() - CACHE_MAX_AGE_MS) } },
      orderBy: { createdAt: 'desc' },
    });
    if (cached) return res.json({ cached: true, insight: insightView(cached) });
  }

  if (!demo && !aiConfigured()) {
    throw new AiError('AI_NOT_CONFIGURED', 'AI insights are not set up on this server yet.');
  }

  // Start the event stream.
  res.status(200).set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  const abort = new AbortController();
  res.on('close', () => abort.abort());

  try {
    sse(res, 'meta', { model: demo ? 'demo-sample' : aiModel(), canned: demo });
    const onText = (text) => sse(res, 'delta', { text });

    let content;
    let model;
    if (demo) {
      content = cannedProgressSummary(snapshot);
      model = 'demo-sample';
      await streamCanned(content, onText, { signal: abort.signal });
    } else {
      const result = await streamCompletion({
        system: progressSummarySystem,
        user: progressSummaryUser(snapshot),
        maxTokens: 8000,
        effort: 'medium',
        onText,
        signal: abort.signal,
      });
      content = result.text;
      model = result.model;
    }

    if (abort.signal.aborted) return;
    // Demo accounts are read-only: their sample is never stored.
    const saved = demo
      ? { id: 'demo', content, model, canned: true, createdAt: new Date() }
      : await prisma.aiInsight.create({
          data: { studentId, kind: 'PROGRESS_SUMMARY', content, inputHash: hash, model, createdById: req.user.id },
        });
    sse(res, 'done', { insight: insightView(saved) });
  } catch (err) {
    if (!abort.signal.aborted) {
      const e = err instanceof AiError ? err : new AiError('AI_UNAVAILABLE', 'Something went wrong while writing the summary.', 500);
      if (!(err instanceof AiError)) console.error('[insights] summary failed:', err);
      sse(res, 'error', { code: e.code, message: e.message });
    }
  } finally {
    res.end();
  }
};

// GET /api/insights/at-risk (teacher/admin)
export const getAtRisk = async (req, res) => {
  const students = await findAtRiskStudents(req.user);
  const explanations = students.length
    ? await prisma.aiInsight.findMany({
        where: { studentId: { in: students.map((s) => s.studentId) }, kind: 'RISK_EXPLANATION' },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  res.json({
    rules: RULES,
    generatedAt: new Date(),
    aiAvailable: aiConfigured() || req.user.isDemo,
    students: students.map((s) => {
      const hash = inputHash(RISK_EXPLANATION_VERSION, aiModel(), s.flags);
      const match = explanations.find((e) => e.studentId === s.studentId && e.inputHash === hash);
      return { ...s, explanation: insightView(match) ?? null };
    }),
  });
};

// POST /api/insights/at-risk/:studentId/explain (teacher/admin)
export const explainRisk = async (req, res) => {
  const { studentId } = req.params;
  await assertCanViewStudent(req.user, studentId);
  const [flagged] = await findAtRiskStudents(req.user, { studentId });
  if (!flagged) throw conflict('This student is not currently flagged.');

  const input = { firstName: flagged.fullName.split(' ')[0], classLevel: flagged.classLevel, flags: flagged.flags };
  if (req.user.isDemo) {
    return res.json({ explanation: { id: 'demo', content: cannedRiskExplanation(input), model: 'demo-sample', canned: true, createdAt: new Date() } });
  }

  const hash = inputHash(RISK_EXPLANATION_VERSION, aiModel(), flagged.flags);
  const cached = await prisma.aiInsight.findFirst({
    where: { studentId, kind: 'RISK_EXPLANATION', inputHash: hash, createdAt: { gte: new Date(Date.now() - CACHE_MAX_AGE_MS) } },
    orderBy: { createdAt: 'desc' },
  });
  if (cached && !req.body.regenerate) return res.json({ explanation: insightView(cached), cached: true });

  const result = await streamCompletion({
    system: riskExplanationSystem,
    user: riskExplanationUser(input),
    maxTokens: 2000,
    effort: 'low',
  });
  const saved = await prisma.aiInsight.create({
    data: { studentId, kind: 'RISK_EXPLANATION', content: result.text, inputHash: hash, model: result.model, createdById: req.user.id },
  });
  res.json({ explanation: insightView(saved) });
};
