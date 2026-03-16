# Brainstorm: Blueprint Readiness Assessment

## Problem Statement
Evaluate whether the 25-doc blueprint is sufficient to begin implementation planning for the AI Company Platform (`@aicompany/*`).

## Verdict: Ready to Plan

Blueprint covers all critical layers with implementation-level detail. No blockers.

## Evaluated Areas

| Area | Coverage | Verdict |
|------|----------|---------|
| Product/Vision (docs 00-01) | Complete | User journeys, domain concepts, business model |
| AI System (docs 02-08) | Complete | Execution Engine, Adapters, heartbeats, session codec |
| Backend Architecture (doc 12) | Complete | Full CQRS structure, ~256 files mapped, TypeORM models |
| Database (doc 15-16) | Complete | 35+ tables, indexes, multi-tenant patterns |
| Frontend (doc 13) | Complete | Pages, components, API client layer |
| Monorepo (doc 14) | Complete | Turborepo + pnpm, Dockerfile, CI/CD |
| Auth/Security (doc 19) | Complete | Better Auth, JWT, API key vault, encryption |
| Deployment (doc 24) | Complete | Fly.io VMs, provisioner, idle hibernation |

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Package name | `@aicompany/*` | User selected |
| First adapter | `claude` | CLI-based, simplest pattern, generalizes to 6/9 adapters |
| Backend deploy | Fly.io | Aligns with execution plane (single cloud provider) |
| Scheduler | `@nestjs/schedule` | Simpler, blueprint already specifies it |
| Adapter rollout | claude → codex/gemini → openclaw → rest | CLI pattern first, WebSocket later |

## Adapter Rollout Strategy

- **Phase 1:** `claude` — establishes CLI spawn pattern
- **Phase 2:** `codex`, `gemini` — same CLI pattern, different binary
- **Phase 3:** `openclaw_gateway` — WebSocket pattern (different architecture)
- **Phase 4:** `cursor`, `opencode`, `pi`, `process`, `http`

## Recommended Implementation Phasing

1. **Monorepo scaffold** + shared types + DB schema + migrations
2. **Auth** — Better Auth, user sessions, company access
3. **Core CRUD** — companies, agents, issues (board endpoints)
4. **Heartbeat engine** + execution engine + Fly.io provisioner
5. **Claude adapter** + executor app
6. **Frontend** — dashboard, agents, issues pages
7. **Real-time** — WebSocket, Redis pub/sub, live events
8. **Cost tracking** + approvals + governance
9. **Templates** + onboarding flow

## Strengths of Blueprint

- Two-layer abstraction (Execution Engine + Adapter) is clean
- Atomic task checkout prevents double-work
- CQRS with NestJS appropriate for complexity
- Multi-tenant isolation with `companyId` everywhere
- API key security (AES-256, never on disk, never logged)
- Full TypeORM model definitions with columns and indexes

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| 256 files is large scope | Aggressive phasing, build vertical slices |
| Fly.io provisioner complexity | Stub with local execution first, add Fly.io later |
| SSE streaming from VM to control plane | Test early, this is the critical path |
| Multi-tenant data leaks | companyId scope interceptor + integration tests |

## Pre-Implementation Actions

1. Create `README.md` at project root
2. Decide actual product name for branding (distinct from package name)
3. Set up Fly.io account + API token
4. Set up Neon/Supabase PostgreSQL instance
5. Set up Upstash Redis instance
