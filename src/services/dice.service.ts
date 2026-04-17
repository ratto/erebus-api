import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../infrastructure/container/types.ts';
import type { ICoreAdapter } from '../adapters/core.adapter.ts';
import type { DiceRoll } from '../model/entities/dice.entity.ts';
import { DiceType } from '../model/enums/dice-type.enum.ts';
import { eventBus, EventNames } from '../infrastructure/event-bus.ts';

@injectable()
export class DiceService {
  constructor(@inject(TYPES.ICoreAdapter) private readonly core: ICoreAdapter) {}

  async roll(diceType: DiceType, count: number): Promise<DiceRoll> {
    const result = await this.core.rollDice(diceType, count);
    eventBus.emit(EventNames.DICE_ROLLED, {
      diceType,
      count,
      results: result.results,
      total: result.total,
    });
    return result;
  }
}
