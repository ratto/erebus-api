import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { env } from '../config/env';

import { HealthService } from './health.service';

import type { IHealthRepository } from '../repositories/interfaces/health.repository.interface';

describe('HealthService', () => {
  let repository: IHealthRepository;
  let service: HealthService;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = { checkConnection: vi.fn() };
    service = new HealthService(repository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('check', () => {
    it('probes the data source exactly once, with no arguments', async () => {
      vi.mocked(repository.checkConnection).mockResolvedValue(true);

      await service.check();

      expect(repository.checkConnection).toHaveBeenCalledTimes(1);
      expect(repository.checkConnection).toHaveBeenCalledWith();
    });

    it("reports status 'ok' when the probe succeeds", async () => {
      vi.mocked(repository.checkConnection).mockResolvedValue(true);

      const result = await service.check();

      expect(result.status).toBe('ok');
    });

    it("reports status 'degraded' when the probe fails", async () => {
      vi.mocked(repository.checkConnection).mockResolvedValue(false);

      const result = await service.check();

      expect(result.status).toBe('degraded');
    });

    it('reports the configured API version', async () => {
      vi.mocked(repository.checkConnection).mockResolvedValue(true);

      const result = await service.check();

      expect(result.version).toBe(env.API_VERSION);
    });

    it('reports uptime in whole milliseconds derived from process uptime', async () => {
      vi.mocked(repository.checkConnection).mockResolvedValue(true);
      vi.spyOn(process, 'uptime').mockReturnValue(12.3456);

      const result = await service.check();

      expect(result.uptimeMs).toBe(12346);
      expect(Number.isInteger(result.uptimeMs)).toBe(true);
    });

    it('never reports a negative uptime', async () => {
      vi.mocked(repository.checkConnection).mockResolvedValue(true);
      vi.spyOn(process, 'uptime').mockReturnValue(-1);

      const result = await service.check();

      expect(result.uptimeMs).toBe(0);
    });
  });
});
