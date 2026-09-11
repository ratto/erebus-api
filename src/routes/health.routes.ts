import { Router } from 'express';

import { container } from '../container/container';
import { TYPES } from '../container/types';
import { HealthController } from '../controllers/health.controller';

const router = Router();
const controller = container.get<HealthController>(TYPES.HealthController);

/**
 * @openapi
 * /v1/health:
 *   get:
 *     tags: [Operations]
 *     summary: Reports the operational state of the API and its data source
 *     description: >
 *       Always answers 200. `status` is `ok` when the SQLite probe succeeded on
 *       this request and `degraded` when the driver failed. The response is
 *       never cached.
 *     responses:
 *       200:
 *         description: Current health snapshot.
 *         headers:
 *           Cache-Control:
 *             schema: { type: string }
 *             description: Always `no-store`.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/HealthResponse' }
 *       500:
 *         description: Unexpected failure (RFC 7807).
 *         content:
 *           application/problem+json:
 *             schema: { $ref: '#/components/schemas/ProblemDetails' }
 */
router.get('/', controller.get);

export const healthRoutes = router;
