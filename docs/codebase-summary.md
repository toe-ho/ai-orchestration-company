# Codebase Summary

## Overview

AI Company Platform is a monorepo built with **pnpm workspaces** and **Turborepo**. It comprises three applications (backend, web, executor) and three shared packages (shared types, adapters, adapter utilities).

**Total:** ~428 TypeScript files across all apps/packages, ~10,213 LOC (excluding node_modules and migrations). Phase 6 adds ~2,013 LOC across web frontend.

## Directory Structure & LOC Breakdown

```
ai-orchestration-company/
├── apps/                          (~178 files, ~8,513 LOC)
│   ├── backend/                   (~120 files, ~3,969 LOC)
│   ├── web/                       (~48 files, ~2,013 LOC) — Phase 6 Complete
│   └── executor/                  (~7 files, ~2,381 LOC) — Phase 5 Complete
├── packages/                      (~70 files, ~2,100 LOC)
│   ├── shared/                    (~51 files, ~1,400 LOC)
│   ├── adapters/                  (~7 files, ~350 LOC) — Phase 5 Complete
│   └── adapter-utils/             (~6 files, ~400 LOC) — Phase 5 Complete
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
│       ├── interface/                         # Service interfaces
│       ├── execution-engine-service.ts        # Orchestrates agent execution (Phase 4)
│       ├── flyio-provisioner-service.ts       # VM provisioning via Fly.io (Phase 4)
│       ├── scheduler-service.ts               # Heartbeat scheduling (Phase 4)
│       ├── redis-company-event-publisher.ts   # Publish events to Redis (Phase 7)
│       └── i-*.ts                             # Interface definitions
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
│   ├── gateways/                              # WebSocket gateways (Phase 7)
│   │   └── live-events-gateway.ts             # Socket.io gateway for real-time events
│   ├── dtos/                                  # Request/response DTOs
│   └── decorators/                            # Custom decorators (~5 files)
├── auth/                                      # Better Auth integration
│   └── auth-module.ts
└── module/                                    # NestJS module setup
    ├── api-module.ts
    └── realtime-module.ts                     # WebSocket/Redis module (Phase 7)
```

### Key Statistics

| Metric | Count |
|--------|-------|
| Controllers | 12 |
| Command Handlers | 22 |
| Query Handlers | 16 |
| Repository Implementations | 14 |
| Domain Interfaces | 10 |
| TypeORM Models | 17 |
| Guards | 4 |
| Config Loaders | 6 |
| Decorators | 5 |
| Interceptors | 3 |
| Services (Phase 4) | 4 |

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
- **CompanyVM:** Fly.io VM metadata (Phase 4)
- **HeartbeatRun:** Execution run tracking (Phase 4)
- **HeartbeatRunEvent:** Execution event log (Phase 4)
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
| `/api/companies/:cid/runs` | GET/DELETE | RunController | Execution run tracking (Phase 4) |
| `/api/companies/:cid/vm/wake` | POST | VmController | Wake hibernating VM (Phase 4) |
| `/api/companies/:cid/vm/hibernate` | POST | VmController | Suspend VM (Phase 4) |
| `/api/companies/:cid/vm/destroy` | POST | VmController | Destroy VM (Phase 4) |

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

**Files:** 7+ (350+ LOC) — Phase 5 Complete

### Contents

- **adapter-interface.ts:** IAdapter interface (execute, cancel, health)
- **adapter-registry.ts:** Plugin system for runtime adapter registration
- **claude/claude-adapter.ts:** Claude CLI spawning, JSON parsing, SSE streaming
- **claude/claude-output-parser.ts:** Parse newline-delimited JSON from claude CLI
- **claude/claude-session-manager.ts:** Manage .claude/session files per agent+task
- **BaseAdapter:** Abstract base class for adapter implementations

## Adapter Utils Package (packages/adapter-utils)

**Purpose:** Shared utilities for adapter implementations

**Files:** 6+ (400+ LOC) — Phase 5 Complete

### Utilities

- **session-codec.ts:** JSON↔Base64 session serialization
- **env-cleaner.ts:** Security filter removing sensitive env vars for child processes
- **process-helpers.ts:** Child process spawn, kill-tree, timeout management
- **sse-formatter.ts:** Format IExecutionEvent → Server-Sent Events text
- **BaseSessionCodec:** Default JSON↔Base64 codec implementation
- **LogStream:** Logging utilities for execution tracking

## Web Application (apps/web)

**Status:** COMPLETE (Phase 7) — ~2,200+ LOC, 52+ files

**Purpose:** Frontend for user/company/agent management with real-time updates

**Stack:** React 19, Vite, Tailwind CSS 4, shadcn/ui, React Query v5, React Router v6, socket.io-client

### File Organization

