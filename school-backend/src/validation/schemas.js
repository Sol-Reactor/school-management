// Request schemas for every create/update route (and the query strings that
// drive list endpoints). Kept in one place so the API contract is easy to read.
import { z } from 'zod';

// ---------- primitives ----------
const id = z.string().trim().min(1, 'Required').max(64);
const optionalId = id.optional();
const email = z.email('Enter a valid email address').trim().toLowerCase().max(254);
// Treat "" from HTML forms as "not provided".
const emptyToUndefined = (schema) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema);

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

const fullName = z.string().trim().min(2, 'Name must be at least 2 characters').max(100);

export const ROLES = ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];
export const PUBLIC_ROLES = ['STUDENT', 'PARENT'];
export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
export const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour HH:MM format');
const date = z.coerce.date({ error: 'Enter a valid date' });

const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(10);

// ---------- auth ----------
export const registerSchema = z.object({
  email,
  password,
  fullName,
  // Public sign-up can only ever create STUDENT or PARENT accounts.
  role: z.enum(PUBLIC_ROLES, { error: 'Role must be STUDENT or PARENT' }).default('STUDENT'),
  parentEmail: emptyToUndefined(email.optional()),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(128),
});

export const demoLoginSchema = z.object({
  role: z.enum(ROLES),
});

export const updateProfileSchema = z
  .object({
    fullName: fullName.optional(),
    avatar: z.preprocess(
      (v) => (v === '' ? null : v),
      z.url('Avatar must be a valid URL').max(500).nullable().optional()
    ),
  })
  .strict();

// ---------- users (admin) ----------
export const createUserSchema = z.object({
  email,
  password,
  fullName,
  role: z.enum(ROLES),
});

export const updateUserSchema = z.object({ fullName }).strict();

export const listUsersQuery = z.object({
  role: z.enum(ROLES).optional(),
  search: z.string().trim().max(100).optional(),
  page,
  limit,
});

// ---------- students ----------
export const listStudentsQuery = z.object({
  classId: optionalId,
  search: z.string().trim().max(100).optional(),
  page,
  limit,
});

export const assignClassSchema = z.object({ classId: id.nullable() });
export const assignParentSchema = z.object({ parentId: id.nullable() });
export const linkParentSchema = z.object({ parentEmail: email });

// ---------- classes ----------
export const createClassSchema = z.object({
  name: z.string().trim().min(1).max(60),
  level: z.string().trim().min(1).max(60),
  teacherEmail: emptyToUndefined(email.optional()),
});

export const updateClassSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    level: z.string().trim().min(1).max(60).optional(),
    teacherId: id.nullable().optional(),
  })
  .strict();

// ---------- subjects ----------
export const createSubjectSchema = z.object({
  name: z.string().trim().min(1).max(80),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{2,20}$/, 'Code must be 2–20 letters, digits or dashes'),
  classId: emptyToUndefined(optionalId),
});

export const updateSubjectSchema = createSubjectSchema.partial().strict();
export const assignSubjectClassSchema = z.object({ classId: id });

// ---------- enrollments ----------
export const createEnrollmentSchema = z.object({ studentId: id, classId: id });
export const assignByEmailSchema = z.object({ studentEmail: email, classId: id });

// ---------- attendance ----------
export const markAttendanceSchema = z.object({
  studentId: id,
  classId: id,
  date,
  status: z.enum(ATTENDANCE_STATUSES),
});

export const updateAttendanceSchema = z.object({ status: z.enum(ATTENDANCE_STATUSES) });

export const listAttendanceQuery = z.object({
  classId: optionalId,
  studentId: optionalId,
  date: date.optional(),
  page,
  limit,
});

export const dateRangeQuery = z.object({
  startDate: date.optional(),
  endDate: date.optional(),
  date: date.optional(),
});

// ---------- exams ----------
export const createExamSchema = z.object({
  name: z.string().trim().min(1).max(100),
  date,
  classId: id,
  subjectId: id,
  // Teachers always create exams as themselves; admins may pick a teacher.
  teacherId: emptyToUndefined(optionalId),
});

export const updateExamSchema = createExamSchema.partial().strict();

export const listExamsQuery = z.object({
  classId: optionalId,
  teacherId: optionalId,
  page,
  limit,
});

// ---------- grades ----------
const marks = z.coerce
  .number({ error: 'Marks must be a number' })
  .int('Marks must be a whole number')
  .min(0, 'Marks cannot be negative')
  .max(100, 'Marks cannot exceed 100');

export const createGradeSchema = z.object({
  examId: id,
  studentId: id,
  // Optional: derived from the exam when omitted, rejected if it disagrees.
  subjectId: emptyToUndefined(optionalId),
  marks,
});

export const updateGradeSchema = z.object({ marks });

export const listGradesQuery = z.object({
  examId: optionalId,
  studentId: optionalId,
  subjectId: optionalId,
  page,
  limit,
});

// ---------- timetable ----------
const timetableBase = z.object({
  classId: id,
  subjectId: id,
  teacherId: id,
  day: z.enum(DAYS),
  startTime: time,
  endTime: time,
});

const endAfterStart = (v) => !v.startTime || !v.endTime || v.endTime > v.startTime;
const endAfterStartIssue = { message: 'End time must be after start time', path: ['endTime'] };

export const createTimetableSchema = timetableBase.refine(endAfterStart, endAfterStartIssue);
export const updateTimetableSchema = timetableBase
  .partial()
  .strict()
  .refine(endAfterStart, endAfterStartIssue);

export const listTimetableQuery = z.object({
  classId: optionalId,
  teacherId: optionalId,
  day: z.enum(DAYS).optional(),
});

// ---------- notifications ----------
export const listNotificationsQuery = z.object({
  unreadOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

// ---------- insights ----------
export const generateInsightSchema = z.object({
  regenerate: z.boolean().optional().default(false),
});
