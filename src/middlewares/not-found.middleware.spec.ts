import { describe, expect, it, vi } from 'vitest';

import { NotFoundError } from '../errors/not-found.error';

import { notFoundHandler } from './not-found.middleware';

import type { Request, Response } from 'express';

describe('notFoundHandler', () => {
  it('delegates an unmatched route to the error handler as a NotFoundError', () => {
    const request = { method: 'GET', originalUrl: '/v1/does-not-exist' } as Request;
    const next = vi.fn();

    notFoundHandler(request, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error: unknown = next.mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(NotFoundError);
    expect((error as NotFoundError).message).toBe('Route GET /v1/does-not-exist was not found.');
  });
});
