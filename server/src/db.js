import './config.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { createDbAccess } from './db-access.js';

const { Pool } = pg;

export const defaultData = {
  users: [],
  sessions: [],
  oauthStates: [],
  workspaces: [],
  workspaceMembers: [],
  contacts: [],
  conversations: [],
  messages: [],
  automations: [],
  automationRuns: [],
  instagramAccounts: [],
  integrations: [],
  webhookEvents: [],
  activity: [],
  campaigns: [],
  knowledgeSources: [],
  teamInvites: []
};

const COLLECTIONS = Object.keys(defaultData);
const USE_LOCAL_DB = String(process.env.LOCAL_DATABASE || '').toLowerCase() === 'true';
const DATABASE_URL = USE_LOCAL_DB ? '' : String(process.env.DATABASE_URL || '').trim();
const LOCAL_DB_PATH = path.resolve(process.cwd(), path.basename(process.cwd()).toLowerCase() === 'server' ? 'data/db.json' : 'server/data/db.json');
const pool = DATABASE_URL ? new Pool({
  connectionString: DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false }
}) : null;

let schemaReady;
let baseline = structuredClone(defaultData);

function clone(value) {
  return structuredClone(value);
}

function workspaceIdOf(item) {
  return item && typeof item === 'object' ? (item.workspaceId || null) : null;
}

function itemId(item) {
  return item && typeof item === 'object' ? String(item.id || '') : '';
}

function stableJson(value) {
  return JSON.stringify(value);
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = pool.query(`
      CREATE TABLE IF NOT EXISTS app_records (
        collection TEXT NOT NULL,
        id TEXT NOT NULL,
        workspace_id TEXT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (collection, id)
      );
      CREATE INDEX IF NOT EXISTS idx_app_records_collection ON app_records(collection);
      CREATE INDEX IF NOT EXISTS idx_app_records_workspace ON app_records(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_app_records_collection_workspace ON app_records(collection, workspace_id);
    `);
  }
  await schemaReady;
}

async function loadAll() {
  await ensureSchema();
  const result = await pool.query(
    'SELECT collection, data FROM app_records WHERE collection = ANY($1::text[]) ORDER BY created_at ASC',
    [COLLECTIONS]
  );
  const data = clone(defaultData);
  for (const row of result.rows) {
    if (!Array.isArray(data[row.collection])) continue;
    data[row.collection].push(row.data);
  }
  return data;
}

async function loadLocal() {
  try {
    const stored = JSON.parse(await fs.readFile(LOCAL_DB_PATH, 'utf8'));
    const data = clone(defaultData);
    for (const collection of COLLECTIONS) {
      if (Array.isArray(stored?.[collection])) data[collection] = stored[collection];
    }
    return data;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await fs.mkdir(path.dirname(LOCAL_DB_PATH), { recursive: true });
    await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(defaultData, null, 2));
    return clone(defaultData);
  }
}

async function writeLocal(data) {
  await fs.mkdir(path.dirname(LOCAL_DB_PATH), { recursive: true });
  const temporaryPath = `${LOCAL_DB_PATH}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, JSON.stringify(data, null, 2));
  await fs.rename(temporaryPath, LOCAL_DB_PATH);
}

async function persistDiff(current, previous) {
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const collection of COLLECTIONS) {
      const nextItems = Array.isArray(current[collection]) ? current[collection] : [];
      const prevItems = Array.isArray(previous[collection]) ? previous[collection] : [];
      const nextMap = new Map(nextItems.map((item) => [itemId(item), item]).filter(([id]) => id));
      const prevMap = new Map(prevItems.map((item) => [itemId(item), item]).filter(([id]) => id));

      const deletedIds = [...prevMap.keys()].filter((id) => !nextMap.has(id));
      if (deletedIds.length) {
        await client.query(
          'DELETE FROM app_records WHERE collection = $1 AND id = ANY($2::text[])',
          [collection, deletedIds]
        );
      }

      for (const [id, item] of nextMap) {
        const before = prevMap.get(id);
        if (before && stableJson(before) === stableJson(item)) continue;
        await client.query(
          `INSERT INTO app_records (collection, id, workspace_id, data, created_at, updated_at)
           VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW())
           ON CONFLICT (collection, id)
           DO UPDATE SET workspace_id = EXCLUDED.workspace_id, data = EXCLUDED.data, updated_at = NOW()`,
          [collection, id, workspaceIdOf(item), JSON.stringify(item)]
        );
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Compatibility adapter: the rest of the app can keep using db.read()/db.write()
// while data is persisted in Neon PostgreSQL instead of a local JSON file.
export const db = {
  data: clone(defaultData),
  async read() {
    this.data = DATABASE_URL ? await loadAll() : await loadLocal();
    baseline = clone(this.data);
    return this.data;
  },
  async write() {
    if (DATABASE_URL) await persistDiff(this.data, baseline);
    else await writeLocal(this.data);
    baseline = clone(this.data);
  }
};

export async function closeDb() {
  if (pool) await pool.end();
}

export async function pingDb() {
  if (!pool) return { local: true, path: LOCAL_DB_PATH };
  await ensureSchema();
  const result = await pool.query('SELECT NOW() AS now');
  return result.rows[0]?.now || null;
}

export const { mutate, readDb } = createDbAccess(db, defaultData);
