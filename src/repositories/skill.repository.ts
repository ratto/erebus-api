import { inject, injectable } from 'inversify';

import { TYPES } from '../container/types';
import { toSkillEntity } from '../models/mappers/skill.mapper';

import type { SkillFilterDto } from '../models/dtos/skill.dto';
import type { Skill } from '../models/entities/skill.entity';
import type { SkillJoinedRow, SkillRow } from '../models/rows/skill.row';
import type { ISkillRepository } from './interfaces/skill.repository.interface';
import type { Knex } from 'knex';

/**
 * Read-only SQL access to the skills catalogue.
 *
 * Every column is qualified as `skills.x` or `parent.x`: with a self-join an
 * unqualified column silently resolves to whichever table SQLite picks, which
 * would return the group's name or attribute as the skill's own.
 */
@injectable()
export class SkillRepository implements ISkillRepository {
  private static readonly TABLE = 'skills';
  private static readonly PARENT_ALIAS = 'parent';

  public constructor(@inject(TYPES.Knex) private readonly knex: Knex) {}

  /**
   * Finds every skill matching the filter, ordered by name.
   *
   * `baseAttribute` is matched against the **effective** attribute, so a subgroup
   * that inherits its attribute from its group is returned (CONTRACT.md §2.1).
   * @param filter Narrowing criteria; an absent property applies no restriction.
   */
  public async findAll(filter: SkillFilterDto): Promise<Skill[]> {
    const query = this.buildJoinedQuery();

    if (filter.name !== undefined) {
      query.whereILike('skills.name', `%${filter.name}%`);
    }
    if (filter.sourceLevel !== undefined) {
      query.where('skills.source_level', filter.sourceLevel);
    }
    if (filter.baseAttribute !== undefined) {
      query.whereRaw('coalesce(skills.base_attribute, parent.base_attribute) = ?', [
        filter.baseAttribute,
      ]);
    }
    if (filter.rootOnly === true) {
      query.whereNull('skills.parent_skill_id');
    }

    const rows = await query.orderBy('skills.name', 'asc');

    return rows.map(toSkillEntity);
  }

  /**
   * Finds a single skill by identifier.
   * @param id Skill identifier.
   * @returns The skill, or null when no skill has that id.
   */
  public async findById(id: number): Promise<Skill | null> {
    const rows = await this.buildJoinedQuery().where('skills.id', id).limit(1);
    const [row] = rows;

    return row === undefined ? null : toSkillEntity(row);
  }

  /**
   * Finds the direct children of a group, ordered by name.
   * @param parentSkillId Identifier of the group.
   */
  public async findChildren(parentSkillId: number): Promise<Skill[]> {
    const rows = await this.buildJoinedQuery()
      .where('skills.parent_skill_id', parentSkillId)
      .orderBy('skills.name', 'asc');

    return rows.map(toSkillEntity);
  }

  /**
   * Builds the self-joined projection every read shares: the skill's own columns
   * plus the two parent columns the detail payload and the inherited-attribute
   * rule need. The column list is explicit — the row type is the contract, so
   * `select('*')` is never relied upon (LLD §7.2).
   */
  private buildJoinedQuery(): Knex.QueryBuilder<SkillRow, SkillJoinedRow[]> {
    // Knex types a generic `select<T>()` over a join as loosely as the join makes
    // it, so the projection is asserted back onto the row type once, here, rather
    // than at each call site.
    return this.knex<SkillRow>(SkillRepository.TABLE)
      .leftJoin(
        `${SkillRepository.TABLE} as ${SkillRepository.PARENT_ALIAS}`,
        'skills.parent_skill_id',
        'parent.id',
      )
      .select<SkillJoinedRow[]>(
        'skills.id',
        'skills.name',
        'skills.parent_skill_id',
        'skills.has_subgroups',
        'skills.base_attribute',
        'skills.initial_value_type',
        'skills.category',
        'skills.description',
        'skills.prerequisite',
        'skills.damage',
        'skills.notes',
        'skills.source_level',
        'skills.source',
        'skills.edition_or_version',
        this.knex.ref('parent.name').as('parent_name'),
        this.knex.ref('parent.base_attribute').as('parent_base_attribute'),
      ) as Knex.QueryBuilder<SkillRow, SkillJoinedRow[]>;
  }
}
