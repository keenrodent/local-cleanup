import { execSync, type ChildProcess, spawn } from 'node:child_process';
import { beforeAll, afterAll } from 'vitest';

const BASE_URL = 'http://localhost:4322';
let devServer: ChildProcess;

async function waitForServer(url: string, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

beforeAll(async () => {
  // Reset and seed the local D1 database
  execSync('npx wrangler d1 execute local-cleanup-db --local --command="DROP TABLE IF EXISTS signups; DROP TABLE IF EXISTS completions; DROP TABLE IF EXISTS tasks; DROP TABLE IF EXISTS locations; DROP TABLE IF EXISTS spots;"', { stdio: 'pipe' });
  execSync('npx wrangler d1 execute local-cleanup-db --local --file=db/schema.sql', { stdio: 'pipe' });
  execSync('npx wrangler d1 execute local-cleanup-db --local --file=db/seed.sql', { stdio: 'pipe' });

  // Start dev server on a different port to avoid conflicts
  devServer = spawn('npx', ['astro', 'dev', '--port', '4322'], {
    stdio: 'pipe',
    env: { ...process.env },
  });

  await waitForServer(BASE_URL);
}, 60000);

afterAll(() => {
  if (devServer) {
    devServer.kill('SIGTERM');
  }
});

export { BASE_URL };
