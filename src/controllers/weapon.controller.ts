import 'reflect-metadata';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { z } from 'zod';
import { TYPES } from '../infrastructure/container/types.ts';
import type { IWeaponService } from '../services/weapon.service.ts';

const tipoSchema = z
  .enum(['branca', 'branca_distancia', 'fogo'])
  .optional();

@injectable()
export class WeaponController {
  constructor(@inject(TYPES.IWeaponService) private readonly weaponService: IWeaponService) {}

  async list(req: Request, res: Response): Promise<void> {
    const parsed = tipoSchema.safeParse(req.query['tipo']);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().formErrors });
      return;
    }

    const weapons = await this.weaponService.getAll(parsed.data);
    res.status(200).json({ weapons });
  }
}
