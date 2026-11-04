import prisma from '../lib/prisma.js';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors.js';
import { assertCanManageExam, assertCanViewStudent, canViewStudent, demoProfileFilter } from '../lib/access.js';

const round2 = (n) => Math.round(n * 100) / 100;

const teacherExamScope = (user) =>
  user.role === 'TEACHER'
    ? { exam: { OR: [{ teacherId: user.teacher.id }, { class: { teacherId: user.teacher.id } }] } }
    : {};

// GET /api/grades (teacher/admin)
export const getGrades = async (req, res) => {
  const { examId, studentId, subjectId, page, limit } = req.query;
  const where = {
    ...(examId && { examId }),
    ...(studentId && { studentId }),
    ...(subjectId && { subjectId }),
    ...teacherExamScope(req.user),
    ...(req.user.isDemo && { student: demoProfileFilter(req.user) }),
  };

  const [grades, total] = await Promise.all([
    prisma.grade.findMany({
      where,
      include: {
        student: { include: { user: { select: { fullName: true, email: true } } } },
        exam: { select: { id: true, name: true, date: true, classId: true } },
        subject: { select: { name: true, code: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { exam: { date: 'desc' } },
    }),
    prisma.grade.count({ where }),
  ]);

  res.json({ grades, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

// GET /api/grades/:id
export const getGradeById = async (req, res) => {
  const grade = await prisma.grade.findUnique({
    where: { id: req.params.id },
    include: {
      student: {
        include: {
          user: { select: { fullName: true, email: true } },
          class: { select: { name: true } },
        },
      },
      exam: {
        include: { class: { select: { name: true } }, subject: { select: { name: true } } },
      },
      subject: { select: { name: true, code: true } },
    },
  });
  if (!grade) throw notFound('Grade not found');

  if (!(await canViewStudent(req.user, grade.studentId))) {
    await assertCanManageExam(req.user, grade.examId).catch(() => {
      throw forbidden();
    });
  }

  res.json({ grade });
};

// POST /api/grades (exam teacher/admin)
export const createGrade = async (req, res) => {
  const { examId, studentId, marks } = req.body;
  const exam = await assertCanManageExam(req.user, examId);

  if (req.body.subjectId && req.body.subjectId !== exam.subjectId) {
    throw badRequest("Subject doesn't match the exam's subject", [
      { path: 'subjectId', message: "Must match the exam's subject" },
    ]);
  }

  const inClass = await prisma.student.findFirst({
    where: {
      id: studentId,
      OR: [{ classId: exam.classId }, { enrollments: { some: { classId: exam.classId } } }],
    },
    select: { id: true },
  });
  if (!inClass) throw badRequest("This student isn't in the exam's class");

  if (await prisma.grade.findFirst({ where: { examId, studentId }, select: { id: true } })) {
    throw conflict('A grade already exists for this student in this exam');
  }

  const grade = await prisma.grade.create({
    data: { examId, studentId, subjectId: exam.subjectId, marks },
    include: {
      student: { include: { user: { select: { fullName: true } } } },
      exam: { select: { name: true } },
      subject: { select: { name: true } },
    },
  });

  res.status(201).json({ message: 'Grade saved', grade });
};

const loadGradeForWrite = async (user, id) => {
  const grade = await prisma.grade.findUnique({ where: { id }, select: { examId: true } });
  if (!grade) throw notFound('Grade not found');
  await assertCanManageExam(user, grade.examId);
};

// PUT /api/grades/:id
export const updateGrade = async (req, res) => {
  await loadGradeForWrite(req.user, req.params.id);
  const grade = await prisma.grade.update({
    where: { id: req.params.id },
    data: { marks: req.body.marks },
    include: {
      student: { include: { user: { select: { fullName: true } } } },
      exam: { select: { name: true } },
    },
  });
  res.json({ message: 'Grade updated', grade });
};

// DELETE /api/grades/:id
export const deleteGrade = async (req, res) => {
  await loadGradeForWrite(req.user, req.params.id);
  await prisma.grade.delete({ where: { id: req.params.id } });
  res.json({ message: 'Grade deleted' });
};

// GET /api/grades/student/:studentId
export const getStudentGrades = async (req, res) => {
  const { studentId } = req.params;
  await assertCanViewStudent(req.user, studentId);

  const { subjectId } = req.query;
  const grades = await prisma.grade.findMany({
    where: { studentId, ...(typeof subjectId === 'string' && subjectId && { subjectId }) },
    include: {
      exam: {
        include: { subject: { select: { name: true } }, class: { select: { name: true } } },
      },
      subject: { select: { name: true, code: true } },
    },
    orderBy: { exam: { date: 'desc' } },
  });

  const average = grades.length ? grades.reduce((s, g) => s + g.marks, 0) / grades.length : 0;
  res.json({ grades, average: round2(average), total: grades.length });
};

// GET /api/grades/exam/:examId (exam teacher/admin)
export const getExamGrades = async (req, res) => {
  const { examId } = req.params;
  await assertCanManageExam(req.user, examId);

  const grades = await prisma.grade.findMany({
    where: { examId },
    include: {
      student: { include: { user: { select: { fullName: true, email: true } } } },
      subject: { select: { name: true } },
    },
    orderBy: { student: { user: { fullName: 'asc' } } },
  });

  const marks = grades.map((g) => g.marks);
  const statistics = {
    totalStudents: grades.length,
    average: marks.length ? round2(marks.reduce((a, b) => a + b, 0) / marks.length) : 0,
    highest: marks.length ? Math.max(...marks) : 0,
    lowest: marks.length ? Math.min(...marks) : 0,
  };

  res.json({ grades, statistics });
};
