import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { skills, weapons } from './schema.ts';

const databaseUrl = process.env['DATABASE_URL'] ?? './data/erebus.db';

// Ensure the directory exists before opening the SQLite file
if (!databaseUrl.startsWith(':')) {
  mkdirSync(dirname(databaseUrl), { recursive: true });
}

const sqlite = new Database(databaseUrl);
export const db = drizzle({ client: sqlite, schema: { skills, weapons } });
