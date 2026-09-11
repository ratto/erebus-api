import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import knex from 'knex';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { up as createSkillsTable } from '../../src/infra/database/migrations/20260911120000_create_skills_table';

import { removeSqliteFile } from './helpers/build-test-database';
import { insertSkillFixtures } from './helpers/fixtures/skills.fixture';

import type { Express } from 'express';
import type { Knex } from 'knex';
import type { SkillFixtureIds } from './helpers/fixtures/skills.fixture';

/** Shape asserted against one element of `GET /v1/skills`. */
interface SkillResponseBody {
  id: number;
  name: string;
  parentSkillId: number | null;
  parentSkillName: string | null;
  hasSubgroups: boolean;
  baseAttribute: string | null;
  effectiveBaseAttribute: string | null;
  category: string | null;
  description: string | null;
  initialValueType: string | null;
  prerequisite: string | null;
  damage: string | null;
  notes: string | null;
  sourceLevel: number;
  source: string;
  editionOrVersion: string | null;
}

/** `GET /v1/skills/:id` adds the direct subgroups to the list shape. */
interface SkillDetailResponseBody extends SkillResponseBody {
  subgroups: SkillResponseBody[];
}

/** Minimal shape of an RFC 7807 Problem Details body (LLD §5.3). */
interface ProblemDetailsBody {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: Array<{ field: string; message: string }>;
}

/** An assembled test app plus a handle on its own Knex client, for teardown. */
interface TestAppHandle {
  app: Express;
  knexClient: Knex;
}

const ORIGINAL_DATABASE_PATH = process.env.DATABASE_PATH;

/**
 * Creates a real SQLite file at the given path, applies the `skills` migration
 * to it (ADR-003: integration tests SHOULD apply the schema by running the
 * migrations, so a DDL drift from LLD §6.3 fails this suite) and inserts the
 * hand-written fixture — never the production seed pipeline (LLD §10.3).
 * @param databasePath Absolute path of the SQLite file to create.
 * @returns The fixture's assigned ids, for assertions.
 */
async function buildFixtureDatabase(databasePath: string): Promise<SkillFixtureIds> {
  const writableKnex = knex({
    client: 'better-sqlite3',
    connection: { filename: databasePath },
    useNullAsDefault: true,
  });

  await createSkillsTable(writableKnex);
  const ids = await insertSkillFixtures(writableKnex);
  await writableKnex.destroy();

  return ids;
}

/**
 * Boots a fresh `Express` application wired against a real SQLite file at the
 * given path, following the same singleton-graph rebuild pattern as
 * `tests/integration/health.routes.int.spec.ts` (LLD §9.4/§10.3): the only way
 * to point the whole composition root at a per-test SQLite file is to set
 * `DATABASE_PATH` and force a clean module graph with `vi.resetModules()`
 * before a fresh dynamic `import()`. Nothing else in the graph is mocked.
 * @param databasePath Absolute path of the SQLite file the app should open.
 */
async function buildAppAgainst(databasePath: string): Promise<TestAppHandle> {
  vi.resetModules();
  process.env.DATABASE_PATH = databasePath;
  const { createApp } = await import('../../src/app');
  const { knexClient } = await import('../../src/infra/database/knex-client');
  return { app: createApp(), knexClient };
}

