import 'reflect-metadata';

import { Container } from 'inversify';

import { HealthController } from '../controllers/health.controller';
import { knexClient } from '../infra/database/knex-client';
import { logger } from '../infra/logger/logger';
import { HealthRepository } from '../repositories/health.repository';
import { HealthService } from '../services/health.service';

import { TYPES } from './types';

import type { IHealthRepository } from '../repositories/interfaces/health.repository.interface';
import type { IHealthService } from '../services/interfaces/health.service.interface';
import type { Logger } from 'pino';

/**
 * Composition root. Every binding is a singleton: the services are stateless and
 * the SQLite handle is read-only, so a request scope would only add cost in a
 * serverless runtime where the container is built once per cold start (LLD §9.2).
 */
export const container = new Container({ defaultScope: 'Singleton' });

// The Knex generic is deliberately omitted: the composition root wires the
// instance but must not import the Knex API, which belongs to the data-access
// layer alone (LLD §4.1). `toConstantValue` infers the type from `knexClient`.
container.bind(TYPES.Knex).toConstantValue(knexClient);
container.bind<Logger>(TYPES.Logger).toConstantValue(logger);

container.bind<IHealthRepository>(TYPES.HealthRepository).to(HealthRepository);
container.bind<IHealthService>(TYPES.HealthService).to(HealthService);
container.bind<HealthController>(TYPES.HealthController).to(HealthController);
