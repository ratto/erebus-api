import { inject, injectable } from 'inversify';

import { TYPES } from '../container/types';

import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { IHealthRepository } from './interfaces/health.repository.interface';

/** Liveness probe over the read-only SQLite artefact. */
@injectable()
export class HealthRepository implements IHealthRepository {
  /**
   * Constant probe statement. This is the only sanctioned `knex.raw` call in the
   * codebase: it interpolates nothing and reads no table, because no domain
   * table exists yet.
   */
  private static readonly PROBE_STATEMENT = 'select 1 as ok';

  public constructor(
    @inject(TYPES.Knex) private readonly knex: Knex,
    @inject(TYPES.Logger) private readonly logger: Logger,
  ) {}

  /**
   * Executes the probe statement to prove the connection, the file handle and
   * the read-only flag are usable.
   * @returns `true` when the probe succeeded, `false` when the driver failed.
   *          Never throws — a health check that answers is worth more than one
   *          that crashes.
   */
  public async checkConnection(): Promise<boolean> {
    try {
      await this.knex.raw(HealthRepository.PROBE_STATEMENT);
      return true;
    } catch (error) {
      this.logger.error({ err: error }, 'SQLite health probe failed.');
      return false;
    }
  }
}
