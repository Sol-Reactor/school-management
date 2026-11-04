// Central error handling.
//
// Express 5 forwards rejected promises from async route handlers to this
// middleware automatically, so controllers simply `throw` (or let Prisma throw)
// and never need try/catch or an asyncHandler wrapper.
//
// Every error response has the same shape:
//   { message: string, code?: string, errors?: [{ path: string, message: string }] }
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors.js';

export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

const prismaErrorMap = {
  P2002: [409, 'A record with this value already exists'],
  P2003: [400, 'A referenced record does not exist'],
  P2025: [404, 'Record not found'],
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return res.status(err.status).json({
      message: err.message,
      ...(err.code && { code: err.code }),
      ...(err.errors && { errors: err.errors }),
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && prismaErrorMap[err.code]) {
    const [status, message] = prismaErrorMap[err.code];
    return res.status(status).json({ message });
  }

  // Malformed JSON body from express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' });
  }

  // Unexpected: log the full error server-side, never leak internals to the client.
  console.error(`[${req.method} ${req.originalUrl}]`, err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
};
