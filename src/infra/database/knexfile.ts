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

/**
 * Writable twin of {@link knexConfig}, used **only** by the Knex CLI and by
 * `scripts/**` to build the artefact (ADR-003 §4). It differs from the runtime
 * configuration in exactly two intentional ways: the SQLite file is opened for
 * writing, and the migrations directory is declared.
 *
 * `src/**` MUST NOT import this configuration, and `scripts/**` MUST NOT import
 * `knexClient` — that single boundary is what keeps the running service
 * physically unable to write.
 */
export const knexMigrationConfig: Knex.Config = {
  ...knexConfig,
  connection: {
    filename: env.DATABASE_PATH,
    options: { readonly: false },
  },
  migrations: {
    directory: './src/infra/database/migrations',
    extension: 'ts',
    loadExtensions: ['.ts'],
  },
};
