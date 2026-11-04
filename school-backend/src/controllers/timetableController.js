import prisma from '../lib/prisma.js';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors.js';
import { assertCanManageClass, assertCanViewClass, demoClassFilter } from '../lib/access.js';
import { DAYS } from '../validation/schemas.js';

const entryInclude = {
  class: { select: { id: true, name: true, level: true } },
  subject: { select: { id: true, name: true, code: true } },
  teacher: { include: { user: { select: { fullName: true } } } },
};

const dayOrder = (a, b) =>
  DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime);

// GET /api/timetable
export const getTimetable = async (req, res) => {
  const { classId, teacherId, day } = req.query;
  const timetable = await prisma.timetable.findMany({
    where: {
      ...(classId && { classId }),
      ...(teacherId && { teacherId }),
      ...(day && { day }),
      ...(req.user.isDemo && { class: demoClassFilter(req.user) }),
    },
    include: entryInclude,
  });
  res.json({ timetable: timetable.sort(dayOrder) });
};

// GET /api/timetable/:id
export const getTimetableById = async (req, res) => {
  const timetable = await prisma.timetable.findUnique({
    where: { id: req.params.id },
    include: entryInclude,
  });
  if (!timetable) throw notFound('Timetable entry not found');
  res.json({ timetable });
};

/**
 * Two slots overlap when existing.start < new.end AND existing.end > new.start.
 * Checks both the class (can't have two lessons at once) and the teacher
 * (can't teach two classes at once).
 */
const assertNoClash = async ({ id, classId, teacherId, day, startTime, endTime }) => {
  const clash = await prisma.timetable.findFirst({
    where: {
      day,
      ...(id && { NOT: { id } }),
      OR: [{ classId }, { teacherId }],
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    include: { class: { select: { name: true } }, subject: { select: { name: true } } },
  });
  if (clash) {
    const who = clash.classId === classId ? 'This class' : 'This teacher';
    throw conflict(
      `${who} already has ${clash.subject.name} (${clash.class.name}) from ${clash.startTime} to ${clash.endTime}.`
    );
  }
};

const assertTeacherFor = (user, teacherId) => {
  if (user.role === 'TEACHER' && teacherId !== user.teacher.id) {
    throw forbidden('Teachers can only schedule their own lessons');
  }
};

// POST /api/timetable (class teacher/admin)
export const createTimetable = async (req, res) => {
  const data = req.body;
  await assertCanManageClass(req.user, data.classId);
  assertTeacherFor(req.user, data.teacherId);
  await assertNoClash(data);

  const timetable = await prisma.timetable.create({ data, include: entryInclude });
  res.status(201).json({ message: 'Timetable entry created', timetable });
};

// PUT /api/timetable/:id (class teacher/admin)
export const updateTimetable = async (req, res) => {
  const existing = await prisma.timetable.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Timetable entry not found');
  await assertCanManageClass(req.user, existing.classId);

  const merged = { ...existing, ...req.body };
  if (req.body.classId) await assertCanManageClass(req.user, merged.classId);
  assertTeacherFor(req.user, merged.teacherId);
  if (merged.endTime <= merged.startTime) throw badRequest('End time must be after start time');
  await assertNoClash(merged);

  const timetable = await prisma.timetable.update({
    where: { id: existing.id },
    data: req.body,
    include: entryInclude,
  });
  res.json({ message: 'Timetable entry updated', timetable });
};

// DELETE /api/timetable/:id (class teacher/admin)
export const deleteTimetable = async (req, res) => {
  const existing = await prisma.timetable.findUnique({
    where: { id: req.params.id },
    select: { classId: true },
  });
  if (!existing) throw notFound('Timetable entry not found');
  await assertCanManageClass(req.user, existing.classId);

  await prisma.timetable.delete({ where: { id: req.params.id } });
  res.json({ message: 'Timetable entry deleted' });
};

// GET /api/timetable/class/:classId — grouped by day.
export const getClassTimetable = async (req, res) => {
  const { classId } = req.params;
  await assertCanViewClass(req.user, classId);

  const entries = await prisma.timetable.findMany({ where: { classId }, include: entryInclude });
  const grouped = Object.fromEntries(DAYS.map((d) => [d, []]));
  for (const e of entries.sort(dayOrder)) grouped[e.day]?.push(e);

  res.json({ timetable: grouped });
};

// GET /api/timetable/teacher/:teacherId (teacher self/admin)
export const getTeacherTimetable = async (req, res) => {
  const { teacherId } = req.params;
  if (req.user.role === 'TEACHER' && req.user.teacher.id !== teacherId) throw forbidden();

  const timetable = await prisma.timetable.findMany({ where: { teacherId }, include: entryInclude });
  res.json({ timetable: timetable.sort(dayOrder) });
};
