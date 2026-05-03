import 'reflect-metadata';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../infrastructure/container/types.ts';
import type { ICombatSkillService } from '../services/combat-skill.service.ts';

@injectable()
export class CombatSkillController {
  constructor(
    @inject(TYPES.ICombatSkillService)
    private readonly combatSkillService: ICombatSkillService,
  ) {}

  async list(_req: Request, res: Response): Promise<void> {
    const combatSkillsList = await this.combatSkillService.getAll();
    res.status(200).json(combatSkillsList);
  }
}
