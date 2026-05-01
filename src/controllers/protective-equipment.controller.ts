import 'reflect-metadata';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { z } from 'zod';
import { TYPES } from '../infrastructure/container/types.ts';
import type { IProtectiveEquipmentService } from '../services/protective-equipment.service.ts';

const VALID_DAMAGE_TYPE_KEYS = [
  'KINETIC', 'BALLISTIC', 'FIRE', 'COLD', 'GAS', 'ACID', 'VACUUM', 'ELECTRIC',
] as const;

const searchQuerySchema = z.object({
  name:       z.string().optional(),
  damageType: z.enum(VALID_DAMAGE_TYPE_KEYS).optional(),
  minIp:      z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? Number(v) : undefined))
    .pipe(z.number().int().min(0).optional()),
});

@injectable()
export class ProtectiveEquipmentController {
  constructor(
    @inject(TYPES.IProtectiveEquipmentService)
    private readonly service: IProtectiveEquipmentService,
  ) {}

  async list(req: Request, res: Response): Promise<void> {
    const acceptLanguage = req.headers['accept-language'];
    const result = await this.service.getAll(acceptLanguage);
    res.status(200).json(result);
  }

  async search(req: Request, res: Response): Promise<void> {
    const parsed = searchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten() });
      return;
    }

    const { name, damageType, minIp } = parsed.data;
    const acceptLanguage = req.headers['accept-language'];

    const params: Parameters<IProtectiveEquipmentService['search']>[0] = {};
    if (name !== undefined)       params.name       = name;
    if (damageType !== undefined) params.damageType = damageType;
    if (minIp !== undefined)      params.minIp      = minIp;

    const result = await this.service.search(params, acceptLanguage);
    res.status(200).json(result);
  }
}
