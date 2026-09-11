import { AppError } from '../errors/app-error';
import { ValidationError } from '../errors/validation.error';
import { logger } from '../infra/logger/logger';

import type { NextFunction, Request, Response } from 'express';

/**
 * Translates any thrown error into an RFC 7807 Problem Details response.
 *
 * Must stay four-parameter and be registered last, otherwise Express does not
 * recognise it as an error handler (LLD §7.9). An unexpected error is logged in
 * full and answered with a generic body — the real message and the stack never
 * reach the client.
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    const body: Record<string, unknown> = {
      type: error.problemType,
      title: error.title,
      status: error.status,
      detail: error.message,
      instance: req.originalUrl,
    };

    if (error instanceof ValidationError) {
      body.errors = error.issues;
    }

    res.status(error.status).type('application/problem+json').json(body);
    return;
  }

  logger.error({ err: error, url: req.originalUrl }, 'Unhandled error');

  res.status(500).type('application/problem+json').json({
    type: 'https://erebus.dev/problems/internal-error',
    title: 'Internal server error',
    status: 500,
    detail: 'An unexpected error occurred.',
    instance: req.originalUrl,
  });
}
