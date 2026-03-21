import express from 'express';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';
import { swaggerSpec } from './infrastructure/swagger/swaggerOptions.ts';

const app = express();
const port = 3000;

/* app.get('/', (req, res) => {
  res.send('Hello World!');
}); */

app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(morgan('dev'));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
