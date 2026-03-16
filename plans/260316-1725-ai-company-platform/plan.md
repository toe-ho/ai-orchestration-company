---
title: "AI Company Platform Implementation"
description: "Full-stack platform for autonomous AI-powered companies"
status: in_progress (Phase 4 in progress)
priority: P1
effort: "~130h"
branch: main
tags: [nestjs, react, flyio, ai-agents, cqrs, typeorm]
created: 2026-03-16
---

# AI Company Platform — Implementation Plan

## Architecture Summary

Monorepo (`@aicompany/*`) with 3 apps + 3 packages. NestJS backend (CQRS + TypeORM), React 19 frontend (Vite + Tailwind 4 + shadcn/ui), Node executor (Fly.io VMs). ~256 backend files, 35+ DB tables, 50+ API endpoints.

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Monorepo Scaffold + Shared Types + DB | ~20h | complete | [phase-01](./phase-01-monorepo-scaffold-shared-types-db.md) |
| 2 | Auth — Better Auth Integration | ~12h | complete | [phase-02](./phase-02-auth-better-auth.md) |
| 3 | Core CRUD — Companies, Agents, Issues | ~20h | complete | [phase-03](./phase-03-core-crud-companies-agents-issues.md) |
| 4 | Heartbeat + Execution Engine + Provisioner | ~20h | pending | [phase-04](./phase-04-heartbeat-execution-engine-provisioner.md) |
| 5 | Claude Adapter + Executor App | ~15h | pending | [phase-05](./phase-05-claude-adapter-executor.md) |
| 6 | Frontend Pages | ~15h | pending | [phase-06](./phase-06-frontend-pages.md) |
| 7 | Real-time Events | ~8h | pending | [phase-07](./phase-07-realtime-events.md) |
| 8 | Cost Tracking + Approvals + Governance | ~12h | pending | [phase-08](./phase-08-cost-tracking-approvals-governance.md) |
| 9 | Templates + Onboarding | ~8h | pending | [phase-09](./phase-09-templates-onboarding.md) |

## Key Dependencies

- Phase 1 blocks all others (DB + shared types)
- Phase 2 blocks 3-9 (auth guards)
- Phase 3 blocks 4, 5 (agents/issues needed for heartbeat)
- Phase 4 blocks 5 (execution engine needed for adapter)
- Phase 6 can start after 3 (CRUD endpoints exist)
- Phase 7 can start after 4 (events to stream)
- Phase 8 can start after 4 (cost events from runs)
- Phase 9 can start after 6 (UI for wizard)

## Locked Decisions

Backend: NestJS + TypeORM + CQRS | Frontend: React 19 + Vite + Tailwind 4 + shadcn/ui | DB: PostgreSQL (Neon/Supabase) | Auth: Better Auth | Real-time: Redis pub/sub (Upstash) + WebSocket | Deploy: Fly.io | Scheduler: @nestjs/schedule | Testing: Vitest + Playwright | Package: @aicompany/* | First adapter: claude (CLI) | Executor: Fastify | Dev mode: LocalRunner (HTTP to local executor)

## Constraints

- Files under 200 lines (modularize aggressively)
- Clean Architecture: Domain > Application > Infrastructure > Presentation
- ALL queries scoped by companyId (multi-tenant)
- YAGNI/KISS/DRY

## Validation Log

### Session 1 — 2026-03-16
**Trigger:** Initial plan creation validation
**Questions asked:** 7

#### Questions & Answers

1. **[Scope]** Phase 1 creates 35+ TypeORM entity models upfront. Should we create ALL models in Phase 1, or only models needed for immediate phases and add others incrementally?
   - Options: All models upfront | Incremental per phase | Core models + stubs
   - **Answer:** Incremental per phase
   - **Rationale:** Smaller Phase 1, avoids wasted work if schema evolves. Each phase adds its own models + migration.

2. **[Architecture]** The executor app uses Fastify. Should this be Fastify, Express, or raw Node.js HTTP?
   - Options: Fastify | Raw Node.js HTTP | Express
   - **Answer:** Fastify
   - **Rationale:** Good SSE streaming support, schema validation, plugin ecosystem. Worth the small dependency.

3. **[Architecture]** For local development before Fly.io is set up, how should the executor run?
   - Options: Local process mode (HTTP to localhost:3200) | Docker Compose | Fly.io from day 1
   - **Answer:** Local process mode — HTTP to local executor
   - **Rationale:** Same HTTP interface as production. Backend POSTs to localhost:3200. Executor runs via `turbo dev`. Clean separation.

4. **[Scope]** The plan has no API rate limiting. Should we add basic rate limiting for the MVP?
   - Options: Skip for MVP | Basic throttle now
   - **Answer:** Skip for MVP
   - **Rationale:** Focus on core features. Add when needed.

5. **[Architecture]** Phase 4 LocalRunner: spawn executor in-process or communicate via HTTP?
   - Options: HTTP to local executor | Child process spawn
   - **Answer:** HTTP to local executor
   - **Rationale:** Same interface as Fly.io CloudRunner. Clean separation. Executor runs as separate `turbo dev` process.

6. **[Scope]** Phase 1 goes incremental — which TypeORM models should Phase 1 include?
   - Options: Core 10 models | Minimal 5 models | Full auth + core 15
   - **Answer:** Core 10 models (Company, Agent, Issue, HeartbeatRun, Goal, Project, CompanyApiKey, CompanyVm, UserCompany, CompanyTemplate)
   - **Rationale:** Enough for Phase 2-3 without over-committing. Remaining models added as phases need them.

7. **[Architecture]** Testing strategy: Jest vs Vitest for backend unit/integration tests?
   - Options: Vitest for all | Jest for backend, Vitest for frontend | Jest for all
   - **Answer:** Vitest for all
   - **Rationale:** Consistent across frontend + backend. Faster, native ESM. Compatible with NestJS testing module.

#### Confirmed Decisions
- DB models: incremental, Phase 1 = 10 core models
- Executor: Fastify HTTP server
- Dev mode: LocalRunner (HTTP to localhost:3200 executor)
- Rate limiting: skip for MVP
- Test runner: Vitest for all (replaces Jest)
- LocalRunner: same HTTP interface as CloudRunner

#### Action Items
- [ ] Update Phase 1: reduce to 10 core models, note remaining models deferred
- [ ] Update Phase 1: change Jest → Vitest in testing setup
- [ ] Update Phase 4: add LocalRunner execution engine alongside CloudRunner
- [ ] Update Phase 5: confirm Fastify for executor
- [ ] Update locked decisions: Jest → Vitest

#### Impact on Phases
- Phase 1: Reduce from 28 to 10 TypeORM models. Change test runner from Jest to Vitest. Add vitest.config.ts.
- Phase 3: Add remaining CRUD-related models (Approval, ActivityEntry, Label, IssueComment, etc.) as new migration.
- Phase 4: Add LocalRunner execution engine. ExecutionEngineService gets a strategy: LocalRunner (dev) vs CloudRunner (prod). Add IExecutionRunner interface.
- Phase 8: Add remaining models (CostEvent, AgentApiKey, AgentConfigRevision, etc.) as new migration.
