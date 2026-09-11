import type { SkillFilterDto } from '../../models/dtos/skill.dto';
import type { Skill } from '../../models/entities/skill.entity';

/**
 * Read-only data access contract for skills. Implementations are the sole SQL
 * access point for this entity and never throw HTTP-flavoured errors.
 */
export interface ISkillRepository {
  /**
   * Finds every skill matching the given filter, ordered by name.
   * @param filter Narrowing criteria; `baseAttribute` matches the effective
   *        (possibly inherited) attribute.
   * @returns Matching skills, an empty array when none match.
   */
  findAll(filter: SkillFilterDto): Promise<Skill[]>;

  /**
   * Finds a single skill by its identifier.
   * @param id Skill identifier.
   * @returns The skill, or null when no skill has that id — absence is reported
   *          as a value, never as a thrown error.
   */
  findById(id: number): Promise<Skill | null>;

  /**
   * Finds the direct children of a group, ordered by name.
   * @param parentSkillId Identifier of the group.
   * @returns Its subgroups, an empty array when it has none.
   */
  findChildren(parentSkillId: number): Promise<Skill[]>;
}
