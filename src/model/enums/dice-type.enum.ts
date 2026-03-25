export enum DiceType {
  d3   = 'd3',
  d4   = 'd4',
  d6   = 'd6',
  d8   = 'd8',
  d10  = 'd10',
  d12  = 'd12',
  d100 = 'd100',
}

export const VALID_DICE_TYPES = Object.values(DiceType) as [string, ...string[]];
