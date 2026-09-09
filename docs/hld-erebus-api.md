### HLD: erebus-api

Version: 1.0
Date: 2026-09-09
Owner: rattopedro@gmail.com

---

### Technical Objective
Build a read-only service that queries an SQLite database (populated from versioned Daemon System data) and exposes melee weapons, firearms, protections, skills, and enhancements entities via REST API, following Clean Architecture (Controller, Service, Repository). The technical objective is to move from an Express scaffold without domain logic, without database, and without defined layers, to a functional, testable, and consumable data service by multiple clients (app and, in the future, C++ engine), without duplicating the data source between them.

Dependencies with other Systems
- erebus-app (current REST/JSON consumer, displays listing, search, and detail of entities)
- erebus-engine (Phase 2, future consumer of same REST contracts, out of scope in this phase)

---

### General Architecture
Serverless service hosted on Netlify Functions. The Express application is packaged through a serverless adapter (e.g., serverless-http) and maintains internally the Clean Architecture layers (Controller, Service, Repository), accessed by interface and resolved via dependency injection (Inversify). The SQLite database is generated at build time by a seed script and embedded as a read-only asset with the function package, since there is no runtime write in this phase.

Deployment Environment
- Cloud (Netlify Functions, serverless)
- Each HTTP request invokes the function, which wraps the Express app; no long-running server

Main Technologies
- Node.js + TypeScript + Express
- Knex (query builder in Repository layer) over better-sqlite3
- Inversify (dependency injection between layers via interface)
- swagger-jsdoc + swagger-ui-express (OpenAPI documentation)
- Vitest (unit and integration tests)

Adopted Patterns
- Clean Architecture (Controller → Service → Repository, isolation by interface)
- Conventional REST, read-only (GET)
- Dependency Inversion via dependency injection (Inversify)

---

### Components and Responsibilities
| Component | Responsibilities | Dependencies |
| ----------- | ----------------- | ------------ |
| Controllers | Receive HTTP request, validate input parameters, call Service, format response/error | Service (via interface), Model |
| Services | Apply application rules (filter normalization, validations), orchestrate Repository, do not know Express | Repository (via interface), Model |
| Repositories | Sole access point to SQLite via Knex, build queries, map rows to entities | Knex, better-sqlite3, Model |
| Model | Classes, DTOs, and enums representing domain entities and their transport formats | None (type layer, consumed by others) |
| Seed/Migration module | Offline script that reads source JSONs and curation file, populating SQLite at build time (idempotent) | Source JSONs, better-sqlite3 |
| Swagger module | Generates OpenAPI spec via swagger-jsdoc from route annotations and serves UI via swagger-ui-express | Controllers (annotations) |
| Error handling middleware | Standardizes error responses (400/404) across API | Express |
| Netlify Function adapter | Serverless entrypoint wrapping Express app | Express, serverless-http |

---

### Request and Data Flow
**Request Flow**
- Netlify receives HTTP request and invokes Function
- Serverless adapter forwards request to Express app
- Error/validation middleware intercepts route
- Controller validates query params and mounts filter DTO (Model)
- Controller calls corresponding Service (resolved by interface via Inversify)
- Service applies business rules and calls Repository (via interface)
- Repository builds query via Knex and executes against embedded SQLite
- Repository maps returned rows to Model entities/DTOs
- Service returns entities to Controller
- Controller serializes response to JSON (200) or triggers error middleware (400/404)

**Data Flow**
- Versioned JSONs in docs/daemon system/data/ (Level 1) and structured curation file (Level 2/3) → Seed/Migration module → populates SQLite at build time → .sqlite file packaged as read-only asset of Netlify Function on deploy

---

### Data Model (High Level)
Main Entities
- MeleeWeapon (provenance: sourceLevel, source, editionOrVersion)
- Firearm (own provenance)
- Protection (own provenance)
- Skill (group/subgroup self-relation, own provenance)
- Enhancement (own provenance)
- EnhancementLevel (cost and effect per level)

Relations
- Skill 1:N Skill (self-relation: group → subgroups, via parentSkillId nullable; group is not purchasable in isolation, only the leaf; unique constraint on parentSkillId + name)
- Enhancement 1:N EnhancementLevel

Source of Truth
- Versioned JSONs in git (canonical Level 1) plus structured curation file (Level 2/3); SQLite is a derived artifact, recreatable via seed anytime

---

