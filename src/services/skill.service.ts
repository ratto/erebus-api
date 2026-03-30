import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../infrastructure/container/types.ts';
import type { ISkillRepository } from '../repositories/skill.repository.ts';
import type { Skill } from '../model/entities/skill.entity.ts';

export interface ISkillService {
  getAll(): Promise<Skill[]>;
}

@injectable()
export class SkillService implements ISkillService {
  constructor(
    @inject(TYPES.ISkillRepository) private readonly skillRepository: ISkillRepository,
  ) {}

  async getAll(): Promise<Skill[]> {
    return this.skillRepository.findAll();
  }
}
