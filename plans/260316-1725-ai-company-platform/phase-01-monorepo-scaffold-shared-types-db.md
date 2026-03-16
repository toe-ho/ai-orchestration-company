# Phase 1: Monorepo Scaffold + Shared Types + DB Schema

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: None (first phase)
- Docs: [14-monorepo-setup-guide](../../docs/blueprint/03-architecture/14-monorepo-setup-guide.md), [15-database-design](../../docs/blueprint/04-data-and-api/15-database-design.md), [12-api-architecture](../../docs/blueprint/03-architecture/12-api-architecture-nestjs.md), [23-config-and-environment](../../docs/blueprint/06-infrastructure/23-config-and-environment.md)

## Overview
- **Date:** 2026-03-16
- **Priority:** P1 — blocks all subsequent phases
- **Status:** complete
- **Review:** approved
- **Description:** Initialize pnpm + Turborepo monorepo, create all 3 apps + 3 packages, define shared types/enums/schemas, set up TypeORM with 10 core entity models + 2 auth models, create initial migration, configure env parsing.

## Key Insights
- Turborepo 2+ uses `pipeline` key in turbo.json; `^build` prefix ensures upstream packages build first
- TypeORM 0.3+ DataSource config replaces `ormconfig.json`; use `data-source.ts` for CLI and `database.module.ts` for NestJS
- pnpm workspace links via `workspace:*` — no version resolution needed
- Tailwind v4 uses CSS-first config (`@theme` directive), not `tailwind.config.js`
- Each app manages own `.env` — packages/shared reads NO env vars
<!-- Updated: Validation Session 1 - Vitest replaces Jest -->
- Vitest for all tests (backend + frontend). Faster, native ESM, consistent across monorepo. Add vitest.config.ts per app.
- Incremental DB models: Phase 1 = 10 core models. Remaining added per-phase with new migrations.

## Requirements

### Functional
- pnpm workspace with `apps/*` and `packages/*`
- `@aicompany/backend` — NestJS 10 skeleton with ConfigModule
- `@aicompany/web` — Vite + React 19 skeleton with Tailwind 4 + shadcn/ui init
- `@aicompany/executor` — minimal Node.js HTTP server skeleton (port 3200)
- `@aicompany/shared` — all entity interfaces, enums, Zod schemas, API path constants
- `@aicompany/adapters` — adapter interface definition (implementation in Phase 5)
- `@aicompany/adapter-utils` — session codec interface, shared utilities
- TypeORM entities for all 35+ tables per doc 15
- Initial migration covering full schema
- `.env.example` for backend and web

### Non-Functional
- All TypeScript, strict mode
- Build order: shared > adapter-utils > adapters > apps
- No runtime deps in packages/shared (pure TS types + Zod)

## Architecture

```
@aicompany/root (pnpm workspace)
├── apps/backend     → NestJS 10, TypeORM, ConfigModule, CqrsModule
├── apps/web         → Vite 5+, React 19, Tailwind 4, shadcn/ui
├── apps/executor    → Fastify HTTP server (stub)
├── packages/shared  → interfaces, enums, Zod schemas
├── packages/adapters → IAdapter interface
└── packages/adapter-utils → session codec, helpers
```

Build graph enforced by Turborepo:
```
shared → adapter-utils → adapters → executor
shared → backend
shared → web
```

## Related Code Files

### Root
- `package.json` — root workspace config, turbo scripts
- `pnpm-workspace.yaml` — workspace definition
- `turbo.json` — pipeline config
- `tsconfig.base.json` — shared TS config
- `.gitignore`
- `.nvmrc` — pin Node 20

### packages/shared/
- `package.json`
- `tsconfig.json`
- `src/index.ts` — barrel export
- `src/entities/` — 24 entity interfaces (Company, Agent, Issue, HeartbeatRun, HeartbeatRunEvent, Goal, Project, ProjectWorkspace, Approval, CostEvent, ActivityEntry, CompanyApiKey, CompanyVm, AgentApiKey, AgentRuntimeState, AgentTaskSession, AgentWakeupRequest, AgentConfigRevision, IssueComment, IssueAttachment, Label, ApprovalComment, CompanyTemplate, Asset, UserCompany, BillingAccount)
- `src/enums/` — AgentStatus, IssueStatus, IssuePriority, RunStatus, ApprovalStatus, ActorType, WakeupSource, AdapterType, AgentRole, GoalLevel, VmStatus
- `src/interfaces/` — IActor, IExecutionRequest, IExecutionResult, IExecutionEvent, ISessionCodec
- `src/schemas/` — Zod schemas for DTOs (create-company, update-company, create-agent, update-agent, create-issue, update-issue, checkout-issue, etc.)
- `src/constants/` — API path constants, default config values

