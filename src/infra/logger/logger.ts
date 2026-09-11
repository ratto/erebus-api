import pino from 'pino';

import { env } from '../../config/env';

/**
 * Process-wide structured logger.
 * `console.log` is forbidden in `src/` (LLD §12.1) — every diagnostic goes
 * through this instance, which redacts the authorization header.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'erebus-api', version: env.API_VERSION },
  redact: { paths: ['req.headers.authorization'], remove: true },
});
