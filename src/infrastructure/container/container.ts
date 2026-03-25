import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types.ts';
import { type ICoreAdapter, CoreAdapter } from '../../adapters/core.adapter.ts';
import { DiceService } from '../../services/dice.service.ts';
import { DiceController } from '../../controllers/dice.controller.ts';

const container = new Container();

container.bind<ICoreAdapter>(TYPES.ICoreAdapter).to(CoreAdapter).inSingletonScope();
container.bind<DiceService>(TYPES.DiceService).to(DiceService).inTransientScope();
container.bind<DiceController>(TYPES.DiceController).to(DiceController).inTransientScope();

export { container };
