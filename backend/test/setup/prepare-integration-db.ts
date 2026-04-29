import 'dotenv/config';

import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';

import { getTestDatabaseUrl } from './test-database-url.js';

const quoteIdentifier = (identifier: string): string => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid database identifier: ${identifier}`);
  }

  return `"${identifier}"`;
};

const ensureTestDatabaseExists = async (testDatabaseUrl: string) => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to prepare the integration test database');
  }

  const sourceDatabaseUrl = new URL(process.env.DATABASE_URL);
  const testUrl = new URL(testDatabaseUrl);
  const testDatabaseName = testUrl.pathname.replace(/^\//, '');

  sourceDatabaseUrl.pathname = '/postgres';

  const client = new Client({ connectionString: sourceDatabaseUrl.toString() });
  await client.connect();

  try {
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      testDatabaseName
    ]);

    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE ${quoteIdentifier(testDatabaseName)}`);
    }
  } finally {
    await client.end();
  }
};

const runPrismaDbPush = (testDatabaseUrl: string) => {
  const result = spawnSync('npx', ['prisma', 'db', 'push', '--force-reset'], {
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl
    },
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    throw new Error('Failed to prepare integration test database with prisma db push');
  }
};

const persistTestEnv = (testDatabaseUrl: string) => {
  const envPath = resolve('.env.test');
  const escapedUrl = testDatabaseUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  writeFileSync(envPath, `DATABASE_URL="${escapedUrl}"\n`);
};

const main = async () => {
  const testDatabaseUrl = getTestDatabaseUrl();

  await ensureTestDatabaseExists(testDatabaseUrl);
  runPrismaDbPush(testDatabaseUrl);
  persistTestEnv(testDatabaseUrl);
};

await main();
