import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { badRequest, conflict, notFound, unauthorized } from '../lib/errors.js';
import { clearSessionCookie, setSessionCookie } from '../middleware/auth.js';
import { createNotification, notifyAdmins, notifySafely } from './notificationController.js';

const BCRYPT_ROUNDS = 10;
// Compared against when the email doesn't exist, so response time doesn't
// reveal whether an account is registered.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', BCRYPT_ROUNDS);

const sessionUserSelect = {
  id: true,
  email: true,
  fullName: true,
  avatar: true,
  role: true,
  isDemo: true,
  createdAt: true,
  updatedAt: true,
  student: { select: { id: true } },
  teacher: { select: { id: true } },
  parent: { select: { id: true } },
};

const toSessionUser = (user) => {
  const { password: _password, ...rest } = user;
  return {
    ...rest,
    profileId: user.student?.id || user.teacher?.id || user.parent?.id || null,
  };
};

const ROLE_LABELS = { STUDENT: 'Student', TEACHER: 'Teacher', PARENT: 'Parent', ADMIN: 'Administrator' };

/** Creates a user with the matching profile row. Shared with the admin create-user endpoint. */
export const createUserWithProfile = async ({ email, password, fullName, role, parentId }) => {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const profile = {
    STUDENT: { student: { create: parentId ? { parentId } : {} } },
    TEACHER: { teacher: { create: {} } },
    PARENT: { parent: { create: {} } },
    ADMIN: {},
  }[role];

  return prisma.user.create({
    data: { email, password: passwordHash, fullName, role, ...profile },
    select: sessionUserSelect,
  });
};

// POST /api/auth/register — public. Only STUDENT or PARENT (enforced by the zod schema).
export const register = async (req, res) => {
  const { email, password, fullName, role, parentEmail } = req.body;

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    throw conflict('An account with this email already exists');
  }

  let parentUser = null;
  if (role === 'STUDENT' && parentEmail) {
    parentUser = await prisma.user.findFirst({
      where: { email: parentEmail, role: 'PARENT' },
      select: { id: true, fullName: true, parent: { select: { id: true } } },
    });
    if (!parentUser?.parent) {
      throw badRequest('No parent account found with that email. Ask your parent to register first.', [
        { path: 'parentEmail', message: 'No parent account found with this email' },
      ]);
    }
  }

  const user = await createUserWithProfile({
    email,
    password,
    fullName,
    role,
    parentId: parentUser?.parent.id,
  });

  // Notifications are best-effort: never fail the registration because of them.
  notifySafely(
    notifyAdmins(
      `New ${ROLE_LABELS[role]} registered`,
      `${fullName} registered as a ${ROLE_LABELS[role].toLowerCase()}.`,
      'GENERAL'
    ),
    parentUser &&
      createNotification(parentUser.id, 'Child linked', `${fullName} linked their account to yours.`, 'PARENT_ASSIGNED'),
    parentUser &&
      createNotification(user.id, 'Parent linked', `${parentUser.fullName} is now linked as your parent.`, 'PARENT_ASSIGNED')
  );

  setSessionCookie(res, user);
  res.status(201).json({ message: 'Account created', user: toSessionUser(user) });
};

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...sessionUserSelect, password: true },
  });

  const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  if (!user || !valid) throw unauthorized('Invalid email or password');

  setSessionCookie(res, user);
  res.json({ message: 'Signed in', user: toSessionUser(user) });
};

// POST /api/auth/demo — one-click sign-in to the seeded read-only demo account for a role.
export const demoLogin = async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { isDemo: true, role: req.body.role },
    select: sessionUserSelect,
    orderBy: { createdAt: 'asc' },
  });
  if (!user) throw notFound('The demo is not available right now.');

  setSessionCookie(res, user);
  res.json({ message: 'Signed in to the demo', user: toSessionUser(user) });
};

// POST /api/auth/logout
export const logout = async (req, res) => {
  clearSessionCookie(res);
  res.json({ message: 'Signed out' });
};

// GET /api/auth/profile
export const getProfile = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      ...sessionUserSelect,
      student: {
        select: {
          id: true,
          classId: true,
          class: {
            select: {
              id: true,
              name: true,
              level: true,
              teacher: { select: { id: true, user: { select: { fullName: true, email: true } } } },
            },
          },
          parent: {
            select: {
              id: true,
              userId: true,
              user: { select: { id: true, fullName: true, email: true, createdAt: true } },
            },
          },
        },
      },
      teacher: {
        select: {
          id: true,
          classes: {
            select: {
              id: true,
              name: true,
              level: true,
              students: { select: { id: true, user: { select: { fullName: true, email: true } } } },
            },
          },
        },
      },
      parent: {
        select: {
          id: true,
          students: {
            select: {
              id: true,
              classId: true,
              user: { select: { id: true, fullName: true, email: true, createdAt: true } },
              class: { select: { id: true, name: true, level: true } },
            },
          },
        },
      },
    },
  });

  if (!user) throw notFound('User not found');
  res.json({ user: toSessionUser(user) });
};

// PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: req.body,
    select: sessionUserSelect,
  });
  res.json({ message: 'Profile updated', user: toSessionUser(user) });
};
