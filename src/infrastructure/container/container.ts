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

export { container };
