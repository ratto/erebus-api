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
      '/api/v1/protective-equipment': {
        get: {
          summary: 'Listar equipamentos de proteção',
          description: 'Retorna todos os equipamentos de proteção com seus Índices de Proteção (IP) por tipo de dano. Suporta internacionalização via cabeçalho Accept-Language (pt-BR ou en-US).',
          tags: ['Protective Equipment'],
          parameters: [
            {
              name: 'Accept-Language',
              in: 'header',
              required: false,
              description: 'Idioma da resposta. pt-BR retorna nomes e descrições em português; qualquer outro valor usa inglês (en-US).',
              schema: {
                type: 'string',
                example: 'pt-BR',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Lista de equipamentos de proteção retornada com sucesso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['locale', 'protectiveEquipment'],
                    properties: {
                      locale: {
                        type: 'string',
                        example: 'en-US',
                        description: 'Idioma resolvido da resposta',
                      },
                      protectiveEquipment: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/ProtectiveEquipment',
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
      '/api/v1/protective-equipment/search': {
        get: {
          summary: 'Buscar equipamentos de proteção',
          description: 'Busca equipamentos de proteção com filtros opcionais por nome, tipo de dano e valor mínimo de IP.',
          tags: ['Protective Equipment'],
          parameters: [
            {
              name: 'Accept-Language',
              in: 'header',
              required: false,
              description: 'Idioma da resposta (pt-BR ou en-US).',
              schema: { type: 'string', example: 'pt-BR' },
            },
            {
              name: 'name',
              in: 'query',
              required: false,
              description: 'Busca parcial case-insensitive no nome do equipamento (no idioma resolvido).',
              schema: { type: 'string', example: 'kevlar' },
            },
            {
              name: 'damageType',
              in: 'query',
              required: false,
              description: 'Filtra equipamentos que possuem IP > 0 para este tipo de dano.',
              schema: {
                type: 'string',
                enum: ['KINETIC', 'BALLISTIC', 'FIRE', 'COLD', 'GAS', 'ACID', 'VACUUM', 'ELECTRIC'],
                example: 'BALLISTIC',
              },
            },
            {
              name: 'minIp',
              in: 'query',
              required: false,
              description: 'Combinado com damageType: filtra equipamentos com ipValue >= minIp. Ignorado se damageType não for fornecido. Padrão: 1.',
              schema: { type: 'integer', minimum: 0, example: 10 },
            },
          ],
          responses: {
            '200': {
              description: 'Lista de equipamentos filtrada com sucesso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['locale', 'protectiveEquipment'],
                    properties: {
                      locale: { type: 'string', example: 'en-US' },
                      protectiveEquipment: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ProtectiveEquipment' },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Parâmetros inválidos',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      errors: {
                        type: 'object',
                        properties: {
                          fieldErrors: {
                            type: 'object',
                            example: {
                              damageType: ["Invalid enum value. Expected 'KINETIC' | 'BALLISTIC' | 'FIRE' | 'COLD' | 'GAS' | 'ACID' | 'VACUUM' | 'ELECTRIC', received 'FOGO'"],
                            },
                          },
                          formErrors: { type: 'array', items: { type: 'string' } },
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
    components: {
      schemas: {
        DamageType: {
          type: 'string',
          description: 'Tipo de dano do Sistema Daemon',
          enum: ['KINETIC', 'BALLISTIC', 'FIRE', 'COLD', 'GAS', 'ACID', 'VACUUM', 'ELECTRIC'],
        },
        ProtectiveIndexEntry: {
          type: 'object',
          required: ['damageType', 'ipValue'],
          properties: {
            damageType: {
              $ref: '#/components/schemas/DamageType',
              description: 'Tipo de dano ao qual este IP se aplica',
            },
            ipValue: {
              type: 'integer',
              minimum: 0,
              example: 6,
              description: 'Valor do Índice de Proteção (0 = sem proteção para este tipo)',
            },
          },
        },
        ProtectiveEquipment: {
          type: 'object',
          required: ['id', 'name', 'dexPenalty', 'agiPenalty', 'description', 'source', 'protectiveIndex'],
          properties: {
            id: { type: 'integer', example: 6 },
            name: { type: 'string', example: 'Chainmail', description: 'Nome do equipamento no idioma resolvido' },
            cost: { type: 'string', nullable: true, example: null, description: 'Custo (pode ser null se não disponível)' },
            availability: { type: 'string', nullable: true, example: null, description: 'Disponibilidade (pode ser null)' },
            weightKg: { type: 'number', nullable: true, example: null, description: 'Peso em kg (pode ser null)' },
            dexPenalty: { type: 'integer', minimum: 0, example: 3, description: 'Penalidade de DEX enquanto vestido (valor positivo = quanto é subtraído)' },
            agiPenalty: { type: 'integer', minimum: 0, example: 2, description: 'Penalidade de AGI enquanto vestido' },
            description: { type: 'string', example: 'Interlocked metal rings covering torso, shoulders and arms.' },
            source: { type: 'string', example: 'TREVAS, 3rd ed. (Daemon Editora, 2004)' },
            protectiveIndex: {
              type: 'array',
              description: 'Índices de Proteção por tipo de dano — sempre 8 entradas (uma por tipo), zeros incluídos',
              items: { $ref: '#/components/schemas/ProtectiveIndexEntry' },
              minItems: 8,
              maxItems: 8,
            },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
