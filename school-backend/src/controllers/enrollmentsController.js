import prisma from '../lib/prisma.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { assertCanManageClass } from '../lib/access.js';
import { createNotification, notifyAdmins, notifySafely } from './notificationController.js';

const enrollmentInclude = {
  student: { include: { user: { select: { id: true, fullName: true, email: true } } } },
  class: { select: { name: true, level: true } },
};

// GET /api/enrollments (teacher/admin) — teachers see enrollments for their classes only.
export const getEnrollments = async (req, res) => {
  const { studentId, classId } = req.query;
  const where = {
    ...(studentId && { studentId }),
    ...(classId && { classId }),
    ...(req.user.role === 'TEACHER' && { class: { teacherId: req.user.teacher.id } }),
  };

  const enrollments = await prisma.enrollment.findMany({
    where,
    include: enrollmentInclude,
    orderBy: { createdAt: 'desc' },
  });

  res.json({ enrollments });
};

/** Enrols a student, sets their current class and notifies the people involved. */
const enroll = async (studentId, classId) => {
  const classInfo = await prisma.class.findUnique({ where: { id: classId }, select: { id: true } });
  if (!classInfo) throw notFound('Class not found');

  if (await prisma.enrollment.findFirst({ where: { studentId, classId }, select: { id: true } })) {
    throw conflict('This student is already enrolled in that class');
  }

  const [enrollment] = await prisma.$transaction([
    prisma.enrollment.create({ data: { studentId, classId }, include: enrollmentInclude }),
    prisma.student.update({ where: { id: studentId }, data: { classId } }),
  ]);

  const { student } = enrollment;
  const label = `${enrollment.class.name} (${enrollment.class.level})`;
  const parent = student.parentId
    ? await prisma.parent.findUnique({ where: { id: student.parentId }, select: { userId: true } })
    : null;

  notifySafely(
    createNotification(student.user.id, 'Assigned to class', `You have been assigned to ${label}.`, 'CLASS_ASSIGNED'),
    notifyAdmins('New enrollment', `${student.user.fullName} was enrolled in ${enrollment.class.name}.`, 'ENROLLMENT'),
    parent &&
      createNotification(
        parent.userId,
        'Child assigned to class',
        `${student.user.fullName} has been assigned to ${label}.`,
        'CLASS_ASSIGNED'
      )
  );

  return enrollment;
};

// POST /api/enrollments (admin)
export const createEnrollment = async (req, res) => {
  const { studentId, classId } = req.body;
  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
  if (!student) throw notFound('Student not found');

  const enrollment = await enroll(studentId, classId);
  res.status(201).json({ message: 'Enrollment created', enrollment });
};

// POST /api/enrollments/assign (class teacher/admin) — enrol by student email.
export const assignStudentToClass = async (req, res) => {
  const { studentEmail, classId } = req.body;
  await assertCanManageClass(req.user, classId);

  const studentUser = await prisma.user.findFirst({
    where: { email: studentEmail, role: 'STUDENT' },
    select: { student: { select: { id: true } } },
  });
  if (!studentUser?.student) {
    throw badRequest('No student found with that email', [
      { path: 'studentEmail', message: 'No student found with this email' },
    ]);
  }

  const enrollment = await enroll(studentUser.student.id, classId);
  res.status(201).json({ message: 'Student assigned to class', enrollment });
};

// DELETE /api/enrollments/:id (admin)
export const deleteEnrollment = async (req, res) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: req.params.id },
    select: { id: true, studentId: true, classId: true },
  });
  if (!enrollment) throw notFound('Enrollment not found');

  await prisma.$transaction([
    prisma.enrollment.delete({ where: { id: enrollment.id } }),
    // Only clear the student's current class if it is the one being removed.
    prisma.student.updateMany({
      where: { id: enrollment.studentId, classId: enrollment.classId },
      data: { classId: null },
    }),
  ]);

  res.json({ message: 'Enrollment deleted' });
};
