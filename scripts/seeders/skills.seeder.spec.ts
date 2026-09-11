import { describe, expect, it } from 'vitest';

import {
  EDITION_OR_VERSION,
  EXPECTED_SKILL_CATALOGUE_COUNTS,
  assertSkillCatalogueCounts,
  buildSkillRows,
} from './skills.seeder';

import type { RawSkillRecord } from './skills.seeder';

const rootRecord = (overrides: Partial<RawSkillRecord> = {}): RawSkillRecord => ({
  id: 'n1-animais',
  name: 'Animais',
  group: 'Animais',
  subgroup: null,
  attribute: null,
  source: 'varia por subgrupo · pericias.json → lista · manual l.781',
  description: 'Group skill covering animals.',
  ...overrides,
});

const subgroupRecord = (overrides: Partial<RawSkillRecord> = {}): RawSkillRecord => ({
  id: 'n2-animais-montaria',
  name: 'Montaria',
  group: 'Animais',
  subgroup: 'Montaria',
  attribute: 'AGI',
  source: 'instintiva · pericias.json → Animais.subgrupos · manual l.781',
  description: 'Ride and control mounts.',
  ...overrides,
});

const categoryRecord = (overrides: Partial<RawSkillRecord> = {}): RawSkillRecord => ({
  id: 'n3-conducao-automovel-conducao',
  name: 'Condução',
  group: 'Condução',
  subgroup: 'Automóvel',
  attribute: 'AGI',
  source: 'instintiva · pericias.json → Condução.subgrupos.categoria · manual l.810-811',
  description: 'Classifies Automóvel as an ordinary-driving vehicle.',
  ...overrides,
});