### packages/adapter-utils/
- `package.json`
- `tsconfig.json`
- `src/index.ts`
- `src/session-codec.ts` — ISessionCodec base implementation
- `src/env-cleaner.ts` — sanitize env vars before injection
- `src/process-helpers.ts` — child process spawn utilities

### packages/adapters/
- `package.json`
- `tsconfig.json`
- `src/index.ts`
- `src/adapter-interface.ts` — IAdapter { execute, cancel, health }
- `src/adapter-registry.ts` — adapter type → class mapping

### apps/backend/
- `package.json`
- `tsconfig.json`
- `nest-cli.json`
- `.env.example`
- `src/main.ts` — bootstrap, disable body parser for Better Auth
- `src/app.module.ts` — root module imports
- `src/config/app-config.ts` — env parsing with validation
- `src/config/database-config.ts` — TypeORM DataSource options
- `src/config/redis-config.ts`
- `src/config/flyio-config.ts`
- `src/config/auth-config.ts`
- `src/infrastructure/persistence/data-source.ts` — CLI-compatible DataSource
- `src/infrastructure/persistence/database-module.ts`
<!-- Updated: Validation Session 1 - Reduced to 10 core models (incremental approach) -->
- `src/infrastructure/persistence/models/base-model.ts` — id, companyId, createdAt, updatedAt
- `src/infrastructure/persistence/models/company-model.ts`
- `src/infrastructure/persistence/models/agent-model.ts`
- `src/infrastructure/persistence/models/issue-model.ts`
- `src/infrastructure/persistence/models/heartbeat-run-model.ts`
- `src/infrastructure/persistence/models/goal-model.ts`
- `src/infrastructure/persistence/models/project-model.ts`
- `src/infrastructure/persistence/models/company-api-key-model.ts`
- `src/infrastructure/persistence/models/company-vm-model.ts`
- `src/infrastructure/persistence/models/user-company-model.ts`
- `src/infrastructure/persistence/models/company-template-model.ts`
- `src/infrastructure/persistence/models/user-model.ts` — Better Auth managed
- `src/infrastructure/persistence/models/session-model.ts` — Better Auth managed
- **Deferred to Phase 3:** HeartbeatRunEvent, Approval, ActivityEntry, IssueComment, IssueAttachment, Label, ApprovalComment, Asset, ProjectWorkspace
- **Deferred to Phase 4:** AgentRuntimeState, AgentTaskSession, AgentWakeupRequest
- **Deferred to Phase 8:** CostEvent, AgentApiKey, AgentConfigRevision, BillingAccount
- `src/infrastructure/persistence/migrations/` — initial migration

### apps/web/
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `index.html`
- `.env.example` — VITE_API_BASE_URL
- `src/main.tsx` — React 19 entry
- `src/app.tsx` — router + query provider shell
- `src/globals.css` — Tailwind 4 @theme config
- `components.json` — shadcn/ui config

### apps/executor/
- `package.json`
- `tsconfig.json`
- `src/main.ts` — Fastify server, port 3200
- `src/routes/health-route.ts` — GET /health stub
- `Dockerfile` — Fly.io VM image

### config/
- `config/skills/` — empty dir with .gitkeep
- `config/templates/` — empty dir with .gitkeep

## Implementation Steps

