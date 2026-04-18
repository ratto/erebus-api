import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../infrastructure/container/types.ts';
import type { IEnhancementRepository } from '../repositories/enhancement.repository.ts';
import type { Enhancement } from '../model/entities/enhancement.entity.ts';

export interface IEnhancementService {
  getAll(): Promise<Enhancement[]>;
}

@injectable()
export class EnhancementService implements IEnhancementService {
  constructor(@inject(TYPES.IEnhancementRepository) private readonly enhancementRepository: IEnhancementRepository) {}

  async getAll(): Promise<Enhancement[]> {
    return this.enhancementRepository.findAll();
  }
}
