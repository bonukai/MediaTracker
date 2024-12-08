import { test } from 'vitest';
import { Database } from '../database.js';

test('should run migrations', async () => {
  Database.init({ client: 'better-sqlite3', filename: ':memory:' });
  await Database.runMigrations();
});
