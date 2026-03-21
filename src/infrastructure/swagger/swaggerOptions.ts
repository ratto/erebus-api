import swaggerJSDoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Documentação do Erebus API',
      version: '0.0.1',
      description: 'A simple Express API with Swagger documentation',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API route files
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
