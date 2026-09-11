import { ValidationError } from '../errors/validation.error';

import type { ValidationIssue } from '../errors/validation.error';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodIssue, ZodSchema } from 'zod';

/** Section of the request a schema can be applied to. */
type RequestPart = 'params' | 'query' | 'body';

/**
 * Translates one Zod issue into the client-facing shape.
 *
 * A strict-mode rejection carries the offending keys in `keys` and an empty
 * `path`, so it is expanded into one issue per unknown parameter — otherwise the
 * client would be told that the field `""` is invalid.
 * @param issue Issue reported by Zod.
 */
function toValidationIssues(issue: ZodIssue): ValidationIssue[] {
  if (issue.code === 'unrecognized_keys') {
    return issue.keys.map((key) => ({
      field: key,
      message: `Unknown parameter "${key}".`,
    }));
  }

  return [{ field: issue.path.join('.'), message: issue.message }];
}

/**
 * Builds a middleware that validates one part of the request against a schema.
 *
 * The parsed result is merged into `res.locals.validated` rather than assigned
 * back onto the request, because `req.query` is a getter in Express 5 (LLD §7.6).
 * Chaining two of these — params then query — therefore accumulates into one
 * validated object.
 * @param part Request section to validate.
 * @param schema Zod schema describing the expected shape.
 * @returns A middleware that continues on success and delegates a
 *          {@link ValidationError} to the error handler on failure.
 */
export function validateRequest(part: RequestPart, schema: ZodSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      next(new ValidationError(result.error.issues.flatMap(toValidationIssues)));
      return;
    }

    // `ZodSchema` erases its output type, so the parsed data is narrowed once
    // here; the concrete shape is asserted by the consuming controller.
    const validated = result.data as Record<string, unknown>;
    const alreadyValidated = (res.locals.validated ?? {}) as Record<string, unknown>;

    res.locals.validated = { ...alreadyValidated, ...validated };
    next();
  };
}
