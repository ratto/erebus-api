/**
 * Loads every curated catalogue document into the SQLite artefact.
 *
 * Runs on the **writable** configuration (`knexMigrationConfig`) and never
 * imports `knexClient`, which stays read-only: that boundary is what keeps the
 * running service physically unable to write (ADR-003 §4). Seeding is idempotent
 * by truncate-and-reload, so running it twice produces identical content.
 */
import knex from 'knex';

import skillsCatalogue from '../seeds/skills.level1.json';
import { knexMigrationConfig } from '../src/infra/database/knexfile';
import { logger } from '../src/infra/logger/logger';

import { seedSkills } from './seeders/skills.seeder';

async function seedDatabase(): Promise<void> {
  const writableKnex = knex(knexMigrationConfig);

  try {
    const counts = await seedSkills(writableKnex, skillsCatalogue.skills);

    logger.info({ table: 'skills', ...counts }, 'Seeded the skills catalogue.');
  } finally {
    await writableKnex.destroy();
  }
}

await seedDatabase();
