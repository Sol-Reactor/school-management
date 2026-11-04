import api from './api';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** One health probe with a short timeout. */
export const pingServer = async (timeout = 8000) => {
  try {
    await api.get('/health', { timeout, skipAuthHandler: true });
    return true;
  } catch {
    return false;
  }
};

/**
 * Polls /api/health until the server answers or `maxWaitMs` passes.
 * Render's free tier sleeps after inactivity and needs ~30–60s to wake.
 */
export const waitForServer = async ({ maxWaitMs = 90_000, signal } = {}) => {
  const started = Date.now();
  while (Date.now() - started < maxWaitMs) {
    if (signal?.aborted) return false;
    if (await pingServer()) return true;
    await sleep(2500);
  }
  return false;
};
