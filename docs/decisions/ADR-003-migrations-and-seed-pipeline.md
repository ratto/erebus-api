# ADR-003: Knex migrations + JSON-driven idempotent seed pipeline, on a separate writable connection

## Status

Accepted

## Date

2026-09-11

## Context

`erebus-api`'s LLD (v1.1) deliberately left the schema-creation and data-loading
mechanism unspecified:

> §6.6 — *"Deliberately **not specified in this LLD**. The schema DDL above is
> normative for column names, types and constraints; the migration file layout,
> the seed pipeline from `docs/sistema daemon/data/*.json`, and the Level 2/3
> curation file format are specified in a separate document owned by `tech-lead`
> before the data increment starts."*

and tracked it as §15 open item 2 — *"Migration file layout and idempotent seed
pipeline — Owner: tech-lead — Blocking: Data increment"*.

**US-03 (`us03-consultar-pericias`) is that data increment.** It is the first US
that has to create a real table (`skills`) and load real catalogue rows (36 N1
groups + 210 N2 subgroups, Level 1). It therefore cannot start until this open
item is closed.

Three facts constrain the answer:

1. **The runtime connection is read-only by design.** LLD §12.3 fixes
   `knex-client.ts` as a single, process-wide, `options: { readonly: true }`
   connection with `pool: { min: 1, max: 1 }`. A migration or an insert on that
   handle throws `SQLITE_READONLY`.
2. **The SQLite file is a derived, disposable build artefact.** LLD §6.6 and
   `.gitignore` (`data/`) agree: `data/erebus.sqlite` is never committed, never
   hand-edited, never a source of truth. It has to be reproducible from scratch
   on a clean clone and inside the Netlify build, before `tsup` runs and before
   `netlify.toml`'s `included_files` picks it up.
3. **The catalogue source is curated JSON, not SQL.** The Level 1 skills
   catalogue was extracted and validated by `game-designer` as an
   English-keyed JSON document (`skills.json`, skill names kept in Portuguese).
   Future increments (weapons, protections, enhancements) will add sibling
   documents, and Level 2/3 curation files will follow the same shape.

The options considered:

- **(A) Hand-written SQL files** executed by a shell script. Rejected: no
  rollback story, no ordering guarantees, duplicates the DDL that LLD §6.3
  already specifies in Knex vocabulary, and puts raw SQL outside
  `src/repositories/**` (LLD §4.1).
- **(B) A single "bootstrap" script that creates tables and inserts rows in one
  pass.** Rejected: it conflates schema evolution with data loading. The schema
  must be versioned (a column added in US-05 must not force a full rebuild in
  every environment), while the data is wholesale-replaceable on every build.
- **(C) Knex migrations for schema + a separate idempotent seed step for data,
  both on a dedicated writable connection.** Adopted.

A fourth question — whether to reuse `knex-client.ts` with the read-only flag
flipped by an environment variable — was rejected outright: making the runtime
client conditionally writable would put a write-capable handle one env var away
from production, against the "read-only REST service" objective of LLD §1.

## Decision

### 1. Schema lives in Knex migrations

Schema creation and evolution happen exclusively through Knex migration files
under `src/infra/database/migrations/`, named
`YYYYMMDDHHMMSS_<verb>_<subject>.ts` (e.g.
`20260911120000_create_skills_table.ts`). Each file exports `up` and `down`.
The body of `up` MUST be a literal transcription of the DDL in LLD §6.3 for that
table — the LLD stays the normative source for column names, types, nullability,
indexes and CHECK constraints, and a migration that diverges from it is a defect.
Changing a column means **editing LLD §6.3 and adding a new migration in the
same increment**, never editing a migration that has already shipped.

### 2. Data lives in an idempotent seed step

Catalogue data is loaded by `scripts/seed-database.ts`, run as `npm run db:seed`.
It is **idempotent by truncate-and-reload**, not by upsert: each seeder deletes
every row of the tables it owns and reinserts them from its JSON source inside a
single transaction. Running it twice produces byte-identical content.

