import { inject, injectable } from 'inversify';

import { TYPES } from '../container/types';
import { NotFoundError } from '../errors/not-found.error';
import { toSkillDetailResponseDto, toSkillResponseDto } from '../models/mappers/skill.mapper';

import type {
  SkillDetailResponseDto,
  SkillFilterDto,
  SkillResponseDto,
} from '../models/dtos/skill.dto';
import type { Skill } from '../models/entities/skill.entity';
import type { BaseAttribute } from '../models/enums/base-attribute.enum';
import type { ISkillRepository } from '../repositories/interfaces/skill.repository.interface';
import type { ISkillService } from './interfaces/skill.service.interface';

/** Application rules of the skills catalogue. */
@injectable()
export class SkillService implements ISkillService {
  public constructor(
    @inject(TYPES.SkillRepository)
    private readonly repository: ISkillRepository,
  ) {}

  /**
   * Lists skills matching the filter.
   * @param filter Validated narrowing criteria, passed through unchanged.
   * @returns The matching skills, each carrying its resolved base attribute.
   */
  public async list(filter: SkillFilterDto): Promise<SkillResponseDto[]> {
    const skills = await this.repository.findAll(filter);

    return skills.map((skill) => this.toResponseDto(skill));
  }

  /**
   * Retrieves a skill together with its direct subgroups.
   *
   * The children query runs only for a group: the 225 leaf skills of the Level 1
   * catalogue answer with `subgroups: []` without a second round trip.
   * @param id Skill identifier.
   * @returns The skill detail.
   * @throws NotFoundError When no skill has that id.
   */
  public async getById(id: number): Promise<SkillDetailResponseDto> {
    const skill = await this.repository.findById(id);

    if (skill === null) {
      throw new NotFoundError(`Skill with id ${String(id)} was not found.`);
    }

    const children = skill.hasSubgroups ? await this.repository.findChildren(id) : [];

    return toSkillDetailResponseDto(
      this.toResponseDto(skill),
      children.map((child) => this.toResponseDto(child)),
    );
  }

  /**
   * Projects one entity, resolving the inherited base attribute.
   *
   * This is the single place the inheritance rule of LLD §6.3 rule 3 lives:
   * a subgroup that declares no attribute answers with its group's
   * (CONTRACT.md §3.3).
   * @param skill Domain entity.
   */
  private toResponseDto(skill: Skill): SkillResponseDto {
    const effectiveBaseAttribute: BaseAttribute | null =
      skill.baseAttribute ?? skill.parentBaseAttribute;

    return toSkillResponseDto(skill, effectiveBaseAttribute);
  }
}
