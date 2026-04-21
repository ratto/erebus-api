import 'reflect-metadata';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../infrastructure/container/types.ts';
import type { ISkillService } from '../services/skill.service.ts';

@injectable()
export class SkillController {
  constructor(@inject(TYPES.ISkillService) private readonly skillService: ISkillService) {}

  async list(_req: Request, res: Response): Promise<void> {
    const skills = await this.skillService.getAll();
    res.status(200).json(skills);
  }
}
