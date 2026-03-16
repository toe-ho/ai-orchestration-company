# Codebase Summary

## Overview

AI Company Platform is a monorepo built with **pnpm workspaces** and **Turborepo**. It comprises three applications (backend, web, executor) and three shared packages (shared types, adapters, adapter utilities).

**Total:** ~356 TypeScript files across all apps/packages, ~5,900 LOC (excluding node_modules and migrations).

## Directory Structure & LOC Breakdown

```
ai-orchestration-company/
├── apps/                          (~120 files, ~4,200 LOC)
│   ├── backend/                   (~120 files, ~3,969 LOC)
│   ├── web/                       (~3 files, ~150 LOC)
│   └── executor/                  (~4 files, ~120 LOC)
├── packages/                      (~58 files, ~1,700 LOC)
│   ├── shared/                    (~51 files, ~1,400 LOC)
│   ├── adapters/                  (~3 files, ~100 LOC)
│   └── adapter-utils/             (~4 files, ~200 LOC)
├── config/
│   ├── skills/                    (empty, waiting for templates)
│   └── templates/                 (empty, waiting for templates)
├── docs/
│   ├── blueprint/                 (25+ detailed specs)
│   ├── project-overview-pdr.md
│   ├── code-standards.md
│   ├── system-architecture.md
│   └── [other operational docs]
└── [root configs, docker-compose, etc.]
```

## Backend Application (apps/backend)

**Purpose:** NestJS-based REST API + scheduler for company and agent management

**Architecture:** Clean Architecture (Domain → Application → Infrastructure → Presentation) + CQRS pattern

### File Organization

```
apps/backend/src/
├── main.ts                                    # App entry point
├── guard/                                     # Authorization guards (4 files)
│   ├── company-access-guard.ts
│   ├── company-role-guard.ts
│   ├── board-auth-guard.ts
│   └── agent-auth-guard.ts
├── domain/                                    # Business logic & interfaces
│   ├── entities/                              # Pure domain models (~8 files)
│   ├── exceptions/                            # Custom exceptions (~6 files)
│   ├── interfaces/                            # Domain contracts (~5 files)
│   ├── repositories/                          # Repository interfaces (~9 files)
│   └── services/                              # Domain services (if any)
├── application/                               # Use cases & orchestration
│   ├── commands/                              # Mutation handlers (~18 files)
│   │   ├── activity/                          # Log activity
│   │   ├── agent/                             # Create, pause, resume, terminate, update
│   │   ├── company/                           # Create, delete, update
│   │   ├── goal/                              # Create, update
│   │   ├── issue/                             # Create, checkout, release, update, comment
│   │   └── project/                           # Create, update
│   ├── queries/                               # Read handlers (~14 files)
│   │   ├── activity/                          # List activity
│   │   ├── agent/                             # Get, list, org-tree
│   │   ├── company/                           # Get, list
│   │   ├── dashboard/                         # Summary
│   │   ├── goal/                              # List
│   │   ├── issue/                             # Get, list, search, comments
│   │   ├── project/                           # Get, list
│   │   └── activity/                          # List
│   └── services/                              # Application services
│       ├── impl/                              # Service implementations
│       └── i-*.ts                             # Service interfaces
├── infrastructure/                            # Implementation details
│   ├── persistence/
│   │   ├── models/                            # TypeORM entities (~13 files)
│   │   ├── repositories/                      # Repository implementations (~9 files)
│   │   ├── migrations/                        # DB migrations (~3 files)
│   │   ├── data-source.ts                     # TypeORM configuration
│   │   └── database-module.ts                 # NestJS module
│   ├── config/                                # Config loaders (~5 files)
│   │   ├── app-config.ts
│   │   ├── database-config.ts
│   │   ├── auth-config.ts
│   │   ├── redis-config.ts
│   │   └── flyio-config.ts
│   └── services/                              # Infrastructure services
│       └── impl/                              # Service implementations
├── presentation/                              # HTTP layer
│   ├── controllers/                           # NestJS controllers (~11 files)
│   │   └── impl/
│   │       ├── auth-controller.ts
│   │       ├── company-controller.ts
│   │       ├── agent-controller.ts
│   │       ├── issue-controller.ts
│   │       ├── goal-controller.ts
│   │       ├── project-controller.ts
│   │       ├── activity-controller.ts
│   │       ├── dashboard-controller.ts
│   │       ├── health-controller.ts
│   │       ├── agent-issue-controller.ts
│   │       └── board-controller.ts
│   ├── dtos/                                  # Request/response DTOs
│   └── decorators/                            # Custom decorators (~5 files)
├── auth/                                      # Better Auth integration
│   └── auth-module.ts
└── module/                                    # NestJS module setup
    └── api-module.ts
```

### Key Statistics

