import { pinoHttp } from 'pino-http';

import { logger } from '../infra/logger/logger';

/** Logs one structured line per completed request, with secrets redacted. */
export const requestLogger = pinoHttp({ logger });
