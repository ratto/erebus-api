/**
 * Runtime identities of every injectable. Interfaces vanish at compile time,
 * so a `Symbol` token is what Inversify resolves against. String tokens are
 * forbidden (LLD §9.1).
 */
export const TYPES = {
  // Infrastructure
  Knex: Symbol.for('Knex'),
  Logger: Symbol.for('Logger'),

  // Repositories
  HealthRepository: Symbol.for('HealthRepository'),

  // Services
  HealthService: Symbol.for('HealthService'),

  // Controllers
  HealthController: Symbol.for('HealthController'),
} as const;
