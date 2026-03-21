# PRD: Erebus API (Node.js + TypeScript)

**Versão:** 0.0.1
**Data de Criação:** 16/03/2026
**Status:** Iniciado
**Repositório:** `github.com/ratto/erebus-api`

---

## 1. Visão Geral do Produto

O **Erebus API** é uma camada REST que expõe as mecânicas de jogo do **erebus-engine** (biblioteca C++) para consumo por clientes HTTP — principalmente o **erebus-app** (SPA Vue 3) e integradores externos.

A API atua como tradutor entre o mundo C++ do Core e o mundo JavaScript da web: recebe requisições HTTP, aciona o engine via Core Adapter (subprocess/FFI), serializa os resultados em JSON e os devolve ao cliente. Além disso, retransmite os eventos internos do EventBus do engine como **Server-Sent Events (SSE)**, permitindo observabilidade em tempo real.

### Missão

Fornecer uma interface HTTP estável, tipada e documentada sobre as mecânicas do Sistema Daemon, desacoplando completamente o cliente web da implementação C++ subjacente.

---

## 2. Objetivos do Produto

### Objetivos Primários (MVP)

1. **Expor os 8 endpoints MVP** do Sistema Daemon via REST, cobrindo personagens, atributos, perícias, combate, magia e logs
2. **Integrar o erebus-engine** como submódulo Git (`core/`), executando-o via Core Adapter (subprocess ou FFI)
3. **Retransmitir eventos do engine** via SSE em `/api/v1/logs/stream`, consumindo o EventBus do Core
4. **Documentar a API** automaticamente com Swagger UI disponível em `/api/v1/docs`
5. **Garantir qualidade** com TypeScript strict, Zod em todos os inputs, cobertura de testes > 80%

### Objetivos Secundários (Pós-MVP)

- Autenticação JWT para uso multi-usuário
- Cache de resultados com Redis
- Rate limiting e proteção contra abuso
- Suporte a WebSocket como alternativa ao SSE
- Bindings diretos ao erebus-engine via WebAssembly (eliminando subprocess)

---

## 3. User Personas

| Persona | Descrição | Necessidades |
|---------|-----------|--------------|
| **Dev erebus-app** | Desenvolvedor do frontend Vue 3 consumindo a API via Axios | Endpoints REST previsíveis, schemas JSON bem definidos, SSE para eventos |
| **Integrador Externo** | Desenvolvedor criando ferramenta sobre o Sistema Daemon | Swagger bem documentado, endpoints estáveis, exemplos de request/response |
| **QA / Testador** | Engenheiro de qualidade verificando comportamentos | Swagger UI interativo, logs SSE para observabilidade, endpoints de health |
| **Desenvolvedor do Erebus** | Contribuidor ao projeto Erebus que adiciona novos endpoints | Clean Architecture clara, DI com Inversify, Zod para validação |

---

## 4. Escopo do MVP

### Dentro do escopo

- ✅ 8 endpoints REST cobertos na seção de Requisitos Funcionais
- ✅ Streaming de eventos SSE do engine em tempo real
- ✅ Documentação automática via Swagger JSDoc (`/api/v1/docs`)
- ✅ Validação de inputs com Zod em todos os endpoints
- ✅ IoC Container com Inversify para inversão de dependências
- ✅ Persistência read-only de perícias, atributos e magias via Drizzle ORM + SQLite
- ✅ Logging de requisições HTTP com Morgan
- ✅ Testes unitários e de integração com Jest + Supertest

### Fora do escopo (MVP)

- ❌ Autenticação e autorização de usuários
- ❌ Persistência de personagens criados (sessão stateless)
- ❌ WebSocket (apenas SSE)
- ❌ Rate limiting
- ❌ Deploy em produção / containerização (fase posterior)
- ❌ Testes E2E (cobertos pelo erebus-app com Cypress)

---

## 5. Requisitos Funcionais

### RF-1: Geração de Personagem

**Descrição:** A API deve gerar um personagem aleatório segundo as regras do Sistema Daemon, delegando a criação ao erebus-engine via Core Adapter.

**Endpoint:** `GET /api/v1/characters/create`

**Query Parameters:**
- `mode`: `adventure` (111 pontos) | `realistic` (101 pontos) — padrão: `adventure`

**Critérios de Aceite:**
- [ ] Resposta contém os 8 atributos (FR, DEX, AGI, CONS, INT, WILL, CAR, PER) com valores numéricos
- [ ] Modo `adventure` distribui 111 pontos; modo `realistic` distribui 101 pontos
- [ ] Personagem inclui cálculo de atributos secundários (vida, defesa, movimento)
- [ ] Evento `CharacterCreated` emitido no SSE stream após geração
- [ ] Parâmetro `mode` inválido retorna `400` com mensagem descritiva (validado por Zod)

