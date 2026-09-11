import { z } from 'zod';

/**
 * Schema of every environment variable the service reads.
 * Parsing happens once at module load, so an invalid value fails the process at
 * startup rather than at request time.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_PATH: z.string().default('./data/erebus.sqlite'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  API_VERSION: z.string().default('1.0.0'),
});

/**
 * Typed, validated view over the process environment.
 * This module is the **only** place in the codebase that reads `process.env`
 * (LLD §12.2); every other module imports `env` from here.
 */
export const env = envSchema.parse(process.env);

/** Shape of the validated configuration, for consumers that need the type. */
export type Env = z.infer<typeof envSchema>;
