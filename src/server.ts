import 'reflect-metadata';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';
import { swaggerSpec } from './infrastructure/swagger/swaggerOptions.ts';
import { container } from './infrastructure/container/container.ts';
import { DiceController } from './controllers/dice.controller.ts';
import { TYPES } from './infrastructure/container/types.ts';

const app = express();
const port = Number(process.env['PORT'] ?? 3000);

app.use(express.json());
app.use(morgan('dev'));

// Routes
const diceController = container.get<DiceController>(TYPES.DiceController);
app.post('/api/v1/dice/roll', (req, res) => diceController.roll(req, res));

// Swagger UI
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, () => {
  console.log(`Erebus API listening on port ${port}`);
});

export { app };
