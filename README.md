# ⚗️ Erebus API

> _"O sábio alquimista ergue-se ao amanhecer, acende a fogueira sob seu alambique de Node.js e susurra os encantamentos do TypeScript — pois sem a API, o frontend é apenas um pergaminho em branco, e sem café, o alquimista é apenas um humano comum."_

**Erebus API** é o servidor REST do projeto **Erebus** — uma plataforma de mecânicas de jogo que implementa o **Sistema Daemon**, o RPG de mesa brasileiro criado por Marcelo Del Debio. Esta API expõe os feitiços do `erebus-engine` (núcleo C++) para o mundo externo, transformando chamadas HTTP em rolagens de dados, combates épicos e geração de personagens dignos de bardos.

Este repositório é **um dos três pilares do ecossistema Erebus**:

| Repositório     | Stack                    | Responsabilidade                         |
| --------------- | ------------------------ | ---------------------------------------- |
| `erebus-engine` | C++17                    | Núcleo de mecânicas de jogo              |
| `erebus-api`    | Node.js + TypeScript     | **Este repositório** — API REST          |
| `erebus-app`    | Vue 3 + Quasar           | Interface web (SPA)                      |

---

# 🗺️ Arquitetura

O servidor segue o padrão **Clean Architecture** com fluxo unidirecional:

```
Requisição HTTP
      │
      ▼
  Controller       ← validação de entrada (Zod), sem lógica de negócio
      │
      ▼
   Service         ← orquestração de regras de negócio
      │
      ▼
Adapter / Repo     ← Core Adapter (subprocess erebus-engine) ou Drizzle ORM
```

### Estrutura de diretórios

```
core/                        # Git submodule → erebus-engine (binário C++)
src/
├── server.ts                # Express app factory + entry point (porta 3000)
├── adapters/                # Core Adapter — ponte subprocess/JSON para o engine
├── controllers/             # Camada HTTP — validação (Zod), delega para services
├── services/                # Lógica de negócio
├── repositories/            # Acesso a dados (Drizzle ORM)
├── model/
│   ├── entities/            # Tipos de domínio (Character, Dice, Combat, etc.)
│   ├── enums/               # Enums (DiceType, AttributeCode, etc.)
│   └── utils/               # Utilitários de domínio
└── infrastructure/
    ├── container/           # Inversify IoC (TYPES + bindings)
    ├── database/            # Drizzle config + schema + migrations
    └── swagger/             # swaggerOptions.ts (spec OpenAPI)
```

**Injeção de Dependência:** Inversify v8 com decorators (`@injectable`, `@inject`). Cada camada é desacoplada — trocar o banco de dados não quebra os services, e vice-versa.

---

# ⚗️ Stack & Dependências

| Categoria           | Tecnologia                  | Versão    |
| ------------------- | --------------------------- | --------- |
| Runtime             | Node.js                     | `^20`     |
| Linguagem           | TypeScript                  | `^5.9`    |
| Framework HTTP      | Express.js                  | `^5.2`    |
| Validação           | Zod                         | `^4.3`    |
| Injeção de dep.     | Inversify                   | `^8.1`    |
| ORM                 | Drizzle ORM                 | `^0.45`   |
| Banco de dados      | SQLite (dev) / LibSQL (prod)| `^12.8`   |
| Logging HTTP        | Morgan                      | `^1.10`   |
| Documentação API    | swagger-jsdoc + swagger-ui  | `^6.2`    |
| Testes              | Jest + ts-jest + Supertest  | `^29`     |
| Linting             | ESLint                      | `^10`     |
| Formatação          | Prettier                    | `^3.8`    |

---

# 🏰 Começando (Setup Local)

Antes de conjurar o servidor, certifique-se de ter os ingredientes da poção:

- **Node.js** `^20` ou superior
- **npm** `>= 6.13.4`
- **CMake** (para compilar o `erebus-engine`)
- O `erebus-app` rodando em `http://localhost:5173` é opcional para desenvolver a API isoladamente

### 1. Clone o repositório

```bash
git clone https://github.com/ratto/erebus-api.git
cd erebus-api
```

### 2. Inicialize o submódulo do engine

O `erebus-engine` (núcleo C++) é um submódulo Git. Sem ele, a API é como um feiticeiro sem grimório.

```bash
git submodule update --init --recursive
```

### 3. Compile o erebus-engine

