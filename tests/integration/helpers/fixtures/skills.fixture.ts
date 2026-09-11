import type { Knex } from 'knex';

/** Identifiers of every fixture row, resolved after insertion, for assertions. */
export interface SkillFixtureIds {
  conducaoId: number;
  explosivosId: number;
  oficiosId: number;
  automovelId: number;
  asaDeltaId: number;
}

/** Insertable shape of one `skills` row, snake_case, mirroring the table (LLD §6.3). */
interface SkillFixtureRow {
  name: string;
  parent_skill_id: number | null;
  has_subgroups: boolean;
  base_attribute: string | null;
  initial_value_type: string | null;
  category: string | null;
  description: string | null;
  prerequisite: string | null;
  damage: string | null;
  notes: string | null;
  source_level: number;
  source: string;
  edition_or_version: string | null;
}

/**
 * Inserts one fixture row and returns the id Knex assigned to it, failing loudly
 * (never a non-null assertion — LLD §8.7) if the driver did not report one.
 * @param knex Writable Knex instance pointed at the test database file.
 * @param row Row to insert.
 */
async function insertSkillRow(knex: Knex, row: SkillFixtureRow): Promise<number> {
  const [id] = await knex('skills').insert(row);

  if (id === undefined) {
    throw new Error(`Fixture insert of skill "${row.name}" did not return an id.`);
  }

  return id;
}

/**
 * Inserts a small, hand-written skills fixture directly through the given
 * (writable) Knex instance — never through the production seed pipeline
 * (LLD §10.3, ADR-003 §2 explicitly reserve `scripts/seed-database.ts` for
 * that, and integration tests MUST NOT run it).
 *
 * The fixture is deliberately built to exercise the inherited-attribute rule
 * (CONTRACT.md §2.1, LLD §6.3 rule 3 / D7) end to end: `Automóvel` is a
 * subgroup with `base_attribute IS NULL` under `Condução`, which declares
 * `AGI` — the exact shape the dev report flagged as missing from the real
 * Level 1 catalogue. `Asa Delta` carries its own `DEX`, so a naive
 * unqualified self-join (R3) would leak `Condução`'s `AGI` onto it instead.
 * @param knex Writable Knex instance pointed at the test database file.
 * @returns The autoincrement ids Knex assigned to each fixture row.
 */
export async function insertSkillFixtures(knex: Knex): Promise<SkillFixtureIds> {
  const editionOrVersion = 'Manual Básico 1.04 (dez/2022)';

  const conducaoId = await insertSkillRow(knex, {
    name: 'Condução',
    parent_skill_id: null,
    has_subgroups: true,
    base_attribute: 'AGI',
    initial_value_type: 'instinctive',
    category: null,
    description: 'Perícia de grupo para operar veículos.',
    prerequisite: null,
    damage: null,
    notes: null,
    source_level: 1,
    source: 'pericias.json → lista · manual l.809',
    edition_or_version: editionOrVersion,
  });

  const explosivosId = await insertSkillRow(knex, {
    name: 'Explosivos',
    parent_skill_id: null,
    has_subgroups: false,
    base_attribute: null,
    initial_value_type: 'technical',
    category: null,
    description: 'Manusear e identificar explosivos.',
    prerequisite: null,
    damage: null,
    notes: null,
    source_level: 1,
    source: 'pericias.json → lista · manual l.900',
    edition_or_version: editionOrVersion,
  });

  const oficiosId = await insertSkillRow(knex, {
    name: 'Ofícios',
    parent_skill_id: null,
    has_subgroups: false,
    base_attribute: 'INT',
    initial_value_type: 'technical',
    category: null,
    description: 'Perícia curada de nível 2, para exercitar o filtro sourceLevel.',
    prerequisite: null,
    damage: null,
    notes: null,
    source_level: 2,
    source: 'homebrew curation note',
    edition_or_version: editionOrVersion,
  });

  const automovelId = await insertSkillRow(knex, {
    name: 'Automóvel',
    parent_skill_id: conducaoId,
    has_subgroups: false,
    base_attribute: null,
    initial_value_type: 'instinctive',
    category: 'condução',
    description: 'Dirigir automóvel em condições normais de uso e de trânsito.',
    prerequisite: null,
    damage: null,
    notes: null,
    source_level: 1,
    source: 'pericias.json → Condução.subgrupos · manual l.809',
    edition_or_version: editionOrVersion,
  });

  const asaDeltaId = await insertSkillRow(knex, {
    name: 'Asa Delta',
    parent_skill_id: conducaoId,
    has_subgroups: false,
    base_attribute: 'DEX',
    initial_value_type: 'technical',
    category: 'pilotagem',
    description: 'Pilotar asas-delta e equipamentos de voo livre similares.',
    prerequisite: null,
    damage: null,
    notes: null,
    source_level: 1,
    source: 'pericias.json → Condução.subgrupos · manual l.860',
    edition_or_version: editionOrVersion,
  });

  return { conducaoId, explosivosId, oficiosId, automovelId, asaDeltaId };
}
