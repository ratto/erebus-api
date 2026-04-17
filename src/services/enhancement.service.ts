import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../infrastructure/container/types.ts';
import type { IEnhancementRepository, EnhancementQuery, EnhancementPage } from '../repositories/enhancement.repository.ts';

export interface IEnhancementService {
  list(query: EnhancementQuery): Promise<EnhancementPage>;
}

@injectable()
export class EnhancementService implements IEnhancementService {
  constructor(
    @inject(TYPES.IEnhancementRepository) private readonly enhancementRepository: IEnhancementRepository,
  ) {}

  async list(query: EnhancementQuery): Promise<EnhancementPage> {
    return this.enhancementRepository.findAll(query);
  }
}
