import { type Express, Router } from 'express';

import { healthRoutes } from './health.routes';

/**
 * Mounts every router under the `/v1` prefix. The prefix is applied here and
 * nowhere else, so a future `/v2` is a new router rather than a mutation
 * (LLD §13.2).
 * @param app Express application being assembled.
 */
export function registerRoutes(app: Express): void {
  const v1 = Router();

  v1.use('/health', healthRoutes);

  app.use('/v1', v1);
}
