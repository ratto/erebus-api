import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../errors/app-error';
import { logger } from '../infra/logger/logger';

import { errorHandler } from './error-handler.middleware';

import type { NextFunction, Request, Response } from 'express';

/**
 * Minimal concrete `AppError` used only by this spec. Production subclasses are
 * owned by the standardised error-format US and do not exist yet.
 */
class TeapotError extends AppError {
  public readonly status = 418;
  public readonly problemType = 'https://erebus.dev/problems/teapot';
  public readonly title = 'I am a teapot';

  public constructor(message: string) {
    super(message);
  }
}

describe('errorHandler', () => {
  let request: Request;
  let response: Response;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    request = { originalUrl: '/v1/health' } as Request;
    response = {
      type: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    next = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when the error is an AppError', () => {
    it('answers with the problem details the error declares', () => {
      errorHandler(new TeapotError('Short and stout.'), request, response, next);

      expect(response.status).toHaveBeenCalledWith(418);
      expect(response.type).toHaveBeenCalledWith('application/problem+json');
      expect(response.json).toHaveBeenCalledWith({
        type: 'https://erebus.dev/problems/teapot',
        title: 'I am a teapot',
        status: 418,
        detail: 'Short and stout.',
        instance: '/v1/health',
      });
    });

    it('does not log a handled domain error as an unexpected failure', () => {
      errorHandler(new TeapotError('Short and stout.'), request, response, next);

      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  describe('when the error is unexpected', () => {
    it('answers 500 without leaking the original message', () => {
      errorHandler(new Error('database password is hunter2'), request, response, next);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.type).toHaveBeenCalledWith('application/problem+json');
      expect(response.json).toHaveBeenCalledWith({
        type: 'https://erebus.dev/problems/internal-error',
        title: 'Internal server error',
        status: 500,
        detail: 'An unexpected error occurred.',
        instance: '/v1/health',
      });
    });

    it('logs the full error for operators', () => {
      const failure = new Error('boom');

      errorHandler(failure, request, response, next);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        { err: failure, url: '/v1/health' },
        'Unhandled error',
      );
    });
  });
});
