// Integration tests run the real Express app against a dedicated PostgreSQL
// database (one whose URL contains "test"; tests/helpers.js refuses anything else).
//   Local: docker compose up -d && npm test   (uses the haya_test database)
//   CI:    DATABASE_URL is provided by the workflow
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./tests/globalSetup.js'],
    // One shared database: run files one after another.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://haya:haya_local_dev@localhost:5433/haya_test',
      JWT_SECRET: process.env.JWT_SECRET ?? 'test-only-secret-0123456789abcdef0123456789',
      ANTHROPIC_API_KEY: '',
    },
  },
});
