import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, defaultData, closeDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = process.argv[2] || path.resolve(__dirname, '../data/db.json');

try {
  const raw = await fs.readFile(source, 'utf8');
  const legacy = JSON.parse(raw);
  await db.read();

  let imported = 0;
  for (const key of Object.keys(defaultData)) {
    if (!Array.isArray(legacy[key])) continue;
    const existing = new Map((db.data[key] || []).map((item) => [String(item.id || ''), item]));
    for (const item of legacy[key]) {
      if (!item?.id) continue;
      existing.set(String(item.id), item);
      imported += 1;
    }
    db.data[key] = [...existing.values()];
  }

  await db.write();
  console.log(`Imported ${imported} records from ${source} into Neon PostgreSQL.`);
} finally {
  await closeDb();
}