1. **Init root workspace**
   - Create `package.json` with `"private": true`, scripts (dev, build, test, typecheck, lint, db:migrate)
   - Create `pnpm-workspace.yaml` listing `apps/*` and `packages/*`
   - Create `turbo.json` with pipeline: build (^build, outputs dist/**), dev (cache false, persistent), typecheck, test, lint, db:migrate
   - Create `tsconfig.base.json` with strict, ES2022, module NodeNext
   - Create `.gitignore` (node_modules, dist, .env, .turbo, coverage)
   - Create `.nvmrc` with `20`

2. **Create packages/shared**
   - `package.json`: name `@aicompany/shared`, exports `./src/index.ts`
   - Create all entity interfaces matching doc 15 columns exactly
   - Create all enums matching doc 12 enums
   - Create interfaces: IActor, IExecutionRequest, IExecutionResult, IExecutionEvent, ISessionCodec
   - Create Zod schemas for all DTOs (reuse in backend validation)
   - Create API path constants (`/api/companies`, etc.)
   - Barrel export everything from `src/index.ts`

3. **Create packages/adapter-utils**
   - Depend on `@aicompany/shared: workspace:*`
   - Implement ISessionCodec base (serialize/deserialize context file path)
   - Implement env-cleaner (strip dangerous vars before passing to child process)
   - Implement process-helpers (spawn with timeout, kill tree)

4. **Create packages/adapters**
   - Depend on shared + adapter-utils
   - Define `IAdapter` interface: `execute(req): AsyncIterable<IExecutionEvent>`, `cancel(runId): Promise<void>`, `health(): Promise<boolean>`
   - Create adapter-registry stub (map AdapterType → IAdapter constructor)

5. **Create apps/backend**
   - `pnpm create nest` or manual setup with NestJS 10
   - Add deps: @nestjs/core, @nestjs/cqrs, @nestjs/schedule, @nestjs/typeorm, typeorm, pg, @nestjs/config, zod
   - Add `@aicompany/shared: workspace:*`
   - Create ConfigModule setup: app-config.ts validates all env vars from doc 23
   - Create database-config.ts reading DATABASE_URL
   - Create data-source.ts for TypeORM CLI migrations
   - Create database-module.ts importing TypeOrmModule.forRootAsync
   - Create BaseModel with `@PrimaryGeneratedColumn('uuid') id`, `@Column('uuid') companyId`, `@CreateDateColumn() createdAt`, `@UpdateDateColumn() updatedAt`
   - Create ALL 28 TypeORM entity models per doc 12/15, each < 200 lines
   - Ensure indexes: `(company_id, status)` on agents/issues, `(company_id, agent_id, started_at)` on runs, UNIQUE on issue.identifier, UNIQUE on company_vm.company_id
   - Create main.ts — disable body parser (for Better Auth raw handling), set global prefix `/api`
   - Create app.module.ts importing ConfigModule, DatabaseModule
   - Create `.env.example` with all vars from doc 23

6. **Create initial migration**
   - Run `typeorm migration:generate` against local PG or write manually
   <!-- Updated: Validation Session 1 - Incremental models -->
   - Covers 10 core tables + user/session tables, indexes, foreign keys
   - Remaining tables added in Phase 3, 4, 8 migrations

7. **Create apps/web**
   - `pnpm create vite` with React + TypeScript template
   - Add Tailwind 4: `@tailwindcss/vite` plugin in vite.config.ts
   - Init shadcn/ui: `npx shadcn-ui init` with Tailwind v4 preset
   - Create globals.css with `@import "tailwindcss"` and `@theme` block
   - Add `@aicompany/shared: workspace:*`
   - Create minimal app.tsx shell (React Router + QueryClientProvider)
   - Create `.env.example` with VITE_API_BASE_URL

8. **Create apps/executor**
   - Fastify HTTP server on port 3200
   - GET /health returns `{ status: "ok" }`
   - POST /execute — stub returning 501
   - POST /cancel — stub returning 501
   - Create Dockerfile per doc 14 (multi-stage, installs claude CLI)

9. **Create config directories**
   - `config/skills/.gitkeep`
   - `config/templates/.gitkeep`

10. **Verify**
    - `pnpm install` succeeds
    - `turbo build` compiles all packages in correct order
    - `turbo typecheck` passes
    - Backend starts and connects to DB (with valid DATABASE_URL)

## Todo List
- [x] Root workspace files (package.json, pnpm-workspace.yaml, turbo.json, tsconfig.base.json)
- [x] packages/shared — entity interfaces (24 files)
- [x] packages/shared — enums (11 files)
- [x] packages/shared — interfaces (5 files)
- [x] packages/shared — Zod schemas
- [x] packages/shared — API path constants
- [x] packages/adapter-utils — session codec, env cleaner, process helpers
- [x] packages/adapters — IAdapter interface + registry
- [x] apps/backend — NestJS skeleton + ConfigModule
- [x] apps/backend — 10 core TypeORM entity models (remaining deferred to Phase 3/4/8)
- [x] apps/backend — data-source.ts + database module
- [x] apps/backend — initial migration
- [x] apps/backend — .env.example
- [x] apps/web — Vite + React 19 + Tailwind 4 + shadcn/ui skeleton
- [x] apps/executor — Fastify stub + Dockerfile
- [x] config/ directories
- [x] Verify: pnpm install + turbo build + turbo typecheck

## Success Criteria
- `pnpm install` resolves all workspace links
- `turbo build` succeeds for all 6 packages
- `turbo typecheck` passes with zero errors
- Backend boots and TypeORM connects to PostgreSQL
- Migration runs successfully creating all tables
- Web dev server starts on port 5173
- Executor dev server starts on port 3200

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| TypeORM model mismatch with doc 15 | Medium | High | Cross-reference every column during code review |
| Turborepo cache issues on first build | Low | Low | Clear .turbo cache, rebuild |
| Tailwind v4 breaking changes | Low | Medium | Pin exact version, test dark mode early |
<!-- Updated: Validation Session 1 - Reduced model count -->
| 10 core model files | Medium | Medium | Cross-reference doc 15 columns. Remaining models deferred. |

## Security Considerations
- `.env` files in `.gitignore` — never committed
- `.env.example` has placeholder values only
- No secrets in packages/shared
- DATABASE_URL validated at boot (fail fast)

## Next Steps
- Phase 2: Better Auth integration (depends on users/sessions tables from this phase)
- Phase 3: CRUD controllers (depends on entity models from this phase)