describe('buildSkillRows', () => {
  describe('hierarchy split (S1, S2, S3)', () => {
    it('turns every n1- record into a root with no parent natural key', () => {
      const { roots, subgroups } = buildSkillRows([rootRecord()]);

      expect(subgroups).toHaveLength(0);
      expect(roots).toHaveLength(1);
      expect(roots[0]).toMatchObject({ name: 'Animais', parentGroupName: null });
    });

    it('turns every n2- record into a subgroup carrying its group as parent natural key', () => {
      const { subgroups } = buildSkillRows([rootRecord(), subgroupRecord()]);

      expect(subgroups).toHaveLength(1);
      expect(subgroups[0]).toMatchObject({ name: 'Montaria', parentGroupName: 'Animais' });
    });

    it('produces no row for an n3- record, setting its parent subgroup category instead', () => {
      const { roots, subgroups } = buildSkillRows([
        rootRecord({ id: 'n1-conducao', name: 'Condução', group: 'Condução' }),
        subgroupRecord({
          id: 'n2-conducao-automovel',
          name: 'Automóvel',
          group: 'Condução',
          subgroup: 'Automóvel',
        }),
        categoryRecord(),
      ]);

      expect(roots).toHaveLength(1);
      expect(subgroups).toHaveLength(1);
      expect(subgroups[0]?.category).toBe('condução');
    });

    it('lowercases the n3- record name into the category', () => {
      const { subgroups } = buildSkillRows([
        rootRecord({ id: 'n1-conducao', name: 'Condução', group: 'Condução' }),
        subgroupRecord({
          id: 'n2-conducao-aviao',
          name: 'Avião',
          group: 'Condução',
          subgroup: 'Avião',
        }),
        categoryRecord({
          id: 'n3-conducao-aviao-pilotagem',
          name: 'Pilotagem',
          subgroup: 'Avião',
        }),
      ]);

      expect(subgroups[0]?.category).toBe('pilotagem');
    });

    it('leaves category null for every skill outside Condução', () => {
      const { roots, subgroups } = buildSkillRows([rootRecord(), subgroupRecord()]);

      expect(roots[0]?.category).toBeNull();
      expect(subgroups[0]?.category).toBeNull();
    });

    it('rejects an n3- record that does not belong to Condução (S3)', () => {
      expect(() =>
        buildSkillRows([
          rootRecord(),
          subgroupRecord(),
          categoryRecord({ group: 'Animais', subgroup: 'Montaria' }),
        ]),
      ).toThrow(/Condução/);
    });

    it('rejects an n3- record whose subgroup is not catalogued', () => {
      expect(() =>
        buildSkillRows([
          rootRecord({ id: 'n1-conducao', name: 'Condução', group: 'Condução' }),
          categoryRecord(),
        ]),
      ).toThrow(/Automóvel/);
    });

    it('rejects an n2- record whose group has no root record (no orphan)', () => {
      expect(() => buildSkillRows([subgroupRecord()])).toThrow(/Animais/);
    });

    it('rejects a record whose id carries an unknown level prefix', () => {
      expect(() => buildSkillRows([rootRecord({ id: 'n4-something' })])).toThrow(/n4-something/);
    });
  });

  describe('column derivation (S4, S5, S9, S11, S12)', () => {
    it('copies the name verbatim, keeping the Portuguese source spelling', () => {
      const { subgroups } = buildSkillRows([
        rootRecord({ id: 'n1-conducao', name: 'Condução', group: 'Condução' }),
        subgroupRecord({
          id: 'n2-conducao-onibus',
          name: 'Ônibus',
          group: 'Condução',
          subgroup: 'Ônibus',
        }),
      ]);

      expect(subgroups[0]?.name).toBe('Ônibus');
    });

    it('copies the attribute into base_attribute without inferring the group value', () => {
      const { roots, subgroups } = buildSkillRows([
        rootRecord({ attribute: 'AGI' }),
        subgroupRecord({ attribute: null }),
      ]);

      expect(roots[0]?.base_attribute).toBe('AGI');
      expect(subgroups[0]?.base_attribute).toBeNull();
    });

    it('copies the description verbatim', () => {
      const { roots } = buildSkillRows([rootRecord({ description: 'Uma descrição.' })]);

      expect(roots[0]?.description).toBe('Uma descrição.');
    });

    it('leaves prerequisite and damage null for every row', () => {
      const { roots, subgroups } = buildSkillRows([rootRecord(), subgroupRecord()]);

      expect(roots[0]).toMatchObject({ prerequisite: null, damage: null });
      expect(subgroups[0]).toMatchObject({ prerequisite: null, damage: null });
    });

    it('stamps every row with source level 1 and the catalogue edition', () => {
      const { roots } = buildSkillRows([rootRecord()]);

      expect(roots[0]).toMatchObject({
        source_level: 1,
        edition_or_version: EDITION_OR_VERSION,
      });
    });
  });

  describe('initial value type and citation split (S6, S7)', () => {
    it('maps "instintiva" to instinctive and keeps the citation as source', () => {
      const { subgroups } = buildSkillRows([rootRecord(), subgroupRecord()]);

      expect(subgroups[0]?.initial_value_type).toBe('instinctive');
      expect(subgroups[0]?.source).toBe('pericias.json → Animais.subgrupos · manual l.781');
    });

    it('maps "técnica" to technical', () => {
      const { subgroups } = buildSkillRows([
        rootRecord(),
        subgroupRecord({ source: 'técnica · pericias.json → lista · manual l.781' }),
      ]);

      expect(subgroups[0]?.initial_value_type).toBe('technical');
    });

    it('maps "varia por subgrupo" to null', () => {
      const { roots } = buildSkillRows([rootRecord()]);

      expect(roots[0]?.initial_value_type).toBeNull();
      expect(roots[0]?.source).toBe('pericias.json → lista · manual l.781');
    });

    it('rejects an unknown initial value token', () => {
      expect(() =>
        buildSkillRows([rootRecord({ source: 'mágica · pericias.json → lista' })]),
      ).toThrow(/mágica/);
    });

    it('rejects a source that carries no citation after the token', () => {
      expect(() => buildSkillRows([rootRecord({ source: 'instintiva' })])).toThrow(/citation/i);
    });
  });

  describe('has_subgroups derivation (S8)', () => {
    it('marks a root with at least one catalogued subgroup', () => {
      const { roots } = buildSkillRows([rootRecord(), subgroupRecord()]);

      expect(roots[0]?.has_subgroups).toBe(true);
    });

    it('marks a root with no catalogued subgroup as a leaf', () => {
      const { roots } = buildSkillRows([
        rootRecord({ id: 'n1-explosivos', name: 'Explosivos', group: 'Explosivos' }),
      ]);

      expect(roots[0]?.has_subgroups).toBe(false);
    });

    it('never marks a subgroup as having subgroups', () => {
      const { subgroups } = buildSkillRows([rootRecord(), subgroupRecord()]);

      expect(subgroups[0]?.has_subgroups).toBe(false);
    });
  });

  describe('canonical divergences (S10, S13)', () => {
    it('seeds Artífice as a leaf carrying the canonical divergence in notes', () => {
      const { roots } = buildSkillRows([
        rootRecord({
          id: 'n1-artifice',
          name: 'Artífice',
          group: 'Artífice',
          attribute: 'DEX',
          source: 'instintiva · pericias.json → lista · manual l.796',
        }),
      ]);

      expect(roots[0]?.has_subgroups).toBe(false);
      expect(roots[0]?.notes).toContain('temSubgrupos');
    });

    it('leaves notes null for every skill other than Artífice', () => {
      const { roots, subgroups } = buildSkillRows([rootRecord(), subgroupRecord()]);

      expect(roots[0]?.notes).toBeNull();
      expect(subgroups[0]?.notes).toBeNull();
    });

    it('rejects a record named Escudo', () => {
      expect(() =>
        buildSkillRows([rootRecord({ id: 'n1-escudo', name: 'Escudo', group: 'Escudo' })]),
      ).toThrow(/Escudo/);
    });
  });
});

