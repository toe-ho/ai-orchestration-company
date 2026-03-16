# 02 — System Architecture

## High-Level Architecture

```
                         User (Browser)
                              │
                    ┌─────────┴──────────┐
                    │     React UI        │
                    │  (cloud-hosted)     │
                    └─────────┬──────────┘
                              │ HTTPS / WebSocket
                              │
                    ┌─────────┴──────────────────────┐
                    │   CONTROL PLANE                 │
                    │   (NestJS API + Scheduler)      │
                    ├────────────────────────────────┤
                    │  Controllers (CQRS dispatch)    │
                    │  Commands + Queries (handlers)  │
                    │  Heartbeat Scheduler            │
                    │  Execution Engine               │
                    │  Auth (multi-tenant)            │
                    │  Cost Tracking                  │
                    │  Real-time Events (Redis)       │
                    └──┬─────────────┬───────────────┘
                       │             │
            ┌──────────┘             └──────────┐
            │                                    │
  ┌─────────┴──────────┐          ┌─────────────┴────────────┐
  │  PostgreSQL (Neon)  │          │  EXECUTION PLANE          │
  │  Multi-tenant DB    │          │  (Fly.io Machines)        │
  │  35+ tables         │          │                           │
  └─────────────────────┘          │  ┌─────────────────────┐  │
                                   │  │ Company A VM         │  │
            ┌──────────┐           │  │ ├── Agent Executor   │  │
            │ Redis     │           │  │ ├── Agent processes  │  │
            │ (Upstash) │           │  │ ├── Git workspace    │  │
            │ pub/sub   │           │  │ └── Persistent vol   │  │
            └──────────┘           │  └─────────────────────┘  │
                                   │                           │
            ┌──────────┐           │  ┌─────────────────────┐  │
            │ S3       │           │  │ Company B VM         │  │
            │ Storage  │           │  │ ├── Agent Executor   │  │
            │          │           │  │ └── ...              │  │
            └──────────┘           │  └─────────────────────┘  │
                                   └──────────────────────────┘

              Agent processes call BACK to Control Plane API
              using injected API key + environment variables
```

## Control Plane vs Execution Plane

This is the fundamental architectural split:

| | Control Plane | Execution Plane |
|---|---|---|
| **What** | API server, DB, scheduling | Where agent code actually runs |
| **Where** | Cloud-hosted (Railway or Fly.io) | Fly.io VM per company |
| **Manages** | Tasks, org chart, budgets, auth | Agent processes, workspaces, tools |
| **Scales** | Horizontally (more API servers) | Per-company (1 VM per company) |

### Why Split?

The split cleanly separates orchestration concerns (scheduling, auth, cost tracking) from execution concerns (running agent processes, managing workspaces). This enables:
- **Independent scaling:** API server scales horizontally; VMs scale per-company
- **Isolation:** Each company's agents run in their own VM with separate workspace
- **Cost efficiency:** VMs hibernate when idle; API server runs continuously

## The Execution Engine

The Execution Engine is the component responsible for dispatching agent execution requests to Fly.io VMs and streaming results back.

```typescript
class ExecutionEngine {
  execute(request: ExecutionRequest): AsyncIterable<ExecutionEvent>;
  cancel(runId: string): Promise<void>;
}
```

- Sends execution requests to the Agent Executor running on the company's Fly.io VM
- Receives SSE-streamed events (stdout, stderr, status) back to the control plane
- Handles VM wake-up (via Provisioner) before dispatching

## Component Communication

### UI → Control Plane
- HTTPS REST API (fetch wrapper)
- WebSocket for real-time events
- Cookie-based session auth

### Control Plane → Database
- TypeORM (type-safe PostgreSQL, Clean Architecture repository pattern)
- Multi-tenant: every query filters by `companyId`
- Neon managed PostgreSQL (PgBouncer connection pooling)

### Control Plane → Execution Plane
- HTTP POST to Agent Executor on Fly.io VM
- Results streamed back via SSE

### Execution Plane → Control Plane (Agent Callbacks)
- Agent processes call REST API using injected `API_KEY` + `API_URL`
- Task checkout, status updates, comments, delegation
- `X-Run-Id` header links actions to specific heartbeat run

### Real-time Updates
- Redis pub/sub (Upstash) → WebSocket to browser

## Monorepo Package Structure

```
your-product/
├── apps/
│   ├── api/                ← NestJS API (CQRS)
│   ├── web/                ← React frontend (Vite)
│   ├── executor/           ← Agent Executor (Fly.io VM)
│   └── scheduler/          ← Heartbeat scheduler (separate process)
├── packages/
│   ├── shared/             ← Types, constants, validators
│   ├── adapters/           ← Agent runtime integrations
│   └── adapter-utils/      ← Shared adapter utilities
├── config/
│   ├── skills/             ← Agent instruction files
│   └── templates/          ← Company templates
├── tests/                  ← E2E tests (Playwright)
├── turbo.json
└── package.json
```

## Cloud Infrastructure

```
┌──────────────────────────────────────────────────┐
│  Cloud Infrastructure                             │
│                                                    │
│  ┌─────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ API Server   │  │ PostgreSQL │  │ Redis      │ │
│  │ (Railway/    │  │ (Neon)     │  │ (Upstash)  │ │
│  │  Fly.io)     │  │            │  │            │ │
│  └──────┬──────┘  └────────────┘  └────────────┘ │
│         │                                          │
│         │  Per-Company VMs (Fly.io Machines)       │
│         │                                          │
│  ┌──────┴──────┐ ┌────────────┐ ┌────────────┐   │
│  │ Company A   │ │ Company B  │ │ Company C  │   │
│  │ VM (Fly.io) │ │ VM (Fly.io)│ │ VM (Fly.io)│   │
│  │ 4cpu/8GB    │ │ 2cpu/4GB   │ │ 2cpu/4GB   │   │
│  │ + 10GB vol  │ │ + 5GB vol  │ │ + 5GB vol  │   │
│  └─────────────┘ └────────────┘ └────────────┘   │
│                                                    │
│  ┌─────────────┐                                  │
│  │ S3 Storage  │ (logs, attachments)              │
│  └─────────────┘                                  │
└──────────────────────────────────────────────────┘
```

## Key Architectural Decisions

### 1. One VM per Company (Not Per Agent)
Agents within a company share workspace (git repos, files). One Fly.io Machine per company keeps costs low (~$10-20/month). VM hibernates when idle.

### 2. Multi-Tenant by Design
Every entity has `companyId`. One database serves all users. Row-level isolation via query filtering. Users never see each other's data.

### 3. API Key Only (No Subscriptions)
Users provide their own LLM API keys (Anthropic, OpenAI, Google). Keys stored encrypted in control plane DB. Injected into VMs at runtime as environment variables. Never stored on VM disk.

### 4. Heartbeat Model (Not Continuous)
Agents run in discrete windows (heartbeats), not continuously. Prevents runaway costs. Enables human oversight. Simplifies crash recovery.

### 5. Atomic Task Checkout
Only one agent can own a task at a time. `POST /issues/:id/checkout` returns 409 if already owned. Never retry. This prevents double-work.

### 6. Managed Services Only
PostgreSQL via Neon/Supabase, Redis via Upstash, storage via S3. No self-hosted infrastructure to manage. Backups, scaling, and availability handled by providers.