describe('GET /v1/skills', () => {
  const databasePath = join(tmpdir(), `erebus-skills-${randomUUID()}.sqlite`);
  let app: Express;
  let knexClient: Knex;
  let ids: SkillFixtureIds;

  beforeAll(async () => {
    ids = await buildFixtureDatabase(databasePath);
    ({ app, knexClient } = await buildAppAgainst(databasePath));
  });

  afterAll(async () => {
    await knexClient.destroy();
    removeSqliteFile(databasePath);
    process.env.DATABASE_PATH = ORIGINAL_DATABASE_PATH;
  });

  it('returns the whole catalogue ordered by name, with provenance on every element', async () => {
    const response = await request(app).get('/v1/skills');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = response.body as SkillResponseBody[];
    expect(body).toHaveLength(5);
    expect(body.map((skill) => skill.name)).toEqual([
      'Asa Delta',
      'Automóvel',
      'Condução',
      'Explosivos',
      'Ofícios',
    ]);
    for (const skill of body) {
      expect(skill).toMatchObject({
        sourceLevel: expect.any(Number),
        source: expect.any(String),
        editionOrVersion: expect.any(String),
      });
    }
  });

  it('sets the catalogue Cache-Control header on a successful list', async () => {
    const response = await request(app).get('/v1/skills');

    expect(response.headers['cache-control']).toBe(
      'public, max-age=300, stale-while-revalidate=86400',
    );
  });

  it('filters by a partial, case-insensitive name match', async () => {
    const response = await request(app).get('/v1/skills?name=autom');

    expect(response.status).toBe(200);
    const body = response.body as SkillResponseBody[];
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({ id: ids.automovelId, name: 'Automóvel' });
  });

  it('filters by exact sourceLevel', async () => {
    const response = await request(app).get('/v1/skills?sourceLevel=2');

    expect(response.status).toBe(200);
    const body = response.body as SkillResponseBody[];
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({ id: ids.oficiosId, name: 'Ofícios', sourceLevel: 2 });
  });

  it('rootOnly=true returns only the group skills (no parent)', async () => {
    const response = await request(app).get('/v1/skills?rootOnly=true');

    expect(response.status).toBe(200);
    const body = response.body as SkillResponseBody[];
    expect(body).toHaveLength(3);
    expect(body.every((skill) => skill.parentSkillId === null)).toBe(true);
    expect(body.map((skill) => skill.name).sort()).toEqual(['Condução', 'Explosivos', 'Ofícios']);
  });

  it('rootOnly=false is not coerced to true and still returns the whole catalogue (R2)', async () => {
    const response = await request(app).get('/v1/skills?rootOnly=false');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(5);
  });

  describe('baseAttribute filtering — inherited attribute (CONTRACT.md D7/R3)', () => {
    it('returns a subgroup whose own base_attribute is NULL but whose group declares the attribute', async () => {
      const response = await request(app).get('/v1/skills?baseAttribute=AGI');

      expect(response.status).toBe(200);
      const body = response.body as SkillResponseBody[];
      const names = body.map((skill) => skill.name).sort();

      // Condução (own AGI) and Automóvel (inherits AGI from Condução) both match;
      // Asa Delta (own DEX) must not, proving the self-join is qualified per
      // column rather than leaking the parent's attribute onto every child.
      expect(names).toEqual(['Automóvel', 'Condução']);

      const automovel = body.find((skill) => skill.id === ids.automovelId);
      expect(automovel).toMatchObject({
        baseAttribute: null,
        effectiveBaseAttribute: 'AGI',
      });
    });

    it('matches a subgroup by its own attribute without leaking the parent one (R3)', async () => {
      const response = await request(app).get('/v1/skills?baseAttribute=DEX');

      expect(response.status).toBe(200);
      const body = response.body as SkillResponseBody[];
      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({
        id: ids.asaDeltaId,
        baseAttribute: 'DEX',
        effectiveBaseAttribute: 'DEX',
      });
    });
  });

  it('rejects an unknown query parameter with an RFC 7807 validation-error body', async () => {
    const response = await request(app).get('/v1/skills?bogus=1');

    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toContain('application/problem+json');

    const body = response.body as ProblemDetailsBody;
    expect(body).toMatchObject({
      type: 'https://erebus.dev/problems/validation-error',
      title: 'Invalid request parameters',
      status: 400,
      instance: '/v1/skills?bogus=1',
    });
    expect(body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'bogus' })]),
    );
  });

  it('rejects an out-of-range sourceLevel with 400', async () => {
    const response = await request(app).get('/v1/skills?sourceLevel=9');

    expect(response.status).toBe(400);
    const body = response.body as ProblemDetailsBody;
    expect(body.type).toBe('https://erebus.dev/problems/validation-error');
    expect(body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'sourceLevel' })]),
    );
  });

  it('rejects an unknown baseAttribute enum value with 400', async () => {
    const response = await request(app).get('/v1/skills?baseAttribute=ZZZ');

    expect(response.status).toBe(400);
    const body = response.body as ProblemDetailsBody;
    expect(body.type).toBe('https://erebus.dev/problems/validation-error');
    expect(body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'baseAttribute' })]),
    );
  });
});

