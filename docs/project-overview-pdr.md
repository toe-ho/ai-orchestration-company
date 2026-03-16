# Project Overview & Product Development Requirements

## Product Vision

**AI Company Platform** enables non-technical entrepreneurs to launch fully autonomous AI-powered companies at a fraction of traditional startup costs. Users define a business goal, the platform automatically assembles a team of AI agents, and those agents work 24/7 — writing code, designing UI, running marketing, managing operations.

**Core Value Proposition:** Launch a full AI company for $2K/month instead of $250K/month.

## Target User

- Non-technical entrepreneurs and business founders
- Startup operators seeking rapid time-to-market
- Small business owners wanting to scale operations with AI
- Users unfamiliar with programming or system administration

## Market Position

This platform democratizes AI-powered business automation by eliminating the need for:
- Expensive human employee hiring
- Complex technical infrastructure setup
- Manual task management and coordination
- Real-time monitoring of distributed teams

## Core Features (Implemented & Planned)

### Phase 1-3: Foundation (COMPLETE)
- User authentication via Better Auth (email/password, OAuth ready)
- Company creation and management (multi-tenant)
- Agent provisioning and orchestration (create, pause, resume, terminate)
- Issue/task management with checkout workflow (prevents agent conflicts)
- Goal definition and tracking
- Project organization
- Activity logging for auditing
- Dashboard with company summary metrics

### Phase 4-9: Execution & Advanced (PENDING)
- **Heartbeat & Execution Engine:** Real-time agent status monitoring, execution scheduling
- **Agent Provisioners:** Automatic VM provisioning on Fly.io per company
- **Claude Adapter:** Claude AI integration as primary agent model
- **Frontend Pages:** React UI for all above features
- **Real-time Events:** WebSocket integration for live updates
- **Cost Tracking & Approvals:** Budget management, approval workflows
- **Templates & Onboarding:** Pre-built company templates, guided setup

## Technical Architecture

| Component | Technology | Status |
|-----------|-----------|--------|
| Frontend | React 19, Vite, Tailwind CSS 4, shadcn/ui | In progress |
| Backend API | NestJS 10.3, TypeScript, CQRS, Clean Architecture | Complete |
| Database | PostgreSQL 16 (Neon/Supabase), TypeORM | Complete |
| Authentication | Better Auth 1.5.5 (sessions), Agent JWT | Complete |
| Real-time | Redis 7 pub/sub (Upstash), WebSocket | Pending |
| Execution | Fly.io Machines (per-company VMs), Fastify | Planned |
| Package Manager | pnpm 9 workspaces | Complete |
| Build System | Turborepo 2 | Complete |
| Testing | Vitest 1.4, Playwright | In progress |
| CI/CD | GitHub Actions | In progress |

## Monorepo Structure

```
apps/
├── backend/          # NestJS API + Scheduler (~120 files, ~3,969 LOC)
├── web/              # React frontend (Vite) (placeholder, ~150 LOC)
└── executor/         # Agent Executor (Fastify) (stub, ~120 LOC)

packages/
├── shared/           # Types, constants, validators (51 files, ~1,400 LOC)
├── adapters/         # Agent runtime integrations (3 files, ~100 LOC)
└── adapter-utils/    # Shared adapter utilities (4 files, ~200 LOC)

config/
├── skills/           # Agent instruction files (empty, waiting for templates)
└── templates/        # Company templates (empty, planned)

docs/
├── blueprint/        # 25+ detailed technical specifications
└── [operational docs this project]
```

## API Routes (Implemented)

| Route | Purpose | Status |
|-------|---------|--------|
| `POST /api/auth/*` | Better Auth proxy | Complete |
| `GET /api/health` | Health check | Complete |
| `CRUD /api/companies` | Company lifecycle | Complete |
| `CRUD /api/companies/:cid/agents` | Agent management | Complete |
| `CRUD /api/companies/:cid/issues` | Issue/task management | Complete |
| `CRUD /api/companies/:cid/goals` | Goal management | Complete |
| `CRUD /api/companies/:cid/projects` | Project management | Complete |
| `GET /api/companies/:cid/activity` | Activity log | Complete |
| `GET /api/companies/:cid/dashboard` | Dashboard summary | Complete |
| `GET /api/agents/me` | Agent self-info (JWT) | Complete |
| `CRUD /api/agent-issues` | Agent issue operations | Complete |

## Success Metrics

### MVP Scope (Phases 1-3)
- User registration and authentication working
- Company creation workflow functional
- Agent CRUD operations fully tested
- Issue/task management with checkout preventing race conditions
- Database schema stable and migrated
- Core API routes responding correctly

### Production Readiness (Phases 4-9)
- Full execution engine with real-time heartbeats
- Agent provisioning automated on Fly.io
- Frontend UI complete and usable
- Cost tracking and approval workflows functional
- 80%+ code coverage on critical paths
- Zero unhandled exceptions in production
- < 200ms API response times at p95

## Key Dependencies

- **Better Auth:** User session management (locked)
- **PostgreSQL:** Primary data store (locked)
- **Redis:** Real-time pub/sub (locked)
- **Fly.io:** Agent execution environment (locked)
- **Claude API:** Primary agent model (locked)
- **NestJS:** Backend framework with CQRS (locked)
- **React 19:** Frontend framework (locked)

## Constraints & Design Decisions

1. **Multi-tenancy:** All queries scoped by `companyId` (no cross-company data leaks)
2. **Clean Architecture:** Domain → Application → Infrastructure → Presentation layers
3. **CQRS Pattern:** Separate command handlers (mutations) from query handlers (reads)
4. **Adapter Pattern:** Pluggable AI models (Claude first, others follow)
5. **File Size Limit:** All code files < 200 LOC (forces modularization)
6. **Dual Auth:** User sessions (Better Auth) + Agent JWT (secure inter-agent communication)

## Development Roadmap

| Phase | Title | Status | Est. Duration |
|-------|-------|--------|----------------|
| 1 | Monorepo Scaffold + Shared Types + DB | COMPLETE | 1 week |
| 2 | Auth Module (Better Auth Integration) | COMPLETE | 1 week |
| 3 | Core CRUD (Companies, Agents, Issues) | COMPLETE | 2 weeks |
| 4 | Heartbeat + Execution Engine | PENDING | 2 weeks |
| 5 | Claude Adapter + Executor App | PENDING | 2 weeks |
| 6 | Frontend Pages & UI | PENDING | 3 weeks |
| 7 | Real-time Events & WebSocket | PENDING | 1 week |
| 8 | Cost Tracking + Approvals | PENDING | 2 weeks |
| 9 | Templates + Onboarding | PENDING | 2 weeks |

## Implementation Principles

- **YAGNI (You Aren't Gonna Need It):** Build only what's currently needed
- **KISS (Keep It Simple, Stupid):** Prefer simple solutions over complex ones
- **DRY (Don't Repeat Yourself):** Avoid code duplication through abstraction
- **Evidence-Based Documentation:** Only document code that exists in the repository
- **Modular Architecture:** Keep files focused and under 200 LOC

## Next Steps

1. **Phase 4:** Implement heartbeat service and execution engine orchestration
2. **Phase 5:** Build Claude adapter and Fastify executor application
3. **Phase 6:** Complete React frontend with all management pages
4. **Integration:** Ensure seamless agent-to-agent communication via JWT
5. **Testing:** Achieve 80%+ code coverage on critical paths

---

**Last Updated:** March 2026
**Maintainer:** AI Company Platform Team
**Reference:** See [docs/blueprint/](./blueprint/) for detailed technical specifications
