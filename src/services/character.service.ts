import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../infrastructure/container/types.ts';
import type { ICoreAdapter } from '../adapters/core.adapter.ts';
import type { Character, CharacterValidationResult } from '../model/entities/character.entity.ts';

export interface ICharacterService {
  validate(character: Character): Promise<CharacterValidationResult>;
}

@injectable()
export class CharacterService implements ICharacterService {
  constructor(@inject(TYPES.ICoreAdapter) private readonly core: ICoreAdapter) {}

  async validate(character: Character): Promise<CharacterValidationResult> {
    return this.core.validateCharacter(character);
  }
}
