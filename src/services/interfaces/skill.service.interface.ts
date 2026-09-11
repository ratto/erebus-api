import type {
  SkillDetailResponseDto,
  SkillFilterDto,
  SkillResponseDto,
} from '../../models/dtos/skill.dto';

/** Application rules for the skills catalogue. */
export interface ISkillService {
  /**
   * Lists skills matching the filter, resolving each inherited base attribute.
   * @param filter Validated narrowing criteria.
   * @returns The matching skills; an empty array is a valid answer, never a 404.
   */
  list(filter: SkillFilterDto): Promise<SkillResponseDto[]>;

  /**
   * Retrieves a single skill together with its direct subgroups.
   * @param id Skill identifier.
   * @returns The skill detail; `subgroups` is `[]` for a leaf.
   * @throws NotFoundError When no skill has that id.
   */
  getById(id: number): Promise<SkillDetailResponseDto>;
}