**Requisitos Técnicos:**
- Controller → Service → CoreAdapter
- DTO de response tipado com Zod

---

### RF-2: Listagem de Atributos

**Descrição:** A API deve listar os 8 atributos primários do Sistema Daemon com seus códigos, nomes e descrições.

**Endpoint:** `GET /api/v1/attributes`

**Critérios de Aceite:**
- [ ] Retorna array com os 8 atributos: FR, DEX, AGI, CONS, INT, WILL, CAR, PER
- [ ] Cada item contém: código, nome completo, descrição
- [ ] Resposta em `200` com array JSON
- [ ] Dados servidos do banco (Drizzle ORM) ou seed estático

**Requisitos Técnicos:**
- Controller → AttributeService → AttributeRepository (Drizzle)

---

### RF-3: Gerenciamento de Perícias

**Descrição:** A API deve listar as perícias do Sistema Daemon com suporte a paginação e filtragem.

**Endpoints:**
- `GET /api/v1/skills` — lista paginada

**Query Parameters:**
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 20, máximo: 100)
- `name`: filtro por nome da perícia
- `group`: filtro por Grupo de perícias (Animal, Arts, Science, Driving, etc.)
- `sinergy`: filtro por sinergia entre perícias (Carro de corrida (Pilotagem) <- Automóveis (Conduzir), Engenharia da computação (Engenharia) <- Computação (Informática), etc.)
- `trained only`: filtro por perícia treinada (booleano)

**Critérios de Aceite:**
- [ ] Resposta contém `data[]`, `total`, `page`, `limit`
- [ ] Filtro `group` retorna somente perícias do grupo especificado
- [ ] Busca `name` filtra por nome (case-insensitive)
- [ ] Parâmetros inválidos retornam `400` com detalhes do erro (Zod)
- [ ] Suporte a ~150 perícias do Sistema Daemon na base de dados

**Requisitos Técnicos:**
- BasicSkillController → BasicSkillService → BasicSkillRepository (Drizzle + SQLite)

---

### RF-4: Resolução de Teste de Perícia

**Descrição:** A API deve resolver um teste de perícia para um personagem, delegando ao erebus-engine.

**Endpoint:** `POST /api/v1/skills/test`

**Body:**
```json
{
  "characterId": "string | objeto personagem",
  "skillCode": "string",
  "modifier": "number (opcional, default 0)"
}
```

**Critérios de Aceite:**
- [ ] Retorna resultado do teste: roll, target, margin, success/failure
- [ ] Margem calculada como `roll − target`
- [ ] Evento `SkillTested` emitido no SSE stream
- [ ] Body inválido retorna `400` com detalhe do campo (Zod)
- [ ] Skill inexistente retorna `404`

**Requisitos Técnicos:**
- Controller → SkillService → CoreAdapter
- DTO com schema Zod para request e response

---

### RF-5: Resolução de Combate

**Descrição:** A API deve resolver um turno de combate entre dois personagens.

**Endpoint:** `POST /api/v1/combat/resolve`

**Body:**
```json
{
  "attacker": "objeto personagem",
  "defender": "objeto personagem",
  "action": "Attack | Defend | Cast | Dodge | Retreat"
}
```

**Critérios de Aceite:**
- [ ] Retorna resultado: iniciativa, ação executada, dano aplicado, novo estado de vida
- [ ] Cálculo de iniciativa baseado nos atributos dos combatentes
- [ ] Evento `CombatResolved` emitido no SSE stream
- [ ] Body inválido retorna `400` (Zod)
- [ ] Ação inválida retorna `400` com enum de ações válidas

**Requisitos Técnicos:**
- Controller → CombatService → CoreAdapter

---

### RF-6: Magia e Conjurações

**Descrição:** A API deve listar magias disponíveis e resolver conjurações.

**Endpoints:**
- `GET /api/v1/spells` — lista paginada (mesmos parâmetros de `/skills`)
- `POST /api/v1/spells/cast` — resolve conjuração

**Body (cast):**
```json
{
  "casterCharacter": "objeto personagem",
  "spellCode": "string",
  "ritualMode": "boolean (opcional, default false)"
}
```

**Critérios de Aceite:**
- [ ] Listagem de magias com paginação e filtro por escola (`school`)
- [ ] Resolução de conjuração retorna: sucesso/falha, custo de magia, efeito
- [ ] Validação de pré-requisitos (magia suficiente, perícia necessária)
- [ ] Evento `SpellCasted` emitido no SSE stream
- [ ] Suporte a ~80 magias do Sistema Daemon na base de dados

**Requisitos Técnicos:**
- Controller → SpellService → CoreAdapter + SpellRepository (Drizzle)

---

### RF-7: Streaming de Eventos (SSE)

