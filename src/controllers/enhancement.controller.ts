import 'reflect-metadata';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../infrastructure/container/types.ts';
import type { IEnhancementService } from '../services/enhancement.service.ts';

@injectable()
export class EnhancementController {
  constructor(@inject(TYPES.IEnhancementService) private readonly enhancementService: IEnhancementService) {}

  async list(req: Request, res: Response): Promise<void> {
    const enhancements = await this.enhancementService.getAll();
    res.status(200).json(enhancements);
  }
}
