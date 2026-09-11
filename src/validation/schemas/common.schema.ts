import { z } from 'zod';

/** Positive integer `:id` path parameter, shared by every detail endpoint. */
export const idParamSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();

/**
 * Provenance level filter: 1 canonical, 2 official, 3 curated community.
 * Level 4 is rejected here as well as by the database CHECK constraint.
 */
export const sourceLevelSchema = z.coerce.number().int().min(1).max(3).optional();

/** Partial name filter, trimmed and bounded. */
export const nameSchema = z.string().trim().min(1).max(120).optional();

/**
 * Boolean query parameter.
 *
 * `z.coerce.boolean()` maps every non-empty string to `true`, including
 * `'false'`, so the accepted values are enumerated explicitly instead.
 */
export const booleanQuerySchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')
  .optional();
