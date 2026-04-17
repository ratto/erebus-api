import 'reflect-metadata';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';
import cors from 'cors';
import { swaggerSpec } from './infrastructure/swagger/swaggerOptions.ts';
import { container } from './infrastructure/container/container.ts';
import { DiceController } from './controllers/dice.controller.ts';
import { SkillController } from './controllers/skill.controller.ts';
import { WeaponController } from './controllers/weapon.controller.ts';
import { TYPES } from './infrastructure/container/types.ts';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: true });

const app = express();
const port = Number(process.env['EREBUS_SERVER_PORT'] ?? 3000);

app.use(express.json());
app.use(morgan('dev'));
// const allowedOrigins = process.env['CORS_ORIGIN']?.split(',') ?? ['http://localhost:9000'];
app.use(cors({ origin: '*', optionsSuccessStatus: 200 }));

// Routes
const diceController = container.get<DiceController>(TYPES.DiceController);
app.post('/api/v1/dice/roll', (req, res) => diceController.roll(req, res));

const skillController = container.get<SkillController>(TYPES.SkillController);
app.get('/api/v1/skills', (req, res) => skillController.list(req, res));

const weaponController = container.get<WeaponController>(TYPES.WeaponController);
app.get('/api/v1/weapons', (req, res) => weaponController.list(req, res));

// Swagger UI
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, () => {
  console.log(`Erebus API listening on port ${port}`);
});

export { app };
