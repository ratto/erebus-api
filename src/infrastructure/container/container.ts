import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types.ts';
import { type ICoreAdapter, CoreAdapter } from '../../adapters/core.adapter.ts';
import { DiceService } from '../../services/dice.service.ts';
import { DiceController } from '../../controllers/dice.controller.ts';
import { db } from '../database/db.ts';
import type { ISkillRepository } from '../../repositories/skill.repository.ts';
import { SkillRepository } from '../../repositories/skill.repository.ts';
import type { ISkillService } from '../../services/skill.service.ts';
import { SkillService } from '../../services/skill.service.ts';
import { SkillController } from '../../controllers/skill.controller.ts';
import type { IWeaponRepository } from '../../repositories/weapon.repository.ts';
import { WeaponRepository } from '../../repositories/weapon.repository.ts';
import type { IWeaponService } from '../../services/weapon.service.ts';
import { WeaponService } from '../../services/weapon.service.ts';
import { WeaponController } from '../../controllers/weapon.controller.ts';
import type { IEnhancementRepository } from '../../repositories/enhancement.repository.ts';
import { EnhancementRepository } from '../../repositories/enhancement.repository.ts';
import type { IEnhancementService } from '../../services/enhancement.service.ts';
import { EnhancementService } from '../../services/enhancement.service.ts';
import { EnhancementController } from '../../controllers/enhancement.controller.ts';
import { LogsService } from '../../services/logs.service.ts';
import { LogsController } from '../../controllers/logs.controller.ts';
import type { IProtectiveEquipmentRepository } from '../../repositories/protective-equipment.repository.ts';
import { ProtectiveEquipmentRepository } from '../../repositories/protective-equipment.repository.ts';
import type { IProtectiveEquipmentService } from '../../services/protective-equipment.service.ts';
import { ProtectiveEquipmentService } from '../../services/protective-equipment.service.ts';
import { ProtectiveEquipmentController } from '../../controllers/protective-equipment.controller.ts';
import type { ICombatSkillRepository } from '../../repositories/combat-skill.repository.ts';
import { CombatSkillRepository } from '../../repositories/combat-skill.repository.ts';
import type { ICombatSkillService } from '../../services/combat-skill.service.ts';
import { CombatSkillService } from '../../services/combat-skill.service.ts';
import { CombatSkillController } from '../../controllers/combat-skill.controller.ts';

const container = new Container();

container.bind<ICoreAdapter>(TYPES.ICoreAdapter).to(CoreAdapter).inSingletonScope();
container.bind<DiceService>(TYPES.DiceService).to(DiceService).inTransientScope();
container.bind<DiceController>(TYPES.DiceController).to(DiceController).inTransientScope();

// Database
container.bind(TYPES.DrizzleDb).toConstantValue(db);

// Skills
container.bind<ISkillRepository>(TYPES.ISkillRepository).to(SkillRepository).inSingletonScope();
container.bind<ISkillService>(TYPES.ISkillService).to(SkillService).inTransientScope();
container.bind<SkillController>(TYPES.SkillController).to(SkillController).inTransientScope();

// Weapons
container.bind<IWeaponRepository>(TYPES.IWeaponRepository).to(WeaponRepository).inSingletonScope();
container.bind<IWeaponService>(TYPES.IWeaponService).to(WeaponService).inTransientScope();
container.bind<WeaponController>(TYPES.WeaponController).to(WeaponController).inTransientScope();

// Enhancements
container.bind<IEnhancementRepository>(TYPES.IEnhancementRepository).to(EnhancementRepository).inSingletonScope();
container.bind<IEnhancementService>(TYPES.IEnhancementService).to(EnhancementService).inTransientScope();
container.bind<EnhancementController>(TYPES.EnhancementController).to(EnhancementController).inTransientScope();

// Logs / SSE
container.bind<LogsService>(TYPES.LogsService).to(LogsService).inSingletonScope();
container.bind<LogsController>(TYPES.LogsController).to(LogsController).inTransientScope();

// Protective Equipment
container
  .bind<IProtectiveEquipmentRepository>(TYPES.IProtectiveEquipmentRepository)
  .to(ProtectiveEquipmentRepository)
  .inSingletonScope();
container
  .bind<IProtectiveEquipmentService>(TYPES.IProtectiveEquipmentService)
  .to(ProtectiveEquipmentService)
  .inTransientScope();
container
  .bind<ProtectiveEquipmentController>(TYPES.ProtectiveEquipmentController)
  .to(ProtectiveEquipmentController)
  .inTransientScope();

// Combat Skills
container.bind<ICombatSkillRepository>(TYPES.ICombatSkillRepository).to(CombatSkillRepository).inSingletonScope();
container.bind<ICombatSkillService>(TYPES.ICombatSkillService).to(CombatSkillService).inTransientScope();
container.bind<CombatSkillController>(TYPES.CombatSkillController).to(CombatSkillController).inTransientScope();

export { container };
