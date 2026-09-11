import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HealthController } from './health.controller';

import type { NextFunction, Request, Response } from 'express';
import type { HealthResponseDto } from '../models/dtos/health.dto';
import type { IHealthService } from '../services/interfaces/health.service.interface';

const buildHealth = (overrides: Partial<HealthResponseDto> = {}): HealthResponseDto => ({
  status: 'ok',
  version: '1.0.0',
  uptimeMs: 41293,
  ...overrides,
});

describe('HealthController', () => {
  let service: IHealthService;
  let controller: HealthController;
  let request: Request;
  let response: Response;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    service = { check: vi.fn() };
    controller = new HealthController(service);
    request = {} as Request;
    response = {
      set: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    next = vi.fn();
  });

  describe('get', () => {
    it('asks the service for the health snapshot exactly once', async () => {
      vi.mocked(service.check).mockResolvedValue(buildHealth());

      await controller.get(request, response, next);

      expect(service.check).toHaveBeenCalledTimes(1);
    });

    it('responds 200 with the service payload, unmodified', async () => {
      const payload = buildHealth({ status: 'degraded' });
      vi.mocked(service.check).mockResolvedValue(payload);

      await controller.get(request, response, next);

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(payload);
    });

    it('forbids caching of the health response', async () => {
      vi.mocked(service.check).mockResolvedValue(buildHealth());

      await controller.get(request, response, next);

      expect(response.set).toHaveBeenCalledWith('Cache-Control', 'no-store');
    });

    it('delegates a service failure to next without writing a response body', async () => {
      const failure = new Error('boom');
      vi.mocked(service.check).mockRejectedValue(failure);

      await controller.get(request, response, next);

      expect(next).toHaveBeenCalledWith(failure);
      expect(response.json).not.toHaveBeenCalled();
    });
  });
});
