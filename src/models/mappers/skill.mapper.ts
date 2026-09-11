import type { Skill } from '../entities/skill.entity';
import type { SkillDetailResponseDto, SkillResponseDto } from '../dtos/skill.dto';
import type { BaseAttribute, InitialValueType } from '../enums/base-attribute.enum';
import type { SourceLevel } from '../enums/source-level.enum';
import type { SkillJoinedRow } from '../rows/skill.row';

/**
 * Maps a joined `skills` row to a domain skill entity.
 *
 * SQLite has no boolean, so `has_subgroups` arrives as `0 | 1` and is compared
 * explicitly rather than coerced by truthiness (LLD §6.4).
 * @param row Row as returned by the repository's self-join.
 * @returns The domain entity, with the parent columns kept for the inherited
 *          attribute rule (LLD §6.3 rule 3).
 */
export function toSkillEntity(row: SkillJoinedRow): Skill {
  return {
    id: row.id,
    name: row.name,
    parentSkillId: row.parent_skill_id,
    parentSkillName: row.parent_name,
    parentBaseAttribute: row.parent_base_attribute as BaseAttribute | null,
    hasSubgroups: row.has_subgroups === 1,
    baseAttribute: row.base_attribute as BaseAttribute | null,
    initialValueType: row.initial_value_type as InitialValueType | null,
    category: row.category,
    description: row.description,
    prerequisite: row.prerequisite,
    damage: row.damage,
    notes: row.notes,
    sourceLevel: row.source_level as SourceLevel,
    source: row.source,
    editionOrVersion: row.edition_or_version,
  };
}

/**
 * Projects a skill entity onto the shape both endpoints return.
 *
 * The resolved attribute is a **parameter**, not something this function derives:
 * the inheritance rule belongs to the service (LLD §6.3 rule 3,
 * CONTRACT.md §3.3), and `parentBaseAttribute` is deliberately dropped here so no
 * consumer can re-derive it.
 * @param skill Domain entity.
 * @param effectiveBaseAttribute Attribute resolved by the service; may be null,
 *        which is a valid canonical state rather than an error.
 */
export function toSkillResponseDto(
  skill: Skill,
  effectiveBaseAttribute: BaseAttribute | null,
): SkillResponseDto {
  return {
    id: skill.id,
    name: skill.name,
    parentSkillId: skill.parentSkillId,
    parentSkillName: skill.parentSkillName,
    hasSubgroups: skill.hasSubgroups,
    baseAttribute: skill.baseAttribute,
    effectiveBaseAttribute,
    category: skill.category,
    description: skill.description,
    initialValueType: skill.initialValueType,
    prerequisite: skill.prerequisite,
    damage: skill.damage,
    notes: skill.notes,
    sourceLevel: skill.sourceLevel,
    source: skill.source,
    editionOrVersion: skill.editionOrVersion,
  };
}

/**
 * Composes the detail payload from an already-projected skill and its children.
 * @param skill The skill being detailed, already projected.
 * @param subgroups Its direct children, already projected and ordered by name.
 *        An empty array is the correct value for a leaf — never null, never
 *        omitted (CONTRACT.md §2.2).
 */
export function toSkillDetailResponseDto(
  skill: SkillResponseDto,
  subgroups: SkillResponseDto[],
): SkillDetailResponseDto {
  return { ...skill, subgroups };
}
