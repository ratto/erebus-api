import 'reflect-metadata';

import express, { type Express } from 'express';

import { mountSwagger } from './infra/swagger/swagger';
import { errorHandler } from './middlewares/error-handler.middleware';
import { requestLogger } from './middlewares/request-logger.middleware';
import { registerRoutes } from './routes/index.routes';

/**
 * Builds the Express application without binding it to a port.
 *
 * Middleware order is normative (LLD §7.10): logger → swagger → routes → error
 * handler. The 404 handler slots in between routes and the error handler once
 * the standardised error format US delivers its concrete error classes.
 * @returns The assembled application; the caller decides how to serve it.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());
  app.use(requestLogger);

  mountSwagger(app);
  registerRoutes(app);

  app.use(errorHandler);

  return app;
}