### Public Interfaces
| Name | Type | Protocol | Exposure | SLAs/Limits |
| ---- | ---- | ---------- | --------- | ------------- |
| GET /weapons, /weapons/:id | API | REST/JSON | External | p95 < 200ms (except cold start) |
| GET /firearms, /firearms/:id | API | REST/JSON | External | p95 < 200ms (except cold start) |
| GET /protections, /protections/:id | API | REST/JSON | External | p95 < 200ms (except cold start) |
| GET /skills, /skills/:id | API | REST/JSON | External | p95 < 200ms (except cold start) |
| GET /enhancements, /enhancements/:id | API | REST/JSON | External | p95 < 200ms (except cold start) |
| GET /docs (Swagger UI) | API | HTTP/HTML | External | No formal SLA |

---

### Scalability and Availability Considerations
General Approach
- Automatic horizontal scaling managed by Netlify platform, no manual instance configuration; small dataset eliminates need for partitioning or sharding

Applied Techniques
- HTTP cache at CDN/edge level for GET responses (data stable between deploys)
- No in-memory cache in application in this phase
- No dedicated rate limiting in this phase (low expected volume)

Availability Target
- 99.9% for external endpoints, dependent on Netlify platform's own SLA (hypothesis, no multi-provider redundancy in this phase)

---

### Security
Authentication
- None in this phase; public read-only data API, without end-user login

Authorization
- Not applicable in this phase (no user roles, no private data)

Data Protection
- HTTPS mandatory (Netlify platform standard, in transit); no sensitive data at rest; content is public game rule, no PII to protect or anonymize

Secrets Management
- Environment variables managed by Netlify (site env vars); no database credentials (SQLite is embedded local file)

---

### Observability
Logs
- Structured logs (JSON) emitted by application via logger (e.g., pino), collected by Netlify's native function logs

Metrics
- Error rate (4xx/5xx) and latency per endpoint, captured via structured logs

Tracing
- Out of scope in this phase; no multiple internal services to trace (internal flow is synchronous within same process)

Dashboards and Alerts
- Native Netlify panel (invocations, errors, function duration); no dedicated automated alert in this phase

---

### Architectural Risks and Mitigation
#### Native Module (better-sqlite3) Incompatible with Netlify Functions Runtime
- **Probability:** medium
- **Impact:** build fails or function breaks at runtime due to native binary compiled for wrong architecture
- **Mitigation:**
  - Ensure rebuild of native module in Netlify build environment
  - Test deploy early in schedule, not just in scheduled deploy week
- **Contingency Plan:** switch to pure-JS SQLite driver (e.g., sql.js) or migrate to serverless-compatible managed database (e.g., Turso/libSQL)

#### Netlify Function Cold Start Impacts Latency Target (p95 < 200ms)
- **Probability:** medium
- **Impact:** first request after idle period may violate latency target
- **Mitigation:**
  - Keep .sqlite file small (lean dataset by design)
  - Evaluate periodic warmup ping if necessary
- **Contingency Plan:** accept latency SLA only for "warm" requests, documenting cold start exception

#### REST Contracts Defined in This Phase Don't Serve Erebus Engine (C++) Well in Phase 2
- **Probability:** low
- **Impact:** rework in endpoints when starting Phase 2
- **Mitigation:**
  - Keep conventional REST endpoints per entity, avoiding coupling to implementation details
- **Contingency Plan:** version API (/v1) from the start to allow evolution without breaking existing consumers

#### Level 2/3 Data Confused with Canonical Rule (Level 1)
- **Probability:** medium
- **Impact:** game rule error at table, loss of database trust
- **Mitigation:**
  - Mandatory sourceLevel/source field in schema and DTO, validated in Service
  - Exposed in every detail endpoint
- **Contingency Plan:** dedicated endpoint/filter to query only Level 1, should confusion persist in UI

---

### ADRs and Next Steps
Associated ADRs
- No formal ADR registered yet; decisions from this phase (Knex, Inversify, Netlify, better-sqlite3, Swagger, Vitest) emerged from this interview and still need formalization

Pending Decisions
- Real viability of better-sqlite3 in Netlify Functions, to be validated by technical spike before committing to data architecture

Next Steps
- Technical feasibility spike of better-sqlite3 (or alternative driver) in Netlify Functions environment
- Knex schema modeling/migrations conducted together with implementation, as part of same feature (not separate stage)
- FDD/LLD detailing contracts for each endpoint, DTOs, and validation rules per Service
