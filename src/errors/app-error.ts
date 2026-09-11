/**
 * Base class for every error that maps deterministically to an HTTP status.
 *
 * Concrete subclasses (`NotFoundError`, `ValidationError`) are deliberately not
 * part of this increment — they belong to the standardised error-format US. The
 * abstract base exists now because the error-handler middleware needs a type to
 * branch on.
 */
export abstract class AppError extends Error {
  /** HTTP status this error translates to. */
  public abstract readonly status: number;
  /** RFC 7807 `type` URI identifying the problem class. */
  public abstract readonly problemType: string;
  /** RFC 7807 `title`: a short, human-readable summary. */
  public abstract readonly title: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace?.(this, new.target);
  }
}
