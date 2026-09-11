import { env } from '../../config/env';

import type { Knex } from 'knex';

/**
 * Canonical Knex configuration for the embedded, read-only SQLite artefact
 * (LLD §12.3). Re-exported from the repository root `knexfile.ts` so the Knex
 * CLI can discover it.
 */
export const knexConfig: Knex.Config = {
  client: 'better-sqlite3',
  connection: {
    filename: env.DATABASE_PATH,
    options: { readonly: true },
  },
  useNullAsDefault: true,
  pool: { min: 1, max: 1 },
};
