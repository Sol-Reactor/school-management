// Builds the Express app without listening, so tests can import it directly.
import config from './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import prisma from './lib/prisma.js';
import { corsOptions, originGuard } from './middleware/security.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import usersRoutes from './routes/users.js';
import studentsRoutes from './routes/students.js';
import teachersRoutes from './routes/teachers.js';
import parentsRoutes from './routes/parents.js';
import classesRoutes from './routes/classes.js';
import subjectsRoutes from './routes/subjects.js';
import enrollmentsRoutes from './routes/enrollments.js';
import attendanceRoutes from './routes/attendance.js';
import examsRoutes from './routes/exams.js';
import gradesRoutes from './routes/grades.js';
import timetableRoutes from './routes/timetable.js';
import relationshipsRoutes from './routes/relationships.js';
import notificationRoutes from './routes/notifications.js';

export const createApp = () => {
  const app = express();

  // Behind Render's proxy (and Vercel's rewrite in production) — needed for
  // correct client IPs in rate limiting and for Secure cookies.
  app.set('trust proxy', config.TRUST_PROXY);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(cors(corsOptions));
  if (!config.isTest) app.use(morgan(config.isProd ? 'tiny' : 'dev'));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(originGuard);

  // Health check — also used by the frontend's "waking up the server" screen.
  app.get(['/health', '/api/health'], async (req, res) => {
    let database = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'unavailable';
    }
    res.status(database === 'ok' ? 200 : 503).json({ status: database === 'ok' ? 'ok' : 'degraded', database });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/students', studentsRoutes);
  app.use('/api/teachers', teachersRoutes);
  app.use('/api/parents', parentsRoutes);
  app.use('/api/classes', classesRoutes);
  app.use('/api/subjects', subjectsRoutes);
  app.use('/api/enrollments', enrollmentsRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/exams', examsRoutes);
  app.use('/api/grades', gradesRoutes);
  app.use('/api/timetable', timetableRoutes);
  app.use('/api/relationships', relationshipsRoutes);
  app.use('/api/notifications', notificationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
