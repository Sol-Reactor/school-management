import prisma from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import { assertCanViewStudent, studentScope } from '../lib/access.js';

const userSummary = { select: { id: true, fullName: true, email: true } };

// GET /api/students (teacher/admin) — teachers only see students in their classes.
export const getStudents = async (req, res) => {
  const { classId, search, page, limit } = req.query;
  const where = {
    AND: [
      studentScope(req.user),
      classId ? { classId } : {},
      search
        ? {
            user: {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            },
          }
        : {},
    ],
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        user: userSummary,
        class: { select: { id: true, name: true, level: true } },
        parent: { include: { user: { select: { fullName: true, email: true } } } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { user: { fullName: 'asc' } },
    }),
    prisma.student.count({ where }),
  ]);

  res.json({ students, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

// GET /api/students/:id — admin, the student, their parent, or a teacher of their class.
export const getStudentById = async (req, res) => {
  const { id } = req.params;
  await assertCanViewStudent(req.user, id);

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true, role: true, createdAt: true } },
      class: {
        include: {
          teacher: { include: { user: { select: { fullName: true, email: true } } } },
          subjects: { select: { id: true, name: true, code: true } },
        },
      },
      parent: { include: { user: { select: { fullName: true, email: true } } } },
      enrollments: { include: { class: { select: { name: true, level: true } } } },
      grades: {
        include: {
          exam: { select: { name: true, date: true } },
          subject: { select: { name: true } },
        },
        orderBy: { exam: { date: 'desc' } },
      },
      attendance: {
        include: { class: { select: { name: true } } },
        orderBy: { date: 'desc' },
        take: 20,
      },
    },
  });

  if (!student) throw notFound('Student not found');
  res.json({ student });
};

// PATCH /api/students/:id/class (admin)
export const assignToClass = async (req, res) => {
  const student = await prisma.student.update({
    where: { id: req.params.id },
    data: { classId: req.body.classId },
    include: {
      user: { select: { fullName: true, email: true } },
      class: { select: { name: true, level: true } },
    },
  });
  res.json({ message: 'Student assigned to class', student });
};

// PATCH /api/students/:id/parent (admin)
export const assignToParent = async (req, res) => {
  const student = await prisma.student.update({
    where: { id: req.params.id },
    data: { parentId: req.body.parentId },
    include: {
      user: { select: { fullName: true, email: true } },
      parent: { include: { user: { select: { fullName: true, email: true } } } },
    },
  });
  res.json({ message: 'Student assigned to parent', student });
};
