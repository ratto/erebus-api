export { knexConfig, knexMigrationConfig } from './src/infra/database/knexfile';

// The Knex CLI resolves the configuration it is pointed at by name, so the
// writable configuration is also exported as `development` — the default
// environment key — to keep `knex migrate:latest` free of extra flags (ADR-003 §4).
export { knexMigrationConfig as development } from './src/infra/database/knexfile';
