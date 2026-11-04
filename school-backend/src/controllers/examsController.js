import prisma from '../lib/prisma.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import {
  assertCanManageClass,
  assertCanManageExam,
  assertCanViewClass,
  canManageClass,
  classScope,
  studentScope,
} from '../lib/access.js';

const examInclude = {
  class: { select: { id: true, name: true, level: true } },
  subject: { select: { id: true, name: true, code: true } },
  teacher: { include: { user: { select: { fullName: true } } } },
};

/** Exams visible to the user: by class membership, plus exams a teacher set themselves. */
const examScope = (user) => {
  if (user.role === 'ADMIN') return {};
  if (user.role === 'TEACHER') {
    return { OR: [{ teacherId: user.teacher.id }, { class: { teacherId: user.teacher.id } }] };
  }
  return { class: classScope(user) };
};

// GET /api/exams
export const getExams = async (req, res) => {
  const { classId, teacherId, page, limit } = req.query;
  const where = {
    AND: [examScope(req.user), classId ? { classId } : {}, teacherId ? { teacherId } : {}],
  };

  const [exams, total] = await Promise.all([
    prisma.exam.findMany({
      where,
      include: { ...examInclude, _count: { select: { grades: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.exam.count({ where }),
  ]);

  res.json({ exams, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

// GET /api/exams/:id — grades are limited to what the viewer may see.
export const getExamById = async (req, res) => {
  const exam = await prisma.exam.findFirst({
    where: { id: req.params.id, ...examScope(req.user) },
    select: { id: true, classId: true, teacherId: true },
  });
  if (!exam) throw notFound('Exam not found');

  const manager =
    req.user.role === 'ADMIN' ||
    exam.teacherId === req.user.teacher?.id ||
    (await canManageClass(req.user, exam.classId));

  const full = await prisma.exam.findUnique({
    where: { id: exam.id },
    include: {
      ...examInclude,
      teacher: { include: { user: { select: { fullName: true, email: true } } } },
      grades: {
        where: manager ? {} : { student: studentScope(req.user) },
        include: { student: { include: { user: { select: { fullName: true } } } } },
        orderBy: { student: { user: { fullName: 'asc' } } },
      },
    },
  });

  res.json({ exam: full });
};

const resolveTeacherId = async (user, classId, requested) => {
  if (user.role === 'TEACHER') {
    if (requested && requested !== user.teacher.id) {
      throw forbidden('Teachers can only create exams as themselves');
    }
    return user.teacher.id;
  }
  if (requested) return requested;
  const cls = await prisma.class.findUnique({ where: { id: classId }, select: { teacherId: true } });
  if (!cls?.teacherId) {
    throw badRequest('Choose a teacher for this exam', [
      { path: 'teacherId', message: 'This class has no teacher, so pick one' },
    ]);
  }
  return cls.teacherId;
};

// POST /api/exams (class teacher/admin)
export const createExam = async (req, res) => {
  const { name, date, classId, subjectId, teacherId } = req.body;
  await assertCanManageClass(req.user, classId);

  const exam = await prisma.exam.create({
    data: {
      name,
      date,
      classId,
      subjectId,
      teacherId: await resolveTeacherId(req.user, classId, teacherId),
    },
    include: examInclude,
  });

  res.status(201).json({ message: 'Exam created', exam });
};

// PUT /api/exams/:id
export const updateExam = async (req, res) => {
  await assertCanManageExam(req.user, req.params.id);
  const { classId, teacherId, ...rest } = req.body;

  if (classId) await assertCanManageClass(req.user, classId);
  if (teacherId && req.user.role !== 'ADMIN') throw forbidden('Only an admin can reassign an exam');

  const exam = await prisma.exam.update({
    where: { id: req.params.id },
    data: { ...rest, ...(classId && { classId }), ...(teacherId && { teacherId }) },
    include: examInclude,
  });

  res.json({ message: 'Exam updated', exam });
};

// DELETE /api/exams/:id — removes the exam and its grades.
export const deleteExam = async (req, res) => {
  await assertCanManageExam(req.user, req.params.id);
  await prisma.$transaction([
    prisma.grade.deleteMany({ where: { examId: req.params.id } }),
    prisma.exam.delete({ where: { id: req.params.id } }),
  ]);
  res.json({ message: 'Exam deleted' });
};

// GET /api/exams/class/:classId
export const getClassExams = async (req, res) => {
  const { classId } = req.params;
  await assertCanViewClass(req.user, classId);

  const exams = await prisma.exam.findMany({
    where: { classId },
    include: {
      subject: { select: { name: true, code: true } },
      teacher: { include: { user: { select: { fullName: true } } } },
      _count: { select: { grades: true } },
    },
    orderBy: { date: 'asc' },
  });

  res.json({ exams });
};
