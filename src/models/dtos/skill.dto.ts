import type { BaseAttribute, InitialValueType } from '../enums/base-attribute.enum';
import type { SourceLevel } from '../enums/source-level.enum';

/** Validated query filter of `GET /v1/skills`, produced by the Zod middleware. */
export interface SkillFilterDto {
  /** Partial, case-insensitive match on the skill's own name. */
  name?: string;
  sourceLevel?: SourceLevel;
  /**
   * Matches the **effective** attribute, so a subgroup that inherits its
   * attribute from its group is returned (CONTRACT.md §2.1).
   */
  baseAttribute?: BaseAttribute;
  /** True to return only the root skills; omitted returns the whole catalogue. */
  rootOnly?: boolean;
}

/**
 * Response shape of one skill, shared by the list and the detail endpoints
 * (CONTRACT.md D16). It is still a projection rather than a copy of the entity:
 * `parentBaseAttribute` is never exposed, because `effectiveBaseAttribute` exists
 * precisely so no consumer re-derives the inheritance rule.
 */
export interface SkillResponseDto {
  id: number;
  name: string;
  parentSkillId: number | null;
  parentSkillName: string | null;
  hasSubgroups: boolean;
  /** Attribute the skill itself declares; null when it varies by subgroup. */
  baseAttribute: BaseAttribute | null;
  /** `baseAttribute`, or the group's attribute when the skill declares none. */
  effectiveBaseAttribute: BaseAttribute | null;
  category: string | null;
  description: string | null;
  initialValueType: InitialValueType | null;
  prerequisite: string | null;
  damage: string | null;
  notes: string | null;
  sourceLevel: SourceLevel;
  source: string;
  editionOrVersion: string | null;
}

/**
 * Response shape of `GET /v1/skills/:id`: the list element plus its direct
 * children. `subgroups` is always present and always an array — `[]` for a leaf
 * and for a root with no catalogued children (CONTRACT.md §2.2).
 */
export interface SkillDetailResponseDto extends SkillResponseDto {
  subgroups: SkillResponseDto[];
}