**Descrição:** A API deve retransmitir em tempo real todos os eventos emitidos pelo EventBus do erebus-engine como Server-Sent Events.

**Endpoint:** `GET /api/v1/logs/stream`

**Critérios de Aceite:**
- [ ] Conexão retorna `Content-Type: text/event-stream`
- [ ] Cada evento emitido pelo engine é enviado como SSE com `data: { type, payload, timestamp }`
- [ ] Eventos cobertos: `CharacterCreated`, `SkillTested`, `CombatResolved`, `SpellCasted`, `AttributeModified`
- [ ] Reconexão automática suportada (SSE padrão)
- [ ] Conexão encerrada graciosamente ao fechar o cliente

**Requisitos Técnicos:**
- Controller → EventStreamer (IEventStreamer) → EventBus do CoreAdapter
- Headers corretos: `Cache-Control: no-cache`, `Connection: keep-alive`

---

## 6. Requisitos Não-Funcionais

| Requisito | Critério | Métrica |
|-----------|----------|---------|
| **Performance** | Endpoints síncronos respondem em < 200ms (p95) | Load test com k6 |
| **Testabilidade** | Cobertura de testes > 80% (linhas + funções + branches) | Jest `--coverage` com thresholds |
| **Segurança** | Inputs validados com Zod em todos os endpoints; sem SQL injection possível (Drizzle ORM parameterizado) | Revisão de código + Balder |
| **Documentação** | 100% dos endpoints documentados com JSDoc Swagger | Swagger UI em `/api/v1/docs` |
| **Manutenibilidade** | TypeScript strict sem `any` implícito; sem `console.log` em produção | `tsc --noEmit` + ESLint |
| **Portabilidade** | API executável com `npm start` após `npm install` | CI pipeline |

---

## 7. Arquitetura Técnica

### Stack

| Componente | Tecnologia |
|---|---|
| HTTP Framework | Express.js v5 |
| Linguagem | TypeScript 5.9+ (ESM, `"type": "module"`) |
| IoC / DI | Inversify v8 + reflect-metadata |
| Validação | Zod v4 |
| ORM | Drizzle ORM |
| Banco de Dados | SQLite (better-sqlite3) / LibSQL (Turso) |
| Logging HTTP | Morgan |
| API Docs | swagger-jsdoc + swagger-ui-express |
| Testes | Jest + ts-jest + Supertest |
| Env Vars | dotenv |

### Estrutura de Diretórios

```
erebus-api/
├── core/                          # Git submodule → erebus-engine (C++)
├── database/                      # Schemas e migrations Drizzle
├── docs/                          # Documentação (este PRD)
├── src/
│   ├── server.ts                  # Entry point — Express app + middlewares
│   ├── adapters/                  # Core Adapter (subprocess/FFI → erebus-engine)
│   │   └── CoreAdapter.ts
│   ├── controllers/               # Camada HTTP — recebe req, valida, chama service
│   │   ├── CharacterController.ts
│   │   ├── AttributeController.ts
│   │   ├── SkillController.ts
│   │   ├── CombatController.ts
│   │   ├── SpellController.ts
│   │   └── LogsController.ts
│   ├── services/                  # Lógica de negócio — orquestra adapters e repos
│   │   ├── CharacterService.ts
│   │   ├── SkillService.ts
│   │   ├── CombatService.ts
│   │   ├── SpellService.ts
│   │   └── LogsService.ts
│   ├── repositories/              # Acesso a dados (Drizzle ORM)
│   │   ├── SkillRepository.ts
│   │   ├── AttributeRepository.ts
│   │   └── SpellRepository.ts
│   ├── model/                     # Domínio — entidades, enums, utilitários
│   │   ├── entities/              # Interfaces/tipos de domínio (Character, Skill, etc.)
│   │   ├── enums/                 # Enums (AttributeCode, ActionType, etc.)
│   │   └── utils/                 # Helpers de domínio
│   └── infrastructure/
│       ├── container/             # IoC container Inversify (TYPES + bindings)
│       │   ├── types.ts
│       │   └── container.ts
│       ├── database/              # Configuração Drizzle + schema
│       └── swagger/               # swaggerOptions.ts
├── tests/
│   ├── unit/                      # Testes unitários (services, utils)
│   └── integration/               # Testes de integração (Supertest)
├── package.json
└── tsconfig.json
```

### Fluxo de Requisição

```
Cliente HTTP
  └── Express Router
        └── Controller (valida com Zod, injeta via Inversify)
              └── Service (orquestra)
                    ├── Repository (Drizzle ORM → SQLite)
                    └── CoreAdapter (subprocess → erebus-engine)
                          └── EventBus → SSE Stream (LogsController)
```

### Padrões Arquiteturais

