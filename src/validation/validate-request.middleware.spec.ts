import { z } from 'zod';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ValidationError } from '../errors/validation.error';

import { validateRequest } from './validate-request.middleware';

import type { NextFunction, Request, Response } from 'express';

const schema = z
  .object({
    name: z.string().trim().min(1).optional(),
  })
  .strict();

describe('validateRequest', () => {
  let response: Response;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    response = { locals: {} } as Response;
    next = vi.fn();
  });

  it('stores the parsed data on res.locals.validated and continues', () => {
    const request = { query: { name: '  espada  ' } } as unknown as Request;

    validateRequest('query', schema)(request, response, next as unknown as NextFunction);

    expect(response.locals.validated).toEqual({ name: 'espada' });
    expect(next).toHaveBeenCalledWith();
  });

  it('merges the parsed data with what an earlier middleware validated', () => {
    response.locals.validated = { id: 7 };
    const request = { query: { name: 'espada' } } as unknown as Request;

    validateRequest('query', schema)(request, response, next as unknown as NextFunction);

    expect(response.locals.validated).toEqual({ id: 7, name: 'espada' });
  });

  it('never mutates the request, which is a getter in Express 5', () => {
    const query = { name: 'espada' };
    const request = { query } as unknown as Request;

    validateRequest('query', schema)(request, response, next as unknown as NextFunction);

    expect(query).toEqual({ name: 'espada' });
  });

  it('delegates a ValidationError carrying one issue per invalid field', () => {
    const request = { query: { bogus: '1' } } as unknown as Request;

    validateRequest('query', schema)(request, response, next as unknown as NextFunction);

    const error: unknown = next.mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).issues[0]?.field).toBe('bogus');
  });

  it('does not write to res.locals when validation failed', () => {
    const request = { query: { bogus: '1' } } as unknown as Request;

    validateRequest('query', schema)(request, response, next as unknown as NextFunction);

    expect(response.locals.validated).toBeUndefined();
  });

  it('reports the path of a nested invalid field as a dotted name', () => {
    const nestedSchema = z.object({ filter: z.object({ name: z.string() }) });
    const request = { body: { filter: { name: 42 } } } as unknown as Request;

    validateRequest('body', nestedSchema)(request, response, next as unknown as NextFunction);

    const error: unknown = next.mock.calls[0]?.[0];
    expect((error as ValidationError).issues[0]?.field).toBe('filter.name');
  });
});
