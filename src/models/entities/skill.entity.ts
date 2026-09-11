import type { BaseAttribute, InitialValueType } from '../enums/base-attribute.enum';
import type { Provenance } from './provenance.entity';

/**
 * A Daemon System skill: either a group (root), or one of its subgroups.
 *
 * Domain invariants worth remembering when consuming this shape (LLD §6.3):
 * the hierarchy is exactly two levels deep; a skill with subgroups is a
 * navigation node and is not purchasable on its own; and a skill with no parent
 * and no base attribute (`Explosivos`) is a valid canonical state, not missing
 * data.
 */
export interface Skill extends Provenance {
  id: number;
  /** Canonical Portuguese name; repeats across groups, so it is never a key. */
  name: string;
  /** Identifier of the group this skill belongs to, or null when it is a root. */
  parentSkillId: number | null;
  /** Name of that group, resolved by the repository's self-join. */
  parentSkillName: string | null;
  /**
   * Base attribute declared by the group, used to resolve the effective
   * attribute of a subgroup that declares none (LLD §6.3 rule 3). Internal: it is
   * never exposed on a response DTO.
   */
  parentBaseAttribute: BaseAttribute | null;
  /** True when at least one subgroup is catalogued under this skill. */
  hasSubgroups: boolean;
  /** Attribute this skill itself declares; null when it varies by subgroup. */
  baseAttribute: BaseAttribute | null;
  /** How the skill's initial percentage is determined. */
  initialValueType: InitialValueType | null;
  /** N3 classification of a Condução subgroup (`condução` or `pilotagem`). */
  category: string | null;
  /** One-sentence canonical description. */
  description: string | null;
  prerequisite: string | null;
  /** Damage expression, for the unarmed combat skills. */
  damage: string | null;
  /** Curator remark, e.g. a divergence from the canonical source. */
  notes: string | null;
}