- **Clean Architecture:** Controller → Service → Repository/Adapter (nunca pule camadas)
- **Dependency Injection:** Inversify v8 — todas as dependências declaradas via `@injectable` / `@inject`
- **Ports & Adapters:** Interfaces em `src/model/` definem contratos; implementações em `src/adapters/` e `src/repositories/`
- **Validação na borda:** Zod schemas em todos os Controllers para request body e query params

---

## 8. Critérios de Aceite (DoD Global)

- ✅ `tsc --noEmit` sem erros (strict mode + decorators habilitados)
- ✅ `npm test` passando verde com cobertura ≥ 80% (linhas, funções, branches)
- ✅ `npm run lint` sem erros
- ✅ Sem `console.log` no código de produção (`src/`) — use Morgan para HTTP, `console.error` apenas em erros críticos antes de logger estruturado ser integrado
- ✅ Sem `any` implícito em TypeScript
- ✅ Todos os inputs de endpoints validados por schema Zod
- ✅ Swagger JSDoc completo para cada endpoint (`@swagger` annotations)
- ✅ PR review por pelo menos um desenvolvedor

---

## 9. Variáveis de Ambiente

```bash
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
DATABASE_URL=./data/erebus.db        # SQLite local; ou postgresql:// para PostgreSQL
CORS_ORIGIN=http://localhost:5173    # URL do erebus-app em dev
CORE_PATH=./core/erebus              # Path para o binário compilado do erebus-engine
```

---

## 10. Dependências e Integrações

### Dependências Internas

- **erebus-engine** — consumido como Git submodule em `core/`; deve ser compilado antes de `npm start`
- **erebus-app** — cliente principal da API; consome todos os endpoints e o SSE stream

### Dependências Externas

- **Express.js** v5 — HTTP framework
- **Drizzle ORM** — acesso type-safe ao banco
- **better-sqlite3** / **@libsql/client** — drivers SQLite/LibSQL
- **Inversify** v8 — IoC container (pure ESM)
- **Zod** v4 — validação de schemas em runtime
- **swagger-jsdoc** + **swagger-ui-express** — documentação automática
- **Morgan** — logging de requisições HTTP
- **Jest** + **ts-jest** + **Supertest** — testes

### Integrações Pós-MVP

- Redis para cache de respostas
- PostgreSQL em produção (Drizzle suporta ambos via troca de driver)
- WebAssembly build do erebus-engine (elimina subprocess)

---

## 11. Glossário

| Termo | Definição |
|-------|-----------|
| **Sistema Daemon** | RPG brasileiro criado por Marcelo Del Debio, com mecânicas de atributos exponenciais |
| **Core / erebus-engine** | Biblioteca C++ que implementa as mecânicas do Sistema Daemon |
| **Core Adapter** | Ponte entre a API (Node.js) e o engine (C++) via subprocess ou FFI |
| **EventBus** | Sistema interno do engine para pub/sub de eventos estruturados |
| **SSE** | Server-Sent Events — conexão HTTP unidirecional para streaming de eventos |
| **Perícia** | Habilidade treinável do personagem (ex: Espada, Magia Arcana) |
| **Atributo** | Característica primária (FOR, AGI, CON, INT, PRE, VON, PHI, ELE) |
| **Modo Aventura** | Criação de personagem com 111 pontos de atributo |
| **Modo Realista** | Criação de personagem com 101 pontos de atributo |
| **DoD** | Definition of Done — critérios que todo código deve atender antes de ser aceito |

---

## 12. Métricas de Sucesso

| Métrica | Meta MVP | Meta Longo Prazo |
|---------|----------|------------------|
| **Cobertura de Testes** | > 80% | > 90% |
| **Latência p95** | < 200ms | < 100ms |
| **Uptime** | N/A (dev local) | > 99.5% |
| **Endpoints documentados** | 100% | 100% |
| **Erros de TypeScript** | 0 | 0 |

---

## 13. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Incompatibilidade ESM + Inversify v8 | Baixa (já resolvida) | Alto | `"type": "module"` + `module: "Node16"` no tsconfig + `node --experimental-vm-modules` para Jest |
| erebus-engine não compilado ao iniciar API | Alta (env de dev) | Médio | Documentar pré-requisito no README; script de setup |
| Drift entre schema Drizzle e dados do engine | Média | Médio | Migrations versionadas + testes de integração |
| Subprocess lento para o engine | Média | Médio | Benchmark antes de pós-MVP; migrar para WASM se necessário |

---

## 14. Revisões e Aprovações

| Papel | Nome | Assinatura | Data |
|------|------|-----------|------|
| **Product Owner** | [Nome] | ________________ | __/__/____ |
| **Tech Lead** | [Nome] | ________________ | __/__/____ |

---

**Próximo Review:** 21/04/2026
**Última Atualização:** 16/03/2026
