import 'reflect-metadata';
import { describe, expect, it, jest, afterEach } from '@jest/globals';
import { DiceService } from '../../src/services/dice.service.ts';
import type { ICoreAdapter } from '../../src/adapters/core.adapter.ts';
import { DiceType } from '../../src/model/enums/dice-type.enum.ts';
import { eventBus, EventNames } from '../../src/infrastructure/event-bus.ts';
import type { DiceRolledPayload } from '../../src/infrastructure/event-bus.ts';

function buildMockAdapter(results: number[] = [3, 4], total = 7): ICoreAdapter {
  return {
    rollDice: jest.fn<() => Promise<{ results: number[]; total: number }>>().mockResolvedValue({ results, total }),
  };
}

describe('DiceService', () => {
  afterEach(() => {
    eventBus.removeAllListeners(EventNames.DICE_ROLLED);
  });

  describe('roll()', () => {
    it('emite evento dice.rolled no EventBus com payload correto (diceType, count, results, total)', async () => {
      const adapter = buildMockAdapter([3, 4], 7);
      const service = new DiceService(adapter);

      let capturedPayload: DiceRolledPayload | undefined;
      eventBus.once(EventNames.DICE_ROLLED, (payload: unknown) => {
        capturedPayload = payload as DiceRolledPayload;
      });

      await service.roll(DiceType.d6, 2);

      expect(capturedPayload).toBeDefined();
      expect(capturedPayload?.diceType).toBe(DiceType.d6);
      expect(capturedPayload?.count).toBe(2);
      expect(capturedPayload?.results).toEqual([3, 4]);
      expect(capturedPayload?.total).toBe(7);
    });

    it('emite exatamente um evento por chamada a roll()', async () => {
      const adapter = buildMockAdapter();
      const service = new DiceService(adapter);

      const listener = jest.fn();
      eventBus.on(EventNames.DICE_ROLLED, listener);

      await service.roll(DiceType.d6, 2);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('retorna o resultado do CoreAdapter sem modificação', async () => {
      const adapter = buildMockAdapter([5], 5);
      const service = new DiceService(adapter);

      const result = await service.roll(DiceType.d6, 1);

      expect(result).toEqual({ results: [5], total: 5 });
    });

    it('delega a chamada ao CoreAdapter com os parâmetros corretos', async () => {
      const adapter = buildMockAdapter();
      const service = new DiceService(adapter);

      await service.roll(DiceType.d8, 3);

      expect(adapter.rollDice).toHaveBeenCalledWith(DiceType.d8, 3);
      expect(adapter.rollDice).toHaveBeenCalledTimes(1);
    });
  });
});
