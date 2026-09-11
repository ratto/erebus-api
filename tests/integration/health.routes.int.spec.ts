import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { createEmptySqliteFile, removeSqliteFile } from './helpers/build-test-database';

import type { Express } from 'express';
import type { Knex } from 'knex';

/** Shape asserted against `GET /v1/health` responses in this file. */
interface HealthResponseBody {
  status: 'ok' | 'degraded';
  version: string;
  uptimeMs: number;
}

/** Minimal shape asserted against the OpenAPI document served at `/v1/docs.json`. */
interface OpenApiDocumentBody {
  openapi: string;
  paths: Record<string, unknown>;
}

/** An assembled test app plus a handle on its own Knex client, for teardown. */
interface TestAppHandle {
  app: Express;
  knexClient: Knex;
}

const ORIGINAL_DATABASE_PATH = process.env.DATABASE_PATH;

/**
 * Boots a fresh `Express` application wired against a real SQLite file at the
 * given path.
 *
 * `src/config/env.ts` and `src/infra/database/knex-client.ts` are module-level
 * singletons parsed once at import time, and `src/routes/health.routes.ts`
 * resolves its controller from the composition root as soon as it is
 * imported. The only way to point the whole graph at a different SQLite file
 * per scenario is therefore to set `DATABASE_PATH` and force a clean module
 * graph with `vi.resetModules()` before a fresh dynamic `import()` — the
 * practical equivalent, for this fully-singleton wiring, of the `TYPES.Knex`
 * rebind described in LLD §9.4/§10.3. Nothing else in the graph is mocked.
 * @param databasePath Absolute path of the SQLite file the app should open.
 * @returns A freshly assembled `Express` app (never `.listen()`-ed) together
 *          with its own Knex client, so the caller can `.destroy()` the
 *          connection before removing the underlying file.
 */
async function buildAppAgainst(databasePath: string): Promise<TestAppHandle> {
  vi.resetModules();
  process.env.DATABASE_PATH = databasePath;
  const { createApp } = await import('../../src/app');
  const { knexClient } = await import('../../src/infra/database/knex-client');
  return { app: createApp(), knexClient };
}

describe('GET /v1/health', () => {
  describe('when the SQLite probe succeeds (real read-only connection)', () => {
    const databasePath = join(tmpdir(), `erebus-health-ok-${randomUUID()}.sqlite`);
    let app: Express;
    let knexClient: Knex;

    beforeAll(async () => {
      await createEmptySqliteFile(databasePath);
      ({ app, knexClient } = await buildAppAgainst(databasePath));
    });

    afterAll(async () => {
      await knexClient.destroy();
      removeSqliteFile(databasePath);
      process.env.DATABASE_PATH = ORIGINAL_DATABASE_PATH;
    });

    it('responds 200 with the health payload shape', async () => {
      const response = await request(app).get('/v1/health');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body).toEqual({
        status: 'ok',
        version: expect.any(String),
        uptimeMs: expect.any(Number),
      });
    });

    it('reports a non-negative, whole-millisecond uptime', async () => {
      const response = await request(app).get('/v1/health');
      const body = response.body as HealthResponseBody;

      expect(Number.isInteger(body.uptimeMs)).toBe(true);
      expect(body.uptimeMs).toBeGreaterThanOrEqual(0);
    });

    it('never caches the response', async () => {
      const response = await request(app).get('/v1/health');

      expect(response.headers['cache-control']).toBe('no-store');
    });
  });

  describe('when the SQLite driver cannot open the file (degraded)', () => {
    const unreachableDatabasePath = join(
      tmpdir(),
      `erebus-health-unreachable-${randomUUID()}`,
      'does-not-exist',
      'erebus.sqlite',
    );
    let app: Express;
    let knexClient: Knex;

    beforeAll(async () => {
      // Deliberately never created: a read-only connection against a missing
      // parent directory makes better-sqlite3 fail to open the file, driving
      // the repository's absorbed-error branch (HealthRepository.checkConnection
      // catch clause) with a real driver failure, not a mock.
      ({ app, knexClient } = await buildAppAgainst(unreachableDatabasePath));
    });

    afterAll(async () => {
      await knexClient.destroy();
      process.env.DATABASE_PATH = ORIGINAL_DATABASE_PATH;
    });

    it('still responds 200, but with status degraded', async () => {
      const response = await request(app).get('/v1/health');
      const body = response.body as HealthResponseBody;

      expect(response.status).toBe(200);
      expect(body.status).toBe('degraded');
    });

    it('never caches a degraded response either', async () => {
      const response = await request(app).get('/v1/health');

      expect(response.headers['cache-control']).toBe('no-store');
    });
  });
});

describe('route wiring and Swagger endpoints', () => {
  const databasePath = join(tmpdir(), `erebus-health-wiring-${randomUUID()}.sqlite`);
  let app: Express;
  let knexClient: Knex;

  beforeAll(async () => {
    await createEmptySqliteFile(databasePath);
    ({ app, knexClient } = await buildAppAgainst(databasePath));
  });

  afterAll(async () => {
    await knexClient.destroy();
    removeSqliteFile(databasePath);
    process.env.DATABASE_PATH = ORIGINAL_DATABASE_PATH;
  });

  it('mounts /v1/health under the /v1 prefix (index router)', async () => {
    const response = await request(app).get('/v1/health');

    expect(response.status).toBe(200);
  });

  it('answers an unmounted /v1 route with a 404', async () => {
    const response = await request(app).get('/v1/does-not-exist');

    expect(response.status).toBe(404);
  });

  it('serves a raw OpenAPI document at /v1/docs.json describing /v1/health', async () => {
    const response = await request(app).get('/v1/docs.json');
    const body = response.body as OpenApiDocumentBody;

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(body).toMatchObject({ openapi: expect.any(String) });
    expect(Object.keys(body.paths)).toContain('/v1/health');
  });

  it('serves the Swagger UI at /v1/docs', async () => {
    const response = await request(app).get('/v1/docs/');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });
});
