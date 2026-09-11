import { inject, injectable } from 'inversify';

import { env } from '../config/env';
import { TYPES } from '../container/types';

import type { HealthResponseDto } from '../models/dtos/health.dto';
import type { IHealthRepository } from '../repositories/interfaces/health.repository.interface';
import type { IHealthService } from './interfaces/health.service.interface';

/** Composes the operational health snapshot of the API and its data source. */
@injectable()
export class HealthService implements IHealthService {
  public constructor(
    @inject(TYPES.HealthRepository)
    private readonly repository: IHealthRepository,
  ) {}

  /**
   * Probes the data source and composes the current health snapshot.
   * @returns The health payload, with status `'ok'` when the probe succeeded and
   *          `'degraded'` when it did not.
   */
  public async check(): Promise<HealthResponseDto> {
    const isConnected = await this.repository.checkConnection();

    return {
      status: isConnected ? 'ok' : 'degraded',
      version: env.API_VERSION,
      uptimeMs: Math.max(0, Math.round(process.uptime() * 1000)),
    };
  }
}