```
apps/web/src/
├── main.tsx                                    # Vite entry point
├── app.tsx                                     # Root route setup
├── pages/                                      # Page components
│   ├── auth/
│   │   ├── sign-in-page.tsx
│   │   └── sign-up-page.tsx
│   ├── dashboard/
│   │   └── dashboard-page.tsx
│   ├── agents/
│   │   ├── agents-list-page.tsx
│   │   └── agent-detail-page.tsx
│   ├── issues/
│   │   ├── issues-list-page.tsx
│   │   └── issue-detail-page.tsx
│   ├── runs/
│   │   └── run-detail-page.tsx
│   └── settings/
│       ├── company-settings-page.tsx
│       ├── api-keys-page.tsx
│       └── members-page.tsx
├── components/                                 # Reusable components (~28 files)
│   ├── layout/
│   │   ├── app-shell.tsx                      # Now calls useLiveEvents() (Phase 7)
│   │   ├── sidebar.tsx
│   │   ├── top-bar.tsx
│   │   └── breadcrumbs.tsx
│   ├── agents/
│   │   ├── agent-card.tsx
│   │   ├── agent-status-badge.tsx
│   │   └── org-chart.tsx
│   ├── issues/
│   │   ├── issue-card.tsx
│   │   ├── issue-status-badge.tsx
│   │   ├── kanban-board.tsx
│   │   └── kanban-column.tsx
│   ├── runs/
│   │   ├── run-event-stream.tsx               # No longer polls (WebSocket) (Phase 7)
│   │   └── run-card.tsx
│   └── shared/
│       ├── protected-route.tsx
│       ├── empty-state.tsx
│       ├── confirm-dialog.tsx
│       └── status-badge.tsx
├── providers/                                  # Context providers (~3 files)
│   ├── auth-provider.tsx
│   ├── company-provider.tsx
│   └── theme-provider.tsx
├── hooks/                                      # Custom hooks (~5+ files)
│   ├── use-auth.ts
│   ├── use-company.ts
│   ├── use-theme.ts
│   ├── use-websocket.ts                       # WebSocket connection (Phase 7)
│   └── use-live-events.ts                     # Event subscription (Phase 7)
├── lib/                                        # Utilities & API clients
│   ├── api-client.ts                           # Base fetch wrapper
│   ├── query-keys.ts                           # React Query keys
│   ├── utils.ts                                # Helper functions
│   ├── websocket-client.ts                     # Socket.io singleton factory (Phase 7)
│   └── api/                                    # Domain-specific API modules (~9 files)
│       ├── auth-api.ts
│       ├── companies-api.ts
│       ├── agents-api.ts
│       ├── issues-api.ts
│       ├── goals-api.ts
│       ├── projects-api.ts
│       ├── dashboard-api.ts
│       ├── heartbeat-runs-api.ts
│       └── vm-api.ts
└── [tailwind config, vite config]
```

### Key Features

**Pages (11 total):**
- Sign In & Sign Up (auth flow)
- Dashboard (company metrics + recent activity)
- Agents List & Detail (with org chart)
- Issues List & Detail (with checkout/release)
- Run Detail (execution history)
- Settings (company, API keys, members)

**Components (28 total):**
- Layout: AppShell, Sidebar, TopBar (company switcher, dark mode, user menu), Breadcrumbs
- Agents: AgentCard, AgentStatusBadge, OrgChart
- Issues: IssueCard, IssueStatusBadge, KanbanBoard
- Runs: RunEventStream (real-time events), RunCard
- Shared: ProtectedRoute, EmptyState, ConfirmDialog, StatusBadge

**Providers (3):**
- AuthProvider (Better Auth session management)
- CompanyProvider (current company context)
- ThemeProvider (dark/light mode)

**API Client Layer (9 domain modules):**
- Base fetch wrapper with error handling
- Query keys for React Query caching
- Domain-specific API modules: auth, companies, agents, issues, goals, projects, dashboard, runs, VM

### Performance & Styling

- Tailwind CSS 4 with custom theme
- shadcn/ui components for consistency
- React Query v5 for caching & sync
- Responsive design (375px-1920px)
- Dark mode support
- Load time target: < 3s

## Executor Application (apps/executor)

**Status:** COMPLETE (Phase 5) (~800+ LOC)

**Purpose:** Fastify-based agent execution environment on Fly.io VMs

**Technology:** Fastify, TypeScript, Child Process, SSE Streaming

### File Organization

```
apps/executor/src/
├── main.ts                                    # Fastify server setup, graceful shutdown
├── routes/
│   ├── execute-route.ts                       # POST /execute handler, SSE streaming
│   ├── cancel-route.ts                        # POST /cancel handler
│   └── health-route.ts                        # GET /health handler
├── services/
│   ├── execution-manager.ts                   # Track active runs, concurrency control
│   └── auth-validator.ts                      # JWT verification, actor extraction
└── Dockerfile                                 # Multi-stage build for Fly.io VMs
```

### Key Components

- **ExecutionManager:** Maintains Map<runId, { adapter, process, startedAt }>, enforces 1 concurrent run/agent, timeout/cleanup
- **AuthValidator:** Verifies agent JWT (AGENT_JWT_SECRET), extracts agentId/companyId/runId metadata
- **SSE Streaming:** Pipes execution events as Server-Sent Events (event: type\ndata: json\n\n)
- **Graceful Shutdown:** Handles SIGTERM, kills child processes, closes HTTP connections

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

