import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../infrastructure/container/types.ts';
import type { ICombatSkillRepository } from '../repositories/combat-skill.repository.ts';
import type { CombatSkill } from '../model/entities/combat-skill.entity.ts';

export interface ICombatSkillService {
  getAll(): Promise<CombatSkill[]>;
}

@injectable()
export class CombatSkillService implements ICombatSkillService {
  constructor(
    @inject(TYPES.ICombatSkillRepository)
    private readonly combatSkillRepository: ICombatSkillRepository,
  ) {}

  async getAll(): Promise<CombatSkill[]> {
    return this.combatSkillRepository.findAll();
  }
}
