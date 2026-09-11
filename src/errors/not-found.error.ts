import { AppError } from './app-error';

/**
 * Raised when a requested resource does not exist.
 *
 * Only a service (or the unmatched-route middleware) throws it: a repository
 * reports absence by returning `null` (LLD §7.2).
 */
export class NotFoundError extends AppError {
  public readonly status = 404;
  public readonly problemType = 'https://erebus.dev/problems/not-found';
  public readonly title = 'Resource not found';

  /**
   * @param message Human-readable `detail`, naming what was looked up, e.g.
   *        `Skill with id 999 was not found.`
   */
  public constructor(message: string) {
    super(message);
  }
}