```bash
cd core
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build
cd ..
```

### 4. Instale as dependências

```bash
npm install
```

### 5. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto (veja a seção abaixo para os valores).

### 6. Inicie o servidor

```bash
npm start
```

A API estará disponível em `http://localhost:3000`. A documentação interativa (Swagger UI) em `http://localhost:3000/api/v1/docs`.

---

# 🔮 Variáveis de Ambiente

| Variável       | Padrão                   | Descrição                                         |
| -------------- | ------------------------ | ------------------------------------------------- |
| `NODE_ENV`     | `development`            | Ambiente de execução                              |
| `PORT`         | `3000`                   | Porta do servidor Express                         |
| `DATABASE_URL` | `./data/erebus.db`       | SQLite (local) ou `postgresql://...` (produção)   |
| `CORS_ORIGIN`  | `http://localhost:5173`  | Origem permitida pelo CORS (erebus-app em dev)    |
| `CORE_PATH`    | `./core/erebus`          | Caminho para o binário compilado do erebus-engine |

---

# ⚔️ Endpoints

A documentação interativa completa está disponível em `/api/v1/docs` (Swagger UI).

### Implementados

| Método | Rota                  | Descrição                                         |
| ------ | --------------------- | ------------------------------------------------- |
| `POST` | `/api/v1/dice/roll`   | Rola dados via erebus-engine (d3, d4, d6... d100) |
| `GET`  | `/api/v1/docs`        | Swagger UI — documentação interativa da API       |

### Planejados (MVP)

| Método | Rota                        | Descrição                                          |
| ------ | --------------------------- | -------------------------------------------------- |
| `GET`  | `/api/v1/characters/create` | Gerar personagem aleatório (`?mode=adventure\|realistic`) |
| `GET`  | `/api/v1/attributes`        | Listar os 8 atributos do Sistema Daemon            |
| `GET`  | `/api/v1/skills`            | Listar perícias (paginado, filtrável)              |
| `POST` | `/api/v1/skills/test`       | Resolver teste de perícia para um personagem       |
| `POST` | `/api/v1/combat/resolve`    | Resolver um turno de combate entre dois personagens|
| `GET`  | `/api/v1/spells`            | Listar magias (paginado)                           |
| `POST` | `/api/v1/spells/cast`       | Conjurar uma magia                                 |
| `GET`  | `/api/v1/logs/stream`       | SSE stream de eventos do Core EventBus             |

---

# 🧪 Testes

O projeto usa **Jest** para testes unitários e de integração com **Supertest**. Nenhum mock de banco foi utilizado — aprendemos da pior forma que mocks mentem mais que bardos bêbados em taberna.

```bash
# Executar todos os testes
npm test
```

Os testes estão organizados em:

```
tests/
├── unit/          # Testes unitários de services e utilitários
└── integration/   # Testes de integração com Supertest (endpoints HTTP)
```

---

# 🔨 Comandos de Build

```bash
# Compilar TypeScript → dist/
npm run build

# Lint do código
npm run lint

# Lint com auto-correção
npm run lint:fix
```

---

# 🤝 Contribuindo

Este projeto está em desenvolvimento ativo. Contribuições são bem-vindas — especialmente as que chegam com testes e **sem `console.log` esquecido em produção** (o oráculo Morgan já cuida dos logs HTTP; não o ajude).

1. Fork o repositório
2. Crie sua branch: `git checkout -b feat/meu-encantamento`
3. Commit suas mudanças: `git commit -m 'feat: invocar feitiço de cache'`
4. Push para a branch: `git push origin feat/meu-encantamento`
5. Abra um Pull Request

---

# ☕ Apoie o Projeto

Se este projeto te ajudou a simular batalhas épicas, rolar dados às 2h da manhã ou simplesmente te fez sorrir enquanto depurava TypeScript com uma xícara de café na mão — considere apoiar o desenvolvimento.

Cada contribuição vai diretamente para o fundo de café da taverna (e talvez para um servidor menos assombrado por memory leaks).

[![Doe via PayPal](https://img.shields.io/badge/Doe-PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://www.paypal.com/donate/?hosted_button_id=8RE442ASFC2PS)

---

# 📄 Licença

Este projeto está sob a licença **GNU General Public License v2.0**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

_Feito com ⚗️, ☕ e uma quantidade irresponsável de TypeScript estritamente tipado._
