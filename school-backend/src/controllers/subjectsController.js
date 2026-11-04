import prisma from '../lib/prisma.js';
import { conflict, notFound } from '../lib/errors.js';
import { assertCanManageClass } from '../lib/access.js';

const classSummary = { select: { id: true, name: true, level: true } };

// GET /api/subjects — subject catalogue (non-sensitive).
export const getSubjects = async (req, res) => {
  const { classId } = req.query;
  const subjects = await prisma.subject.findMany({
    where: typeof classId === 'string' && classId ? { classId } : {},
    include: {
      class: classSummary,
      _count: { select: { timetable: true, exams: true, grades: true } },
    },
    orderBy: { name: 'asc' },
  });
  res.json({ subjects });
};

// GET /api/subjects/:id — student grades are only included for admins.
export const getSubjectById = async (req, res) => {
  const isAdmin = req.user.role === 'ADMIN';
  const subject = await prisma.subject.findUnique({
    where: { id: req.params.id },
    include: {
      class: classSummary,
      timetable: {
        include: {
          class: { select: { name: true } },
          teacher: { include: { user: { select: { fullName: true } } } },
        },
      },
      exams: {
        include: {
          class: { select: { name: true } },
          teacher: { include: { user: { select: { fullName: true } } } },
        },
        orderBy: { date: 'desc' },
      },
      ...(isAdmin && {
        grades: {
          include: {
            student: { include: { user: { select: { fullName: true } } } },
            exam: { select: { name: true, date: true } },
          },
          orderBy: { exam: { date: 'desc' } },
          take: 20,
        },
      }),
    },
  });
  if (!subject) throw notFound('Subject not found');
  res.json({ subject });
};

// POST /api/subjects (teacher/admin)
export const createSubject = async (req, res) => {
  const { name, code, classId } = req.body;
  if (classId) await assertCanManageClass(req.user, classId);

  const subject = await prisma.subject.create({
    data: { name, code, classId: classId ?? null },
    include: { class: { select: { name: true } } },
  });
  res.status(201).json({ message: 'Subject created', subject });
};

// PUT /api/subjects/:id (teacher/admin)
export const updateSubject = async (req, res) => {
  if (req.body.classId) await assertCanManageClass(req.user, req.body.classId);
  const subject = await prisma.subject.update({
    where: { id: req.params.id },
    data: req.body,
    include: { class: { select: { name: true } } },
  });
  res.json({ message: 'Subject updated', subject });
};

// DELETE /api/subjects/:id (admin)
export const deleteSubject = async (req, res) => {
  const { id } = req.params;
  const subject = await prisma.subject.findUnique({
    where: { id },
    select: { _count: { select: { exams: true, grades: true } } },
  });
  if (!subject) throw notFound('Subject not found');
  if (subject._count.exams > 0 || subject._count.grades > 0) {
    throw conflict('This subject has exams or grades and cannot be deleted.');
  }
  await prisma.$transaction([
    prisma.timetable.deleteMany({ where: { subjectId: id } }),
    prisma.subject.delete({ where: { id } }),
  ]);
  res.json({ message: 'Subject deleted' });
};

// PATCH /api/subjects/:id/assign-class (class teacher/admin)
export const assignSubjectToClass = async (req, res) => {
  await assertCanManageClass(req.user, req.body.classId);
  const subject = await prisma.subject.update({
    where: { id: req.params.id },
    data: { classId: req.body.classId },
    include: { class: { select: { name: true, level: true } } },
  });
  res.json({ message: 'Subject assigned to class', subject });
};