| Metric | Count |
|--------|-------|
| Controllers | 11 |
| Command Handlers | 18 |
| Query Handlers | 14 |
| Repository Implementations | 9 |
| Domain Interfaces | 8 |
| TypeORM Models | 13 |
| Guards | 4 |
| Config Loaders | 5 |
| Decorators | 5 |
| Interceptors | 3 |

### Core Entities

- **Company:** Business entity, root of multi-tenancy
- **Agent:** Autonomous AI worker assigned to company
- **User:** Human user with sessions
- **Issue:** Task/work item assigned to agents
- **Goal:** Strategic objective for company
- **Project:** Organizational unit grouping issues
- **Activity:** Audit log entry (immutable)
- **IssueComment:** Comments on issues
- **UserCompany:** User-to-company relationship with roles
- **AgentApiKey:** Agent authentication token
- **CompanyApiKey:** Company authentication token
- **Heartbeat:** Agent health check record
- **CompanyVM:** Fly.io VM metadata
- **CompanyTemplate:** Pre-built company configuration
- **Session:** Better Auth session

### CQRS Pattern

**Commands (Mutations):**
- Each handler owns a specific mutation (create, update, delete)
- Handlers inject repositories to execute domain logic
- Emit domain events (activity logs)
- Validate inputs via Zod schemas

**Queries (Reads):**
- Separate handlers for different read scenarios
- Optimized for presentation (DTO mapping)
- All scoped by `companyId` (multi-tenant isolation)
- Support filtering, sorting, pagination

### API Endpoints

| Route | Method | Handler | Purpose |
|-------|--------|---------|---------|
| `/api/auth/*` | * | Better Auth | Authentication |
| `/api/health` | GET | HealthController | Readiness check |
| `/api/companies` | GET/POST | CompanyController | CRUD |
| `/api/companies/:cid` | GET/PUT | CompanyController | CRUD |
| `/api/companies/:cid/agents` | GET/POST | AgentController | Create, list |
| `/api/companies/:cid/agents/:aid` | GET/PUT | AgentController | Get, update |
| `/api/companies/:cid/agents/tree` | GET | AgentController | Org tree |
| `/api/companies/:cid/agents/:aid/pause` | POST | AgentController | Pause |
| `/api/companies/:cid/agents/:aid/resume` | POST | AgentController | Resume |
| `/api/companies/:cid/agents/:aid/terminate` | POST | AgentController | Terminate |
| `/api/companies/:cid/issues` | GET/POST | IssueController | CRUD, search |
| `/api/companies/:cid/goals` | GET/POST | GoalController | CRUD |
| `/api/companies/:cid/projects` | GET/POST | ProjectController | CRUD |
| `/api/companies/:cid/activity` | GET | ActivityController | List |
| `/api/companies/:cid/dashboard` | GET | DashboardController | Summary |
| `/api/agents/me` | GET | AgentIssueController | Agent self-info |
| `/api/agent-issues` | POST/PUT | AgentIssueController | Agent operations |
| `/api/board/*` | * | BoardController | Board operations |

## Shared Package (packages/shared)

**Purpose:** Shared types, interfaces, enums, and validators used across all apps

**Files:** ~51 (1,400 LOC)

### Exports

| Category | Count | Examples |
|----------|-------|----------|
| Entity Interfaces | 24 | ICompany, IAgent, IIssue, IGoal, IProject, IActivity, etc. |
| Enums | 11 | AgentStatus, IssueStatus, ActivityType, ActorType, etc. |
| Core Interfaces | 5 | IAdapter, IExecutionRequest, IExecutionEvent, IActor, ISessionCodec |
| Zod Schemas | 3 | Validation schemas for key entities |
| Constants | 2 | API routes, feature flags |

### Key Interfaces

```typescript
// Adapter pattern (pluggable AI models)
interface IAdapter {
  execute(req: IExecutionRequest): AsyncIterable<IExecutionEvent>;
  cancel(runId: string): Promise<void>;
  health(): Promise<HealthStatus>;
}

// Execution pipeline
interface IExecutionRequest {
  runId: string;
  agentId: string;
  prompt: string;
  tools?: ITool[];
  context?: Record<string, unknown>;
}

interface IExecutionEvent {
  type: 'start' | 'token' | 'tool-call' | 'tool-result' | 'end' | 'error';
  data: unknown;
  timestamp: string;
}

// Multi-tenancy & auth
interface IActor {
  id: string;
  type: 'user' | 'agent';
  companyId: string;
}

// Session serialization
interface ISessionCodec {
  encode(session: unknown): string;
  decode(encoded: string): unknown;
}
```

### Enums

- **AgentStatus:** idle, running, paused, terminated
- **IssueStatus:** open, in-progress, blocked, closed, resolved
- **ActivityType:** create, update, delete, checkout, comment, etc.
- **ActorType:** user, agent, system
- **GoalStatus:** active, completed, archived
- **ProjectStatus:** active, completed, archived

