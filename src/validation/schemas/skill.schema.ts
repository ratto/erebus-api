import { z } from 'zod';

import { BASE_ATTRIBUTE_VALUES } from '../../models/enums/base-attribute.enum';

import { booleanQuerySchema, nameSchema, sourceLevelSchema } from './common.schema';

/**
 * Query contract of `GET /v1/skills` (CONTRACT.md §2.1). Strict: an unknown
 * parameter is a client defect and is answered with 400 rather than ignored.
 */
export const skillListQuerySchema = z
  .object({
    name: nameSchema,
    sourceLevel: sourceLevelSchema,
    baseAttribute: z.enum(BASE_ATTRIBUTE_VALUES as [string, ...string[]]).optional(),
    rootOnly: booleanQuerySchema,
  })
  .strict();
