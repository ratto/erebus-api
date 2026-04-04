import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../infrastructure/container/types.ts';
import type { IWeaponRepository } from '../repositories/weapon.repository.ts';
import type { Weapon } from '../model/entities/weapon.entity.ts';

export interface IWeaponService {
  getAll(tipo?: string): Promise<Weapon[]>;
}

@injectable()
export class WeaponService implements IWeaponService {
  constructor(
    @inject(TYPES.IWeaponRepository) private readonly weaponRepository: IWeaponRepository,
  ) {}

  async getAll(tipo?: string): Promise<Weapon[]> {
    return this.weaponRepository.findAll(tipo);
  }
}