## Adapters Package (packages/adapters)

**Purpose:** AI model integrations (Claude first, extensible)

**Files:** 3 (100 LOC)

### Contents

- **AdapterRegistry:** Plugin system for runtime adapter registration
- **BaseAdapter:** Abstract base class for adapter implementations
- **ClaudeAdapter:** (Pending) Claude API integration

## Adapter Utils Package (packages/adapter-utils)

**Purpose:** Shared utilities for adapter implementations

**Files:** 4 (200 LOC)

### Utilities

- **BaseSessionCodec:** JSON↔Base64 session serialization
- **cleanEnv():** Security filter removing sensitive env vars for child processes
- **spawnWithTimeout():** Child process executor with timeout protection
- **LogStream:** Logging utilities for execution tracking

## Web Application (apps/web)

**Status:** Placeholder (React 19 + Vite setup, ~150 LOC)

**Purpose:** Frontend for user/company/agent management

**Stack:** React 19, Vite, Tailwind CSS 4, shadcn/ui, React Query, React Router 6

**Pending:** All pages and components

## Executor Application (apps/executor)

**Status:** Stub (~120 LOC)

**Purpose:** Fastify-based agent execution environment

**Technology:** Fastify, TypeScript

**Pending:** Full implementation in Phase 5

## Dependency Graph

```
web (React)
  └─> shared (types)
       └─> [API calls to backend]

backend (NestJS)
  └─> shared (types)
  └─> adapters (IAdapter plugins)
  └─> adapter-utils (utilities)
  └─> database (TypeORM + PostgreSQL)
  └─> redis (pub/sub)

executor (Fastify)
  └─> shared (types)
  └─> adapters (IAdapter plugins)
  └─> adapter-utils (utilities)
```

## Build System & Commands

**Package Manager:** pnpm 9

**Build Tool:** Turborepo 2 (task caching, parallel execution)

### Key Commands

```bash
# Install dependencies
pnpm install

# Run dev servers (all apps)
turbo dev

# Build all apps
turbo build

# Run tests
turbo test

# Database migrations
turbo db:migrate

# Type check
turbo type-check

# Lint
turbo lint
```

## Testing Framework

**Tool:** Vitest 1.4

**Status:** Tests for Phase 3 (CRUD operations) complete and passing

**Coverage Target:** 80%+ on critical paths

### Test Files Location

Each feature has corresponding test files:
- `*.spec.ts` for unit tests
- `*.e2e.ts` for integration tests

## Database Schema

**Technology:** PostgreSQL 16 + TypeORM 0.3.20

**Migrations:** 3 files
1. `1710000000000-InitialSchema.ts` — Core entities
2. `1710000000001-BetterAuthTables.ts` — Better Auth session/user tables
3. `1710000000002-IssueCommentAndActivityEntry.ts` — Comments and activity log

**Multi-tenancy:** All tables include `companyId` foreign key

## Authentication Flow

**User Session:** Better Auth 1.5.5 (email/password, OAuth-ready)
- Session stored in PostgreSQL
- JWT in HTTP-only cookies

**Agent JWT:** Custom JWT service
- Signed with company secret
- Contains agent metadata
- Verified by AgentAuthGuard

## Performance Considerations

- **Response Times:** Target < 200ms at p95 for API calls
- **Database Indexes:** Indexed on companyId, userId, agentId
- **Redis Caching:** Available for real-time pub/sub (Phase 7)
- **File Size Limits:** All code files < 200 LOC (forces modularization)

## Security Measures

- **Multi-tenancy Isolation:** All queries scoped by companyId
- **Guards:** 4 guards enforce authorization (CompanyAccess, AgentAuth, BoardAuth, CompanyRole)
- **Decorators:** Custom decorators inject current actor, company, role info
- **API Key Encryption:** Both user and agent keys stored encrypted
- **Session Validation:** Better Auth validates all user sessions
- **Environment Sanitization:** cleanEnv() removes secrets before spawning processes

## Development Workflow

1. **Code:** Write TypeScript with strict mode enabled
2. **Format:** Follow established conventions (see code-standards.md)
3. **Test:** Run `turbo test` for unit/integration tests
4. **Type Check:** `turbo type-check` to catch type errors
5. **Lint:** `turbo lint` for style consistency
6. **Commit:** Push clean commits to feature branches
7. **Review:** Code review before merging to main
8. **Merge:** Merge to main with passing CI/CD checks

---

**Last Updated:** March 2026
**Total LOC:** ~5,900 (excluding node_modules)
**Total Files:** ~356 TypeScript files
**Reference:** See [project-overview-pdr.md](./project-overview-pdr.md) for product context
