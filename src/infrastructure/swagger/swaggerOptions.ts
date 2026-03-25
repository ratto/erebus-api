import swaggerJSDoc from 'swagger-jsdoc';

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Erebus API',
      version: '0.1.0',
      description: 'REST API do Sistema Erebus — Motor do Sistema Daemon (RPG)',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento',
      },
    ],
    paths: {
      '/api/v1/dice/roll': {
        post: {
          summary: 'Rolar dados',
          description: 'Executa uma rolagem de dados via erebus-engine e retorna os resultados.',
          tags: ['Dice'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['diceType', 'count'],
                  properties: {
                    diceType: {
                      type: 'string',
                      enum: ['d3', 'd4', 'd6', 'd8', 'd10', 'd12', 'd100'],
                      example: 'd6',
                      description: 'Tipo do dado (Sistema Daemon)',
                    },
                    count: {
                      type: 'integer',
                      minimum: 1,
                      example: 3,
                      description: 'Quantidade de dados a rolar',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Rolagem realizada com sucesso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      results: {
                        type: 'array',
                        items: { type: 'integer' },
                        example: [4, 2, 6],
                      },
                      total: {
                        type: 'integer',
                        example: 12,
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Dados de entrada inválidos',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      errors: {
                        type: 'object',
                        example: {
                          diceType: ['diceType must be one of: d3, d4, d6, d8, d10, d12, d100'],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
