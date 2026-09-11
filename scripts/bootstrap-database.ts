/**
 * Creates the local SQLite artefact if it does not exist yet.
 *
 * This is a **developer-ergonomics script, not a migration pipeline**: it creates
 * no table and no data. A read-only `better-sqlite3` connection fails against a
 * missing file, so a fresh clone needs the database file to exist before
 * `/v1/health` can probe it. SQLite treats a zero-length file as a valid, empty
 * database, so touching the file is enough. The migration file layout and the
 * seed pipeline are deliberately unspecified (LLD §6.6, open item 2) and owned
 * by `tech-lead`.
 */
import { closeSync, mkdirSync, openSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { env } from '../src/config/env';
import { logger } from '../src/infra/logger/logger';

function bootstrapDatabase(): void {
  const filename = resolve(env.DATABASE_PATH);

  mkdirSync(dirname(filename), { recursive: true });
  closeSync(openSync(filename, 'a'));

  logger.info({ filename }, 'SQLite artefact is ready (no table created).');
}

bootstrapDatabase();
