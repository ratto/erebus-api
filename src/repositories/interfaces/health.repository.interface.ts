/** Liveness probe against the SQLite artefact backing the catalogue. */
export interface IHealthRepository {
  /**
   * Executes a minimal read against the database to prove the connection, the
   * file handle and the read-only flag are all usable.
   * @returns `true` when the probe succeeded, `false` when the driver failed.
   *          Never throws — a driver error is logged and reported as `false`.
   */
  checkConnection(): Promise<boolean>;
}
