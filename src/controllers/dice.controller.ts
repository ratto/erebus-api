import 'reflect-metadata';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { z } from 'zod';
import { TYPES } from '../infrastructure/container/types.ts';
import { DiceService } from '../services/dice.service.ts';
import { VALID_DICE_TYPES } from '../model/enums/dice-type.enum.ts';

const rollSchema = z.object({
  diceType: z.enum(VALID_DICE_TYPES, {
    error: 'diceType must be one of: d3, d4, d6, d8, d10, d12, d100',
  }),
  count: z
    .number({ error: 'count must be a number' })
    .int({ error: 'count must be an integer' })
    .positive({ error: 'count must be a positive integer' }),
});

@injectable()
export class DiceController {
  constructor(@inject(TYPES.DiceService) private readonly diceService: DiceService) {}

  async roll(req: Request, res: Response): Promise<void> {
    const parsed = rollSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { diceType, count } = parsed.data;
    const result = await this.diceService.roll(diceType, count);
    res.status(200).json(result);
  }
}