## Phase 4: Heartbeat Engine & Execution

**Status:** COMPLETE (Implementation added March 16, 2026)

### Components

**1. Heartbeat Engine**
- InvokeHeartbeatHandler: 10-step orchestrator for run coordination
- WakeupAgentHandler: Agent activation with coalescing
- CancelRunHandler: Cancellation logic
- ReapOrphanedRunsHandler: Cleanup of stale runs

**2. Execution Engine**
- ExecutionEngineService: HTTP POST + SSE stream parsing
- IExecutionRunner interface: Abstraction for runners
- LocalRunner: Development environment execution
- CloudRunner: Fly.io cloud execution

**3. VM Provisioner**
- FlyioProvisionerService: Fly.io Machines API integration
- CompanyVM tracking: States (stopped → starting → running → hibernating)
- Machine lifecycle management

**4. Scheduler**
- SchedulerService: Handles heartbeat ticks & orphan reaping
- PostgreSQL advisory locks: Prevents duplicate scheduling
- Runs every 30 seconds

### Infrastructure Additions

**Models & Repositories**
- 4 new TypeORM models (CompanyVM, HeartbeatRun, HeartbeatRunEvent, etc.)
- 5 new repository implementations
- Fly.io REST client integration
- Redis live event publisher

**Security**
- AES-256-GCM encryption for API key vault
- Multi-tenant isolation maintained
- Execution isolation per company

**New API Endpoints**
- GET/DELETE /companies/:cid/runs (execution history)
- POST /companies/:cid/vm/wake (activate VM)
- POST /companies/:cid/vm/hibernate (suspend VM)
- POST /companies/:cid/vm/destroy (terminate VM)

## Phase 7: Real-time Events & WebSocket (NEW)

**Status:** COMPLETE (Implementation added March 17, 2026)

### Components

**1. Backend Gateway**
- LiveEventsGateway: @nestjs/websockets gateway using socket.io
- Authenticates via Better Auth session cookie
- Subscribes to Redis `company:{companyId}` channel
- Broadcasts events to connected clients in company

**2. Event Publishers**
- RedisCompanyEventPublisher: Publishes domain events to Redis
- Integration points: PauseAgentHandler, ResumeAgentHandler, CheckoutIssueHandler, UpdateIssueHandler, OnHeartbeatCompletedHandler

**3. Frontend Client**
- websocket-client.ts: Socket.io singleton factory with auto-reconnect
- use-websocket.ts: Hook for connection state management
- use-live-events.ts: Hook for subscribing to company events
- Integrated in AppShell for always-on updates

**4. UI Updates**
- RunEventStream: Now subscribes via WebSocket (no polling)
- Live agent status in dashboard
- Live issue updates in list
- Activity feed real-time refresh

### Key Metrics

- Backend gateway: Real-time module integration
- Frontend hooks: 2 new hooks for WebSocket + events
- Event latency: < 100ms
- Connection establishment: < 1 second
- Auto-reconnect: exponential backoff

---

## Phase 5: Claude Adapter + Executor App

**Status:** COMPLETE (Implementation added March 17, 2026)

### Components

**1. Claude Adapter**
- ClaudeAdapter: Spawns `claude` CLI, passes prompt via temp file, handles --context-file for sessions
- ClaudeOutputParser: Parses newline-delimited JSON output, extracts usage stats
- ClaudeSessionManager: Manages .claude/session directories per agent+task, handles cleanup

**2. Executor Application**
- 3 HTTP routes (POST /execute, POST /cancel, GET /health)
- ExecutionManager: Tracks active runs, enforces concurrency limits, timeout management
- AuthValidator: JWT verification, actor metadata extraction
- Graceful shutdown on SIGTERM

**3. Utilities**
- SSE formatter: Converts IExecutionEvent to Server-Sent Events format
- Process helpers: Spawn with timeout, kill-tree cleanup, stream parsing
- Env cleaner: Allowlist approach (only ANTHROPIC_API_KEY + system vars)
- Session codec: Base64 serialization for session state

**4. Infrastructure**
- Dockerfile: Multi-stage build, pre-installs @anthropic-ai/claude-code CLI
- AdapterRegistry: Plugin resolution system for adapter types

### Key Metrics

- Executor: 2,381 LOC across 7 files
- Adapters: 350 LOC (Claude CLI integration)
- Adapter-utils: 400 LOC (SSE, process helpers, session management)
- Total Phase 5: ~2,300 LOC
- Test coverage: Unit tests for adapter, executor routes, concurrency

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

**Last Updated:** March 17, 2026
**Total LOC:** ~10,500+ (excluding node_modules)
**Total Files:** ~440+ TypeScript files
**Phase 7 Status:** COMPLETE (Real-time Events & WebSocket)
**Next Phase:** Phase 8 (Cost Tracking + Approvals)
**Reference:** See [project-overview-pdr.md](./project-overview-pdr.md) for product context
