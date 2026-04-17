import { EventEmitter } from 'events';

export const eventBus = new EventEmitter();

export const EventNames = {
  DICE_ROLLED: 'dice.rolled',
} as const;

export interface DiceRolledPayload {
  diceType: string;
  count: number;
  results: number[];
  total: number;
}
