import { describe, expect, it } from '@jest/globals';

describe('EventBus', () => {
  it('é um singleton — a mesma instância é retornada em múltiplos imports', async () => {
    // Jest armazena módulos em cache; importações repetidas retornam o mesmo objeto
    const { eventBus: bus1 } = await import('../../src/infrastructure/event-bus.ts');
    const { eventBus: bus2 } = await import('../../src/infrastructure/event-bus.ts');

    expect(bus1).toBe(bus2);
  });

  it('EventNames.DICE_ROLLED vale "dice.rolled"', async () => {
    const { EventNames } = await import('../../src/infrastructure/event-bus.ts');
    expect(EventNames.DICE_ROLLED).toBe('dice.rolled');
  });

  it('listeners registrados em uma referência recebem eventos emitidos pela outra', async () => {
    const { eventBus: bus1, EventNames: en1 } = await import('../../src/infrastructure/event-bus.ts');
    const { eventBus: bus2 } = await import('../../src/infrastructure/event-bus.ts');

    const received: unknown[] = [];
    bus1.once(en1.DICE_ROLLED, (payload) => received.push(payload));

    bus2.emit(en1.DICE_ROLLED, { test: true });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ test: true });
  });
});
