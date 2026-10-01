import test from 'node:test';
import assert from 'node:assert/strict';

const originalDatabaseUrl = process.env.DATABASE_URL;

test('falls back to local JSON data when DATABASE_URL is missing', async () => {
  delete process.env.DATABASE_URL;

  const { db } = await import(`../src/db.js?fallback=${Date.now()}`);
  await db.read();

  assert.ok(Array.isArray(db.data.users));
  assert.ok(db.data.users.some((user) => user.email === 'demo@flowvik.app'));
});

test.after(() => {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
});