describe('GET /v1/skills/:id', () => {
  const databasePath = join(tmpdir(), `erebus-skill-detail-${randomUUID()}.sqlite`);
  let app: Express;
  let knexClient: Knex;
  let ids: SkillFixtureIds;

  beforeAll(async () => {
    ids = await buildFixtureDatabase(databasePath);
    ({ app, knexClient } = await buildAppAgainst(databasePath));
  });

  afterAll(async () => {
    await knexClient.destroy();
    removeSqliteFile(databasePath);
    process.env.DATABASE_PATH = ORIGINAL_DATABASE_PATH;
  });

  it('returns a group skill with its direct subgroups sorted by name', async () => {
    const response = await request(app).get(`/v1/skills/${ids.conducaoId}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.headers['cache-control']).toBe(
      'public, max-age=300, stale-while-revalidate=86400',
    );

    const body = response.body as SkillDetailResponseBody;
    expect(body).toMatchObject({
      id: ids.conducaoId,
      name: 'Condução',
      hasSubgroups: true,
      baseAttribute: 'AGI',
      effectiveBaseAttribute: 'AGI',
      sourceLevel: 1,
      source: expect.any(String),
      editionOrVersion: expect.any(String),
    });
    expect(body.subgroups).toHaveLength(2);
    expect(body.subgroups.map((subgroup) => subgroup.name)).toEqual(['Asa Delta', 'Automóvel']);
    for (const subgroup of body.subgroups) {
      expect(subgroup).toMatchObject({
        sourceLevel: expect.any(Number),
        source: expect.any(String),
        editionOrVersion: expect.any(String),
      });
    }
  });

  it('returns a leaf skill with an always-present, empty subgroups array', async () => {
    const response = await request(app).get(`/v1/skills/${ids.explosivosId}`);

    expect(response.status).toBe(200);
    const body = response.body as SkillDetailResponseBody;
    expect(body).toMatchObject({
      id: ids.explosivosId,
      name: 'Explosivos',
      hasSubgroups: false,
      baseAttribute: null,
      effectiveBaseAttribute: null,
    });
    expect(body.subgroups).toEqual([]);
  });

  it('resolves the inherited effective attribute on a subgroup detail', async () => {
    const response = await request(app).get(`/v1/skills/${ids.automovelId}`);

    expect(response.status).toBe(200);
    const body = response.body as SkillDetailResponseBody;
    expect(body).toMatchObject({
      id: ids.automovelId,
      name: 'Automóvel',
      parentSkillId: ids.conducaoId,
      parentSkillName: 'Condução',
      baseAttribute: null,
      effectiveBaseAttribute: 'AGI',
      category: 'condução',
    });
    expect(body.subgroups).toEqual([]);
  });

  it('answers an unknown id with an RFC 7807 not-found body', async () => {
    const response = await request(app).get('/v1/skills/999999');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toContain('application/problem+json');

    const body = response.body as ProblemDetailsBody;
    expect(body).toEqual({
      type: 'https://erebus.dev/problems/not-found',
      title: 'Resource not found',
      status: 404,
      detail: 'Skill with id 999999 was not found.',
      instance: '/v1/skills/999999',
    });
  });

  it('rejects a non-numeric id with an RFC 7807 validation-error body', async () => {
    const response = await request(app).get('/v1/skills/abc');

    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toContain('application/problem+json');

    const body = response.body as ProblemDetailsBody;
    expect(body.type).toBe('https://erebus.dev/problems/validation-error');
    expect(body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'id' })]));
  });

  it('rejects a non-positive id with an RFC 7807 validation-error body', async () => {
    const response = await request(app).get('/v1/skills/0');

    expect(response.status).toBe(400);
    const body = response.body as ProblemDetailsBody;
    expect(body.type).toBe('https://erebus.dev/problems/validation-error');
  });
});
