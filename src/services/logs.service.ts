import 'reflect-metadata';
import { injectable } from 'inversify';
import type { Response } from 'express';
import { eventBus, EventNames } from '../infrastructure/event-bus.ts';

@injectable()
export class LogsService {
  subscribe(res: Response): () => void {
    const listener = (payload: unknown) => {
      const data = JSON.stringify({
        event: EventNames.DICE_ROLLED,
        payload,
        timestamp: new Date().toISOString(),
      });
      res.write(`data: ${data}\n\n`);
    };

    eventBus.on(EventNames.DICE_ROLLED, listener);

    return () => {
      eventBus.off(EventNames.DICE_ROLLED, listener);
    };
  }
}
