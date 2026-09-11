import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { env } from '../../config/env';

import type { Express } from 'express';

/**
 * OpenAPI document built from the `@openapi` annotations in `src/routes/**`.
 * The spec is never hand-maintained in a separate file (LLD §13.3).
 */
const openApiSpecification: object = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'erebus-api',
      version: env.API_VERSION,
      description: 'Read-only REST service over the Daemon System catalogue.',
    },
    servers: [{ url: '/' }],
    components: {
      schemas: {
        HealthResponse: {
          type: 'object',
          required: ['status', 'version', 'uptimeMs'],
          properties: {
            status: { type: 'string', enum: ['ok', 'degraded'] },
            version: { type: 'string', example: '1.0.0' },
            uptimeMs: { type: 'integer', minimum: 0, example: 41293 },
          },
        },
        ProblemDetails: {
          type: 'object',
          required: ['type', 'title', 'status'],
          properties: {
            type: { type: 'string', format: 'uri' },
            title: { type: 'string' },
            status: { type: 'integer' },
            detail: { type: 'string' },
            instance: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './dist/**/*.js'],
});

/**
 * Mounts the Swagger UI at `/v1/docs` and the raw document at `/v1/docs.json`.
 * @param app Express application being assembled.
 */
export function mountSwagger(app: Express): void {
  app.get('/v1/docs.json', (_req, res) => {
    res.json(openApiSpecification);
  });
  app.use('/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiSpecification));
}
