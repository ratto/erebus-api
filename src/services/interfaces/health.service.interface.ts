import type { HealthResponseDto } from '../../models/dtos/health.dto';

/** Application rules for the operational health endpoint. */
export interface IHealthService {
  /**
   * Probes the data source and composes the current health snapshot.
   * @returns The health payload. Never throws for a database failure, which is
   *          reported as status `'degraded'`.
   */
  check(): Promise<HealthResponseDto>;
}
