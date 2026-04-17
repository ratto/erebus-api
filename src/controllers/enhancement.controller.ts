import 'reflect-metadata';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { z } from 'zod';
import { TYPES } from '../infrastructure/container/types.ts';
import type { IEnhancementService } from '../services/enhancement.service.ts';

const querySchema = z.object({
  tipo:   z.enum(['positivo', 'negativo']).optional(),
  search: z.string().optional(),
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().positive().default(20),
});

@injectable()
export class EnhancementController {
  constructor(@inject(TYPES.IEnhancementService) private readonly enhancementService: IEnhancementService) {}

  async list(req: Request, res: Response): Promise<void> {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { tipo, search, page, limit } = parsed.data;
    const query = { page, limit, ...(tipo !== undefined && { tipo }), ...(search !== undefined && { search }) };
    const result = await this.enhancementService.list(query);
    res.status(200).json(result);
  }
}
