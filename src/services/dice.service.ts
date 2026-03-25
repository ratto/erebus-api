import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../infrastructure/container/types.ts';
import type { ICoreAdapter } from '../adapters/core.adapter.ts';
import type { DiceRoll } from '../model/entities/dice.entity.ts';
import { DiceType } from '../model/enums/dice-type.enum.ts';

@injectable()
export class DiceService {
  constructor(@inject(TYPES.ICoreAdapter) private readonly core: ICoreAdapter) {}

  async roll(diceType: DiceType, count: number): Promise<DiceRoll> {
    return this.core.rollDice(diceType, count);
  }
}
