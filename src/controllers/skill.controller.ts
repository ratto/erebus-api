import { inject, injectable } from 'inversify';

import { TYPES } from '../container/types';

import type { SkillFilterDto } from '../models/dtos/skill.dto';
import type { ISkillService } from '../services/interfaces/skill.service.interface';
import type { NextFunction, Request, Response } from 'express';

/**
 * Catalogue data changes only on deploy, so both endpoints let Netlify's edge
 * absorb repeat traffic (LLD §13.4).
 */
const CATALOGUE_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=86400';

/** Adapts the `/v1/skills` endpoints to the skill service. */
@injectable()
export class SkillController {
  public constructor(
    @inject(TYPES.SkillService)
    private readonly service: ISkillService,
  ) {}

  /**
   * Serialises the skills matching the validated query filter.
   * Handlers are arrow-function properties so `this` stays bound when Express
   * invokes them (LLD §7.7).
   */
  public list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = res.locals.validated as SkillFilterDto;
      const skills = await this.service.list(filter);

      res.set('Cache-Control', CATALOGUE_CACHE_CONTROL);
      res.status(200).json(skills);
    } catch (error) {
      next(error);
    }
  };

  /** Serialises one skill and its direct subgroups. */
  public getById = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = res.locals.validated as { id: number };
      const skill = await this.service.getById(id);

      res.set('Cache-Control', CATALOGUE_CACHE_CONTROL);
      res.status(200).json(skill);
    } catch (error) {
      next(error);
    }
  };
}