Truncate-and-reload is correct here precisely because the database is a derived,
read-only artefact with no user-generated rows to preserve — the property an
upsert would exist to protect does not exist in this system.

### 3. Seed sources are committed JSON under `seeds/`

Curated catalogue documents live in a committed, top-level `seeds/` directory
(`seeds/skills.level1.json`, and one sibling per future entity/level). They
cannot live under `data/`, which is gitignored as the artefact directory.

Each seeder owns the **derivation rules** that turn the curated document into
rows — the JSON stays a faithful copy of what `game-designer` validated, and no
denormalised field is hand-maintained in two places. Derivation rules are
specified per-US in that US's `CONTRACT.md` and MUST be unit-tested as pure
functions (they are mappers in everything but name).

### 4. Migrations and seeds run on a dedicated writable connection

`src/infra/database/knexfile.ts` gains a second exported configuration,
`knexMigrationConfig`, identical to `knexConfig` except that
`connection.options.readonly` is `false` and it declares `migrations.directory`.
It is consumed **only** by the Knex CLI and by `scripts/**`.

`src/infra/database/knex-client.ts` is untouched and stays read-only.
`scripts/**` MUST NOT import `knexClient`; `src/**` MUST NOT import
`knexMigrationConfig`. This is the single boundary that keeps the running
service physically unable to write.

### 5. The artefact is rebuilt, never incrementally patched

```
npm run db:bootstrap   # touch data/erebus.sqlite (existing, US-01)
npm run db:migrate     # knex migrate:latest on the writable config
npm run db:seed        # truncate + reload every seeder
npm run db:build       # the three above, in order
```

`db:build` is chained from `prebuild` so the Netlify build produces the artefact
before `tsup` bundles and before `included_files` collects it, and from `predev`
/`pretest` so a fresh clone is runnable in one command. Row identifiers
(`skills.id`) are therefore **not stable across rebuilds**; every cross-entity
foreign key (e.g. `weapons.skill_id` in US-04/US-05) MUST be resolved by natural
key inside the same seed run, never hard-coded.

## Consequences

**Positive**

- LLD §15 open item 2 is closed; the data increments (US-03 onward) are
  unblocked with a mechanical, repeatable recipe.
- The read-only guarantee of the running service is enforced by construction —
  two separate configurations, one of which is unreachable from `src/**`.
- Schema history is versioned and reviewable; data is reproducible from a
  reviewable JSON diff rather than from an opaque binary.
- Integration tests are unaffected: LLD §10.3 already requires them to build a
  real SQLite file from the canonical DDL with hand-written fixtures, and
  explicitly forbids seeding them from the production pipeline. That rule stands
  — but the DDL they apply SHOULD now be applied by running the migrations,
  so a migration that drifts from LLD §6.3 fails the integration suite.

**Negative / accepted costs**

- Two Knex configurations to keep in sync. Mitigated by deriving the migration
  config from the runtime one with an object spread, so only the two intentional
  differences are written out.
- `npm run build` gets slower (migrate + seed on every build). At a few hundred
  rows this is sub-second; it is revisited only if the catalogue grows by orders
  of magnitude.
- Auto-increment ids are not stable across builds. Accepted deliberately: the
  alternative (hand-assigned stable ids in the seed JSON) makes the curated
  documents carry database concerns and breaks as soon as two curators edit the
  same file.
- Rolling a migration back in production is not a real operation here (the
  artefact is rebuilt, not migrated in place). `down` is written anyway, for
  local development and to keep each migration self-describing.

## Related

- LLD `erebus-api/docs/lld-erebus-api.md` §2.4, §3, §6.3, §6.6, §15 — updated to
  v1.2 in the same increment that records this ADR.
- `docs/user stories/us03-consultar-pericias/PLAN.md` and `CONTRACT.md` — the
  first application of this pipeline.
- ADR-001 (`docs/decisions/`) — weapon taxonomy, whose `weapons.skill_id` FK is
  the first consumer of §5's natural-key rule.
