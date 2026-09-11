/** Operational state of the API and its data source. */
export type HealthStatus = 'ok' | 'degraded';

/** Response shape of `GET /v1/health`. */
export interface HealthResponseDto {
  /** `'ok'` when the SQLite probe succeeded on this request, `'degraded'` otherwise. */
  status: HealthStatus;
  /** Application version reported by configuration. */
  version: string;
  /** Milliseconds since this process started; integer, never negative. */
  uptimeMs: number;
}
