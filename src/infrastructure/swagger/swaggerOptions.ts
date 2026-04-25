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
      '/api/v1/characters/validate': {
        post: {
          summary: 'Validar ficha de personagem',
          description: 'Valida uma ficha de personagem no modo Aventura/Fantasia do Sistema Daemon. As regras de dominio sao verificadas pelo erebus-engine (SSOT).',
          tags: ['Characters'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'age', 'level', 'attributes'],
                  properties: {
                    name:  { type: 'string', minLength: 1, maxLength: 80, example: 'Thomas Ferguson' },
                    age:   { type: 'integer', minimum: 6, maximum: 90, example: 30 },
                    level: { type: 'integer', minimum: 1, maximum: 15, example: 1 },
                    attributes: {
                      type: 'object',
                      required: ['FR', 'DEX', 'AGI', 'CON', 'INT', 'WILL', 'CAR', 'PER'],
                      properties: {
                        FR:   { type: 'integer', minimum: 5, maximum: 20, example: 11 },
                        DEX:  { type: 'integer', minimum: 5, maximum: 20, example: 14 },
                        AGI:  { type: 'integer', minimum: 5, maximum: 20, example: 12 },
                        CON:  { type: 'integer', minimum: 5, maximum: 20, example: 10 },
                        INT:  { type: 'integer', minimum: 5, maximum: 20, example: 17 },
                        WILL: { type: 'integer', minimum: 5, maximum: 20, example: 15 },
                        CAR:  { type: 'integer', minimum: 5, maximum: 20, example: 16 },
                        PER:  { type: 'integer', minimum: 5, maximum: 20, example: 16 },
                      },
                    },
                    enhancements: {
                      type: 'array',
                      default: [],
                      items: {
                        type: 'object',
                        required: ['id', 'nome', 'custo'],
                        properties: {
                          id:    { type: 'integer', example: 1 },
                          nome:  { type: 'string', example: 'Ambidestria' },
                          custo: { type: 'integer', example: 5, description: 'Negativo para desvantagens' },
                        },
                      },
                    },
                    skills: {
                      type: 'array',
                      default: [],
                      items: {
                        type: 'object',
                        required: ['id', 'nome', 'pontos'],
                        properties: {
                          id:     { type: 'integer', example: 12 },
                          nome:   { type: 'string', example: 'Espada' },
                          pontos: { type: 'integer', minimum: 10, maximum: 50, example: 30 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Ficha valida — regras do Sistema Daemon satisfeitas',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      valid:      { type: 'boolean', example: true },
                      character:  { type: 'object', description: 'Mesmo payload enviado' },
                      computed: {
                        type: 'object',
                        properties: {
                          pv:                    { type: 'integer', example: 12 },
                          iniciativa:            { type: 'integer', example: 12 },
                          skillBudget:           { type: 'integer', example: 385 },
                          skillBudgetUsed:       { type: 'integer', example: 50 },
                          attributeBudget:       { type: 'integer', example: 111 },
                          attributeBudgetUsed:   { type: 'integer', example: 111 },
                          enhancementBudget:     { type: 'integer', example: 6 },
                          enhancementBudgetUsed: { type: 'integer', example: 6 },
                        },
                      },
                      errors: { type: 'array', items: { type: 'object' }, example: [] },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Payload malformado (falha Zod)',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      errors: { type: 'object', example: { 'attributes.FR': ['Number must be >= 5'] } },
                    },
                  },
                },
              },
            },
            '422': {
              description: 'Regras do Sistema Daemon violadas',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      valid: { type: 'boolean', example: false },
                      computed: { type: 'object' },
                      errors: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            code:    { type: 'string', example: 'ATTRIBUTE_BUDGET' },
                            message: { type: 'string', example: 'Sum of attributes must equal 111 (got 113)' },
                            skillId: { type: 'integer', description: 'Presente apenas para erros SKILL_POINTS_MIN/MAX' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Erro interno — binario do engine indisponivel',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string', example: 'Internal server error: engine unavailable' },
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
