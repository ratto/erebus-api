import { Router } from 'express';

import { container } from '../container/container';
import { TYPES } from '../container/types';
import { idParamSchema } from '../validation/schemas/common.schema';
import { skillListQuerySchema } from '../validation/schemas/skill.schema';
import { validateRequest } from '../validation/validate-request.middleware';

import type { SkillController } from '../controllers/skill.controller';

const router = Router();
const controller = container.get<SkillController>(TYPES.SkillController);

/**
 * @openapi
 * /v1/skills:
 *   get:
 *     tags: [Skills]
 *     summary: Lists the skills catalogue
 *     description: >
 *       Returns group skills (roots) and their subgroups as one flat, name-ordered
 *       array. The hierarchy is exactly two levels deep: a group has subgroups, a
 *       subgroup never does. A group with subgroups is a navigation node and is not
 *       purchasable on its own — `hasSubgroups` exposes that. An empty array is a
 *       valid answer; nothing matching is never a 404.
 *     parameters:
 *       - in: query
 *         name: name
 *         schema: { type: string, minLength: 1, maxLength: 120 }
 *         description: Partial, case-insensitive match on the skill's own name.
 *       - in: query
 *         name: sourceLevel
 *         schema: { type: integer, minimum: 1, maximum: 3 }
 *         description: 1 canonical, 2 official, 3 curated community.
 *       - in: query
 *         name: baseAttribute
 *         schema:
 *           type: string
 *           enum: [AGI, CAR, CON, DEX, FR, INT, PER, WILL]
 *         description: >
 *           Matches the effective attribute, i.e. the skill's own or, when it
 *           declares none, its group's. A subgroup that inherits its attribute is
 *           therefore returned.
 *       - in: query
 *         name: rootOnly
 *         schema: { type: string, enum: ['true', 'false'] }
 *         description: >
 *           `true` returns only the 36 group skills; omitted or `false` returns the
 *           whole catalogue.
 *     responses:
 *       200:
 *         description: Matching skills.
 *         headers:
 *           Cache-Control:
 *             schema: { type: string }
 *             description: Always `public, max-age=300, stale-while-revalidate=86400`.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/SkillResponse' }
 *       400:
 *         description: Invalid or unknown query parameter (RFC 7807).
 *         content:
 *           application/problem+json:
 *             schema: { $ref: '#/components/schemas/ProblemDetails' }
 *       500:
 *         description: Unexpected failure (RFC 7807).
 *         content:
 *           application/problem+json:
 *             schema: { $ref: '#/components/schemas/ProblemDetails' }
 */
router.get('/', validateRequest('query', skillListQuerySchema), controller.list);

/**
 * @openapi
 * /v1/skills/{id}:
 *   get:
 *     tags: [Skills]
 *     summary: Retrieves a skill and its direct subgroups
 *     description: >
 *       `subgroups` is always present and always an array: it is `[]` for a leaf
 *       skill and for a group with no catalogued children. A null `baseAttribute`
 *       or `effectiveBaseAttribute` is a valid canonical state, not an error.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: The skill detail.
 *         headers:
 *           Cache-Control:
 *             schema: { type: string }
 *             description: Always `public, max-age=300, stale-while-revalidate=86400`.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SkillDetailResponse' }
 *       400:
 *         description: Non-numeric or non-positive id (RFC 7807).
 *         content:
 *           application/problem+json:
 *             schema: { $ref: '#/components/schemas/ProblemDetails' }
 *       404:
 *         description: No skill has that id (RFC 7807).
 *         content:
 *           application/problem+json:
 *             schema: { $ref: '#/components/schemas/ProblemDetails' }
 *       500:
 *         description: Unexpected failure (RFC 7807).
 *         content:
 *           application/problem+json:
 *             schema: { $ref: '#/components/schemas/ProblemDetails' }
 */
router.get('/:id', validateRequest('params', idParamSchema), controller.getById);

export const skillRoutes = router;
