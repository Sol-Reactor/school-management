// Single shared Prisma client. Every module imports this instead of calling
// `new PrismaClient()`, which would open a separate connection pool each time.
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__hayaPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  // Reuse the client across nodemon reloads / test files.
  globalForPrisma.__hayaPrisma = prisma;
}

export default prisma;
