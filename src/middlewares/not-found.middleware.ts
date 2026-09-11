import { NotFoundError } from '../errors/not-found.error';

import type { NextFunction, Request, Response } from 'express';

/**
 * Answers any request that matched no route with the same RFC 7807 body every
 * other error uses, instead of Express's default HTML page (LLD §5.3).
 *
 * Registered after the routers and before the error handler (LLD §7.10).
 * @param req Incoming request.
 * @param _res Unused: the response is written by the error handler.
 * @param next Express continuation, invoked with the domain error.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} was not found.`));
}
