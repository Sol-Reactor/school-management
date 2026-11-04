import prisma from '../lib/prisma.js';
import { forbidden, notFound } from '../lib/errors.js';
import { assertCanViewStudent, assertSelfOrAdmin } from '../lib/access.js';

const userSummary = { select: { id: true, fullName: true, email: true, createdAt: true } };

// POST /api/relationships/students/:studentId/parents (the student/admin)
export const linkStudentToParent = async (req, res) => {
  const { studentId } = req.params;
  await assertSelfOrAdmin(req.user, 'student', studentId);

  const parent = await prisma.parent.findFirst({
    where: { user: { email: req.body.parentEmail } },
    select: { id: true },
  });
  if (!parent) throw notFound('No parent account found with this email');

  const student = await prisma.student.update({
    where: { id: studentId },
    data: { parentId: parent.id },
    include: {
      user: { select: { fullName: true, email: true } },
      parent: { include: { user: { select: { fullName: true, email: true } } } },
    },
  });
  res.json({ message: 'Parent linked', student });
};

// DELETE /api/relationships/students/:studentId/parents/:parentId
// Allowed for the student, the linked parent, or an admin.
export const unlinkStudentFromParent = async (req, res) => {
  const { studentId, parentId } = req.params;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, parentId: true },
  });
  if (!student || student.parentId !== parentId) throw notFound('This parent is not linked to the student');

  const allowed =
    req.user.role === 'ADMIN' ||
    req.user.student?.id === studentId ||
    req.user.parent?.id === parentId;
  if (!allowed) throw forbidden();

  const updated = await prisma.student.update({
    where: { id: studentId },
    data: { parentId: null },
    include: { user: { select: { fullName: true, email: true } } },
  });
  res.json({ message: 'Parent unlinked', student: updated });
};

// GET /api/relationships/students/:studentId/parents
export const getStudentParents = async (req, res) => {
  const { studentId } = req.params;
  await assertCanViewStudent(req.user, studentId);

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { parent: { include: { user: userSummary } } },
  });
  if (!student) throw notFound('Student not found');
  res.json({ parents: student.parent ? [student.parent] : [] });
};

// GET /api/relationships/parents/:parentId/students (the parent/admin)
export const getParentStudents = async (req, res) => {
  const { parentId } = req.params;
  await assertSelfOrAdmin(req.user, 'parent', parentId);

  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    include: {
      students: {
        include: { user: userSummary, class: { select: { name: true, level: true } } },
      },
    },
  });
  if (!parent) throw notFound('Parent not found');
  res.json({ students: parent.students });
};