describe('assertSkillCatalogueCounts', () => {
  const validCounts = (): typeof EXPECTED_SKILL_CATALOGUE_COUNTS => ({
    ...EXPECTED_SKILL_CATALOGUE_COUNTS,
  });

  it('accepts the canonical catalogue counts', () => {
    expect(() => {
      assertSkillCatalogueCounts(validCounts());
    }).not.toThrow();
  });

  it('expects 246 rows split into 36 roots and 210 subgroups', () => {
    expect(EXPECTED_SKILL_CATALOGUE_COUNTS).toMatchObject({
      total: 246,
      roots: 36,
      subgroups: 210,
      withCategory: 19,
      drivingCategory: 7,
      pilotingCategory: 12,
      withSubgroups: 21,
      namedEscudo: 0,
    });
  });

  it('rejects a total that drifted from the catalogue', () => {
    expect(() => {
      assertSkillCatalogueCounts({ ...validCounts(), total: 245 });
    }).toThrow(/total/);
  });

  it('rejects a root count that drifted from the catalogue', () => {
    expect(() => {
      assertSkillCatalogueCounts({ ...validCounts(), roots: 35 });
    }).toThrow(/roots/);
  });

  it('rejects any Escudo row reaching the catalogue', () => {
    expect(() => {
      assertSkillCatalogueCounts({ ...validCounts(), namedEscudo: 1 });
    }).toThrow(/namedEscudo/);
  });

  it('reports every drifted count at once, not just the first', () => {
    expect(() => {
      assertSkillCatalogueCounts({ ...validCounts(), roots: 35, subgroups: 209 });
    }).toThrow(/roots[\s\S]*subgroups|subgroups[\s\S]*roots/);
  });
});

describe('the committed catalogue source', () => {
  it('derives exactly the counts the contract guards expect', async () => {
    const source = (await import('../../seeds/skills.level1.json')) as unknown as {
      default: { skills: RawSkillRecord[] };
    };
    const { roots, subgroups } = buildSkillRows(source.default.skills);
    const all = [...roots, ...subgroups];

    expect(() => {
      assertSkillCatalogueCounts({
        total: all.length,
        roots: roots.length,
        subgroups: subgroups.length,
        withCategory: all.filter((row) => row.category !== null).length,
        drivingCategory: all.filter((row) => row.category === 'condução').length,
        pilotingCategory: all.filter((row) => row.category === 'pilotagem').length,
        withSubgroups: all.filter((row) => row.has_subgroups).length,
        namedEscudo: all.filter((row) => row.name === 'Escudo').length,
      });
    }).not.toThrow();
  });

  it('keeps Explosivos as a root leaf with no base attribute', async () => {
    const source = (await import('../../seeds/skills.level1.json')) as unknown as {
      default: { skills: RawSkillRecord[] };
    };
    const { roots } = buildSkillRows(source.default.skills);
    const explosivos = roots.find((row) => row.name === 'Explosivos');

    expect(explosivos).toMatchObject({
      parentGroupName: null,
      has_subgroups: false,
      base_attribute: null,
    });
  });
});
