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
      '/api/v1/skills': {
        get: {
          summary: 'Listar perícias',
          description: 'Retorna todas as 195 perícias do Sistema Daemon em formato JSON.',
          tags: ['Skills'],
          responses: {
            '200': {
              description: 'Lista de perícias retornada com sucesso',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['id', 'nome', 'descricao', 'apenasComTreinamento'],
                      properties: {
                        id: {
                          type: 'integer',
                          example: 1,
                          description: 'Identificador único da perícia',
                        },
                        nome: {
                          type: 'string',
                          example: 'Espada',
                          description: 'Nome da perícia',
                        },
                        grupo: {
                          type: 'string',
                          nullable: true,
                          example: 'Combate',
                          description: 'Grupo ao qual a perícia pertence',
                        },
                        atributoBase: {
                          type: 'string',
                          nullable: true,
                          enum: ['FR', 'DEX', 'AGI', 'CON', 'INT', 'PER', 'CAR', 'WILL'],
                          example: 'DEX',
                          description: 'Atributo base da perícia',
                        },
                        apenasComTreinamento: {
                          type: 'boolean',
                          example: true,
                          description: 'Indica se a perícia requer treinamento formal',
                        },
                        sinergia: {
                          type: 'string',
                          nullable: true,
                          example: 'Conhecimento Arcano (Arcano)',
                          description: 'Perícia de sinergia relacionada',
                        },
                        descricao: {
                          type: 'string',
                          example: 'Habilidade no uso de espadas em combate.',
                          description: 'Descrição detalhada da perícia',
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
      '/api/v1/weapons': {
        get: {
          summary: 'Listar armas',
          description: 'Retorna as 129 armas do Sistema Daemon. Filtre por tipo com o parâmetro opcional ?tipo.',
          tags: ['Weapons'],
          parameters: [
            {
              name: 'tipo',
              in: 'query',
              required: false,
              description: 'Filtra armas pelo tipo',
              schema: {
                type: 'string',
                enum: ['branca', 'branca_distancia', 'fogo'],
              },
            },
          ],
          responses: {
            '200': {
              description: 'Lista de armas retornada com sucesso',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['id', 'nome', 'categoria', 'dano', 'iniciativa', 'fonte', 'tipo'],
                      properties: {
                        id: { type: 'integer', example: 1 },
                        nome: { type: 'string', example: 'Faca' },
                        categoria: { type: 'string', example: 'Adaga' },
                        dano: { type: 'string', example: '1d3' },
                        iniciativa: { type: 'string', example: '-3' },
                        fonte: { type: 'string', example: 'Módulo Básico v1.01' },
                        tipo: { type: 'string', enum: ['branca', 'branca_distancia', 'fogo'] },
                        tipoDano: { type: 'string', nullable: true, example: 'Corte/Perfuração' },
                        ocultabilidade: { type: 'string', nullable: true, example: 'Bolso' },
                        alcanceMedio: { type: 'string', nullable: true, example: '30m' },
                        alcanceMax: { type: 'string', nullable: true, example: '70m' },
                        calibre: { type: 'string', nullable: true, example: '9mm' },
                        alcanceEfetivo: { type: 'string', nullable: true, example: '25m' },
                        rof: { type: 'string', nullable: true, example: '1' },
                        pente: { type: 'string', nullable: true, example: '15' },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Parâmetro tipo inválido',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      errors: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ["Invalid enum value. Expected 'branca' | 'branca_distancia' | 'fogo', received 'invalido'"],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/enhancements': {
        get: {
          summary: 'Listar aprimoramentos',
          description: 'Retorna todos os aprimoramentos (vantagens e desvantagens) do Sistema Daemon.',
          tags: ['Enhancements'],
          responses: {
            '200': {
              description: 'Lista de aprimoramentos retornada com sucesso',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['id', 'nome', 'descricao', 'tipo', 'custo'],
                      properties: {
                        id: { type: 'integer', example: 1 },
                        nome: { type: 'string', example: 'Ambidestria' },
                        descricao: { type: 'string', example: 'O personagem pode usar ambas as mãos com igual habilidade.' },
                        tipo: { type: 'string', enum: ['positivo', 'negativo'], example: 'positivo' },
                        custo: { type: 'integer', example: 5, description: 'Negativo para desvantagens (ex: -3)' },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Query param inválido',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string', example: 'Validation error' },
                      details: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/combat-skills': {
        get: {
          summary: 'Listar perícias de combate',
          description: 'Retorna todas as Perícias de Combate do Sistema Daemon com seus atributos base e tipo (melee, ranged, shield).',
          tags: ['Combat Skills'],
          responses: {
            '200': {
              description: 'Lista de perícias de combate retornada com sucesso',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['id', 'nome', 'tipo', 'descricao'],
                      properties: {
                        id: { type: 'integer', example: 1 },
                        nome: { type: 'string', example: 'Espada' },
                        tipo: {
                          type: 'string',
                          enum: ['melee', 'ranged', 'shield'],
                          example: 'melee',
                        },
                        atributoAtaque: {
                          type: 'string',
                          nullable: true,
                          enum: ['FR', 'DEX', 'AGI', 'CON', 'INT', 'PER', 'CAR', 'WILL'],
                          example: 'DEX',
                        },
                        atributoDefesa: {
                          type: 'string',
                          nullable: true,
                          enum: ['FR', 'DEX', 'AGI', 'CON', 'INT', 'PER', 'CAR', 'WILL'],
                          example: 'DEX',
                        },
                        aprimoramentoRequerido: {
                          type: 'string',
                          nullable: true,
                          example: 'Armas de Fogo',
                        },
                        descricao: {
                          type: 'string',
                          example: 'Uso de espadas e similares em combate.',
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
