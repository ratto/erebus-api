import { inject, injectable } from 'inversify';

import { TYPES } from '../container/types';

import type { NextFunction, Request, Response } from 'express';
import type { IHealthService } from '../services/interfaces/health.service.interface';

/** Adapts `GET /v1/health` to the health service. */
@injectable()
export class HealthController {
  public constructor(
    @inject(TYPES.HealthService)
    private readonly service: IHealthService,
  ) {}

  /**
   * Serialises the current health snapshot.
   * The response is never cached: a stale health payload is worse than none
   * (LLD §13.4).
   */
  public get = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const health = await this.service.check();

      res.set('Cache-Control', 'no-store');
      res.status(200).json(health);
    } catch (error) {
      next(error);
    }
  };
}
