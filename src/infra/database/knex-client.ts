import knex from 'knex';

import { knexConfig } from './knexfile';

/**
 * Single, process-wide Knex instance over the read-only SQLite artefact.
 * `better-sqlite3` is synchronous and the file is opened read-only, so a pool of
 * one connection is correct and avoids opening several file handles per cold
 * start (LLD §12.3).
 */
export const knexClient = knex(knexConfig);
