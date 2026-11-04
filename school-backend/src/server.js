import config from './config/env.js';
import prisma from './lib/prisma.js';
import { createApp } from './app.js';

const app = createApp();

const server = app.listen(config.PORT, () => {
  console.log(`Haya API listening on port ${config.PORT} (${config.NODE_ENV})`);
});

// Last-resort safety nets: log and exit so the platform restarts a clean process
// instead of running in an unknown state.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
  shutdown(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  shutdown(1);
});

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close(async () => {
    await prisma.$disconnect().catch(() => {});
    process.exit(code);
  });
  // Don't hang forever if connections refuse to close.
  setTimeout(() => process.exit(code), 10_000).unref();
}

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
