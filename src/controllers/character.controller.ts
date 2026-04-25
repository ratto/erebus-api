import 'reflect-metadata';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { z } from 'zod';
import { TYPES } from '../infrastructure/container/types.ts';
import type { ICharacterService } from '../services/character.service.ts';

/**
 * Schema Zod de validacao estrutural.
 * Ranges de atributo [5,20] e pericias [10,50] sao validados aqui (HTTP 400).
 * Regras de dominio (soma=111, saldo PA, budget pericias) sao validadas
 * pelo erebus-engine e mapeadas para HTTP 422.
 */
const CharacterSchema = z.object({
  name: z.string().min(1).max(80),
  age: z.number().int().min(6).max(90),
  level: z.number().int().min(1).max(15),
  attributes: z.object({
    FR:   z.number().int().min(5).max(20),
    DEX:  z.number().int().min(5).max(20),
    AGI:  z.number().int().min(5).max(20),
    CON:  z.number().int().min(5).max(20),
    INT:  z.number().int().min(5).max(20),
    WILL: z.number().int().min(5).max(20),
    CAR:  z.number().int().min(5).max(20),
    PER:  z.number().int().min(5).max(20),
  }),
  enhancements: z.array(z.object({
    id:    z.number().int().positive(),
    nome:  z.string().min(1),
    custo: z.number().int(),
  })).default([]),
  skills: z.array(z.object({
    id:     z.number().int().positive(),
    nome:   z.string().min(1),
    pontos: z.number().int().min(10).max(50),
  })).default([]),
});

@injectable()
export class CharacterController {
  constructor(
    @inject(TYPES.ICharacterService) private readonly characterService: ICharacterService,
  ) {}

  async validate(req: Request, res: Response): Promise<void> {
    const parsed = CharacterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    try {
      const result = await this.characterService.validate(parsed.data);

      if (result.valid) {
        res.status(200).json({
          valid: true,
          character: parsed.data,
          computed: result.computed,
          errors: [],
        });
      } else {
        res.status(422).json({
          valid: false,
          computed: result.computed,
          errors: result.errors,
        });
      }
    } catch (err) {
      console.error('[CharacterController] Engine error:', err);
      res.status(500).json({ error: 'Internal server error: engine unavailable' });
    }
  }
}
