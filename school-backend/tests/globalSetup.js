// Brings the test database schema up to date once before the suite runs.
import { spawnSync } from 'node:child_process';

export default function setup({ provide: _provide } = {}) {
  const url = process.env.DATABASE_URL ?? 'postgresql://haya:haya_local_dev@localhost:5433/haya_test';
  if (!/test/i.test(url)) throw new Error('Tests need a DATABASE_URL that contains "test".');
  const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
    shell: process.platform === 'win32',
    encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error(`prisma migrate deploy failed:\n${result.stdout}\n${result.stderr}`);
}
