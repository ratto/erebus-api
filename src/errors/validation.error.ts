import { AppError } from './app-error';

/** One invalid request parameter, reported back to the client. */
export interface ValidationIssue {
  /** Dotted path of the offending field, e.g. `sourceLevel`. */
  field: string;
  /** Why the value was rejected. */
  message: string;
}

/**
 * Raised when request parameters fail schema validation.
 *
 * Carries the per-field issues that the error handler appends to the RFC 7807
 * body as the non-standard `errors` array (LLD §5.3).
 */
export class ValidationError extends AppError {
  public readonly status = 400;
  public readonly problemType = 'https://erebus.dev/problems/validation-error';
  public readonly title = 'Invalid request parameters';

  /** Every rejected field of this request, in schema order. */
  public readonly issues: ValidationIssue[];

  /**
   * @param issues One entry per invalid field. The `detail` of the response is a
   *        fixed sentence, because the field-level reasons live in `issues`.
   */
  public constructor(issues: ValidationIssue[]) {
    super('One or more request parameters are invalid.');
    this.issues = issues;
  }
}
