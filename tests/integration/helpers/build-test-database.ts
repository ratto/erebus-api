import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';

import knex from 'knex';

/**
 * Creates a real, valid, empty SQLite file at the given path so a read-only
 * Knex connection can open it successfully.
 *
 * No domain table exists yet in this increment (LLD §6.6) and the health
 * probe (`select 1 as ok`) touches no table, so a bare SQLite header is
 * sufficient — this helper never runs a migration or a seed. It goes through
 * Knex (the project's own sanctioned SQL access point, §2.1) rather than
 * `better-sqlite3` directly, which also avoids depending on an untyped module
 * outside the LLD §2.2 dev-dependency set.
 * @param filePath Absolute path where the SQLite file should be created.
 */
export async function createEmptySqliteFile(filePath: string): Promise<void> {
  const directory = dirname(filePath);

  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  const writableConnection = knex({
    client: 'better-sqlite3',
    connection: { filename: filePath },
    useNullAsDefault: true,
  });

  // Forces the lazy driver to actually open (and thus create) the file.
  await writableConnection.raw('select 1');
  await writableConnection.destroy();
}

/**
 * Deletes a SQLite file created for a test, tolerating a path that was never
 * created or was already removed.
 * @param filePath Absolute path of the file to remove.
 */
export function removeSqliteFile(filePath: string): void {
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}
