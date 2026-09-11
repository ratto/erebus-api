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
        SkillResponse: {
          type: 'object',
          required: [
            'id',
            'name',
            'parentSkillId',
            'parentSkillName',
            'hasSubgroups',
            'baseAttribute',
            'effectiveBaseAttribute',
            'category',
            'description',
            'initialValueType',
            'prerequisite',
            'damage',
            'notes',
            'sourceLevel',
            'source',
            'editionOrVersion',
          ],
          properties: {
            id: { type: 'integer', example: 41 },
            name: { type: 'string', example: 'Automóvel' },
            parentSkillId: {
              type: 'integer',
              nullable: true,
              description: 'Group this skill belongs to; null for a group skill.',
            },
            parentSkillName: { type: 'string', nullable: true, example: 'Condução' },
            hasSubgroups: {
              type: 'boolean',
              description: 'True for a navigation node, which is not purchasable on its own.',
            },
            baseAttribute: {
              type: 'string',
              nullable: true,
              enum: ['AGI', 'CAR', 'CON', 'DEX', 'FR', 'INT', 'PER', 'WILL'],
              description: 'Attribute the skill itself declares; null when it varies by subgroup.',
            },
            effectiveBaseAttribute: {
              type: 'string',
              nullable: true,
              enum: ['AGI', 'CAR', 'CON', 'DEX', 'FR', 'INT', 'PER', 'WILL'],
              description:
                'The skill own attribute, or its group one when it declares none. Null is a valid canonical state.',
            },
            category: {
              type: 'string',
              nullable: true,
              example: 'condução',
              description: 'N3 classification; non-null only for the Condução subgroups.',
            },
            description: { type: 'string', nullable: true },
            initialValueType: {
              type: 'string',
              nullable: true,
              enum: ['instinctive', 'technical', 'related'],
            },
            prerequisite: { type: 'string', nullable: true },
            damage: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
            sourceLevel: { type: 'integer', enum: [1, 2, 3] },
            source: {
              type: 'string',
              example: 'pericias.json → Condução.subgrupos · manual l.809',
            },
            editionOrVersion: {
              type: 'string',
              nullable: true,
              example: 'Manual Básico 1.04 (dez/2022)',
            },
          },
        },
        SkillDetailResponse: {
          allOf: [
            { $ref: '#/components/schemas/SkillResponse' },
            {
              type: 'object',
              required: ['subgroups'],
              properties: {
                subgroups: {
                  type: 'array',
                  description:
                    'Direct children, ordered by name. Always present; empty for a leaf skill.',
                  items: { $ref: '#/components/schemas/SkillResponse' },
                },
              },
            },
          ],
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
