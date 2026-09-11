import { describe, expect, it } from 'vitest';

import { BaseAttribute, InitialValueType } from '../enums/base-attribute.enum';
import { SourceLevel } from '../enums/source-level.enum';

import { toSkillDetailResponseDto, toSkillEntity, toSkillResponseDto } from './skill.mapper';

import type { SkillResponseDto } from '../dtos/skill.dto';
import type { Skill } from '../entities/skill.entity';
import type { SkillJoinedRow } from '../rows/skill.row';

const buildRow = (overrides: Partial<SkillJoinedRow> = {}): SkillJoinedRow => ({
  id: 41,
  name: 'Automóvel',
  parent_skill_id: 12,
  has_subgroups: 0,
  base_attribute: 'AGI',
  initial_value_type: 'instinctive',
  category: 'condução',
  description: 'Dirigir automóvel em condições normais.',
  prerequisite: null,
  damage: null,
  notes: null,
  source_level: 1,
  source: 'pericias.json → Condução.subgrupos · manual l.809',
  edition_or_version: 'Manual Básico 1.04 (dez/2022)',
  parent_name: 'Condução',
  parent_base_attribute: 'AGI',
  ...overrides,
});

const buildSkill = (overrides: Partial<Skill> = {}): Skill => ({
  id: 41,
  name: 'Automóvel',
  parentSkillId: 12,
  parentSkillName: 'Condução',
  parentBaseAttribute: BaseAttribute.Agility,
  hasSubgroups: false,
  baseAttribute: BaseAttribute.Agility,
  initialValueType: InitialValueType.Instinctive,
  category: 'condução',
  description: 'Dirigir automóvel em condições normais.',
  prerequisite: null,
  damage: null,
  notes: null,
  sourceLevel: SourceLevel.Canonical,
  source: 'pericias.json → Condução.subgrupos · manual l.809',
  editionOrVersion: 'Manual Básico 1.04 (dez/2022)',
  ...overrides,
});

describe('toSkillEntity', () => {
  it('maps every column of a subgroup row onto the domain shape', () => {
    expect(toSkillEntity(buildRow())).toEqual(buildSkill());
  });

  it('maps has_subgroups 1 to true', () => {
    expect(toSkillEntity(buildRow({ has_subgroups: 1 })).hasSubgroups).toBe(true);
  });

  it('maps has_subgroups 0 to false', () => {
    expect(toSkillEntity(buildRow({ has_subgroups: 0 })).hasSubgroups).toBe(false);
  });

  it('keeps a root with no parent columns as a parentless skill', () => {
    const entity = toSkillEntity(
      buildRow({
        id: 12,
        name: 'Condução',
        parent_skill_id: null,
        parent_name: null,
        parent_base_attribute: null,
        category: null,
        has_subgroups: 1,
      }),
    );

    expect(entity).toMatchObject({
      parentSkillId: null,
      parentSkillName: null,
      parentBaseAttribute: null,
      category: null,
      hasSubgroups: true,
    });
  });

  it('keeps a null base attribute null, without inferring the group value', () => {
    const entity = toSkillEntity(buildRow({ base_attribute: null, parent_base_attribute: 'AGI' }));

    expect(entity.baseAttribute).toBeNull();
    expect(entity.parentBaseAttribute).toBe(BaseAttribute.Agility);
  });

  it('keeps a null initial value type null', () => {
    expect(toSkillEntity(buildRow({ initial_value_type: null })).initialValueType).toBeNull();
  });

  it('preserves provenance unchanged', () => {
    const entity = toSkillEntity(buildRow({ source_level: 3, edition_or_version: null }));

    expect(entity).toMatchObject({
      sourceLevel: 3,
      source: 'pericias.json → Condução.subgrupos · manual l.809',
      editionOrVersion: null,
    });
  });
});

describe('toSkillResponseDto', () => {
  it('projects the entity onto the transport shape', () => {
    expect(toSkillResponseDto(buildSkill(), BaseAttribute.Agility)).toEqual({
      id: 41,
      name: 'Automóvel',
      parentSkillId: 12,
      parentSkillName: 'Condução',
      hasSubgroups: false,
      baseAttribute: 'AGI',
      effectiveBaseAttribute: 'AGI',
      category: 'condução',
      description: 'Dirigir automóvel em condições normais.',
      initialValueType: 'instinctive',
      prerequisite: null,
      damage: null,
      notes: null,
      sourceLevel: 1,
      source: 'pericias.json → Condução.subgrupos · manual l.809',
      editionOrVersion: 'Manual Básico 1.04 (dez/2022)',
    });
  });

  it('never exposes the internal parent base attribute', () => {
    expect(toSkillResponseDto(buildSkill(), BaseAttribute.Agility)).not.toHaveProperty(
      'parentBaseAttribute',
    );
  });

  it('exposes the resolved attribute the service supplies, alongside the raw one', () => {
    const dto = toSkillResponseDto(buildSkill({ baseAttribute: null }), BaseAttribute.Dexterity);

    expect(dto.baseAttribute).toBeNull();
    expect(dto.effectiveBaseAttribute).toBe('DEX');
  });

  it('accepts a null resolved attribute, which is a valid canonical state', () => {
    const dto = toSkillResponseDto(buildSkill({ baseAttribute: null }), null);

    expect(dto.effectiveBaseAttribute).toBeNull();
  });
});

describe('toSkillDetailResponseDto', () => {
  const listDto = (overrides: Partial<SkillResponseDto> = {}): SkillResponseDto => ({
    ...toSkillResponseDto(buildSkill(), BaseAttribute.Agility),
    ...overrides,
  });

  it('adds the subgroups array to the shared element shape', () => {
    const detail = toSkillDetailResponseDto(listDto({ id: 12, name: 'Condução' }), [listDto()]);

    expect(detail.id).toBe(12);
    expect(detail.subgroups).toHaveLength(1);
    expect(detail.subgroups[0]).toMatchObject({ id: 41, name: 'Automóvel' });
  });

  it('emits an empty array for a skill with no children, never null', () => {
    expect(toSkillDetailResponseDto(listDto(), []).subgroups).toEqual([]);
  });

  it('carries provenance on every subgroup element', () => {
    const detail = toSkillDetailResponseDto(listDto(), [listDto()]);

    expect(detail.subgroups[0]).toMatchObject({
      sourceLevel: 1,
      source: 'pericias.json → Condução.subgrupos · manual l.809',
      editionOrVersion: 'Manual Básico 1.04 (dez/2022)',
    });
  });
});
